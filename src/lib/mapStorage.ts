// IndexedDB utilities for offline map storage

export async function openMapDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('JinfoAppMaps', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('maps')) {
        db.createObjectStore('maps');
      }
      if (!db.objectStoreNames.contains('tiles')) {
        db.createObjectStore('tiles');
      }
    };
  });
}

export async function downloadTiles(config: any, onProgress: (progress: number) => void) {
  const tiles = [];
  const { bounds_north, bounds_south, bounds_east, bounds_west, zoom_min, zoom_max } = config;
  
  let totalTiles = 0;
  let downloadedTiles = 0;
  
  // Calculate total tiles
  for (let zoom = zoom_min; zoom <= zoom_max; zoom++) {
    const n = Math.pow(2, zoom);
    const minTileX = Math.floor(((bounds_west + 180) / 360) * n);
    const maxTileX = Math.floor(((bounds_east + 180) / 360) * n);
    const minTileY = Math.floor(((1 - Math.log(Math.tan(bounds_north * Math.PI / 180) + 1 / Math.cos(bounds_north * Math.PI / 180)) / Math.PI) / 2) * n);
    const maxTileY = Math.floor(((1 - Math.log(Math.tan(bounds_south * Math.PI / 180) + 1 / Math.cos(bounds_south * Math.PI / 180)) / Math.PI) / 2) * n);
    
    totalTiles += (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);
  }
  
  console.log('[MapStorage] Total tiles to download:', totalTiles);
  
  // Download tiles with rate limiting
  for (let zoom = zoom_min; zoom <= zoom_max; zoom++) {
    const n = Math.pow(2, zoom);
    const minTileX = Math.floor(((bounds_west + 180) / 360) * n);
    const maxTileX = Math.floor(((bounds_east + 180) / 360) * n);
    const minTileY = Math.floor(((1 - Math.log(Math.tan(bounds_north * Math.PI / 180) + 1 / Math.cos(bounds_north * Math.PI / 180)) / Math.PI) / 2) * n);
    const maxTileY = Math.floor(((1 - Math.log(Math.tan(bounds_south * Math.PI / 180) + 1 / Math.cos(bounds_south * Math.PI / 180)) / Math.PI) / 2) * n);
    
    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        const url = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
        
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          
          tiles.push({
            zoom,
            x,
            y,
            blob
          });
          
          downloadedTiles++;
          onProgress(Math.round((downloadedTiles / totalTiles) * 100));
          
          // Rate limiting: 50ms between requests
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`[MapStorage] Failed to download tile ${zoom}/${x}/${y}`, error);
        }
      }
    }
  }
  
  console.log('[MapStorage] Downloaded tiles:', tiles.length);
  return tiles;
}

export async function saveMapToIndexedDB(tripId: string, mapData: any) {
  const db = await openMapDatabase();
  
  // Save map metadata
  const mapTx = db.transaction(['maps'], 'readwrite');
  const mapStore = mapTx.objectStore('maps');
  await mapStore.put(mapData, tripId);
  
  console.log('[MapStorage] Saved map metadata for trip:', tripId);
  
  // Save tiles
  const tileTx = db.transaction(['tiles'], 'readwrite');
  const tileStore = tileTx.objectStore('tiles');
  
  for (const tile of mapData.tiles) {
    const key = `${tripId}_${tile.zoom}_${tile.x}_${tile.y}`;
    await tileStore.put(tile.blob, key);
  }
  
  console.log('[MapStorage] Saved', mapData.tiles.length, 'tiles');
}

export async function deleteMapFromIndexedDB(tripId: string) {
  const db = await openMapDatabase();
  
  // Delete map metadata
  const mapTx = db.transaction(['maps'], 'readwrite');
  await new Promise<void>((resolve, reject) => {
    const request = mapTx.objectStore('maps').delete(tripId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  // Delete tiles
  const tileTx = db.transaction(['tiles'], 'readwrite');
  const tileStore = tileTx.objectStore('tiles');
  const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
    const request = tileStore.getAllKeys();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  for (const key of keys) {
    if (typeof key === 'string' && key.startsWith(tripId)) {
      await new Promise<void>((resolve, reject) => {
        const request = tileStore.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }
  
  console.log('[MapStorage] Deleted map for trip:', tripId);
}

export async function getMapFromIndexedDB(tripId: string) {
  const db = await openMapDatabase();
  const tx = db.transaction(['maps'], 'readonly');
  const store = tx.objectStore('maps');
  return await new Promise<any>((resolve, reject) => {
    const request = store.get(tripId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getTileFromIndexedDB(tripId: string, zoom: number, x: number, y: number): Promise<Blob | null> {
  try {
    const db = await openMapDatabase();
    const tx = db.transaction(['tiles'], 'readonly');
    const store = tx.objectStore('tiles');
    const key = `${tripId}_${zoom}_${x}_${y}`;
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('[MapStorage] Error getting tile:', error);
    return null;
  }
}

export async function getAllCachedMaps(): Promise<Set<string>> {
  try {
    const db = await openMapDatabase();
    const tx = db.transaction(['maps'], 'readonly');
    const store = tx.objectStore('maps');
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return new Set(keys.filter(k => typeof k === 'string') as string[]);
  } catch (error) {
    console.error('[MapStorage] Error getting cached maps:', error);
    return new Set();
  }
}