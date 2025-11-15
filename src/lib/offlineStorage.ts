/**
 * IndexedDB Offline Document Storage
 * Handles storing, retrieving, and syncing documents for offline access
 */

import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'TravelProOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

export interface OfflineDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  blobData: Blob;
  lastUpdated: string;
  supabaseUrl: string;
  tripId?: string; // 🆕 Pentru tracking în offline_cache_status
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('fileName', 'fileName', { unique: false });
        objectStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
  });
}

/**
 * 🆕 Track document in offline_cache_status table
 */
async function trackInDatabase(
  fileId: string,
  tripId: string | undefined,
  fileSize: number
): Promise<void> {
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !tripId) {
      return;
    }

    
    
    await supabase.from('offline_cache_status').upsert({
      user_id: user.id,
      trip_id: tripId,
      resource_type: 'documents',
      resource_id: fileId,
      cache_size: fileSize,
      cached_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[OfflineStorage] Failed to track in database:', error);
  }
}

/**
 * 🆕 Remove tracking from offline_cache_status table
 */
async function untrackFromDatabase(fileId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('offline_cache_status')
      .delete()
      .match({
        user_id: user.id,
        resource_id: fileId,
      });

  } catch (error) {
    console.error('[OfflineStorage] Failed to untrack from database:', error);
    // Don't throw
  }
}

/**
 * Save document to IndexedDB for offline access (using Blob directly)
 */
export async function saveDocumentOfflineFromBlob(
  fileId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  blobData: Blob,
  lastUpdated: string,
  supabaseUrl: string,
  tripId?: string // 🆕 Optional tripId parameter
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const document: OfflineDocument = {
      id: fileId,
      fileName,
      fileType,
      fileSize,
      blobData,
      lastUpdated,
      supabaseUrl,
      tripId, // 🆕 Store tripId
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(document);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    console.log(`[OfflineStorage] Document ${fileName} saved offline`);

    // 🆕 Track in database
    await trackInDatabase(fileId, tripId, fileSize);
  } catch (error) {
    console.error('[OfflineStorage] Failed to save document:', error);
    throw error;
  }
}

/**
 * Get offline document from IndexedDB
 */
export async function getOfflineDocument(fileId: string): Promise<OfflineDocument | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const document = await new Promise<OfflineDocument | null>((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return document;
  } catch (error) {
    console.error('[OfflineStorage] Failed to get offline document:', error);
    return null;
  }
}

/**
 * Check if document is available offline
 */
export async function isDocumentOffline(fileId: string): Promise<boolean> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const exists = await new Promise<boolean>((resolve, reject) => {
      const request = store.get(fileId);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return exists;
  } catch (error) {
    console.error('[OfflineStorage] Failed to check offline status:', error);
    return false;
  }
}

/**
 * Delete offline document
 */
export async function deleteOfflineDocument(fileId: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    console.log(`[OfflineStorage] Document ${fileId} deleted from offline storage`);

    // 🆕 Remove from database tracking
    await untrackFromDatabase(fileId);
  } catch (error) {
    console.error('[OfflineStorage] Failed to delete offline document:', error);
    throw error;
  }
}

/**
 * Get all offline documents
 */
export async function getAllOfflineDocuments(): Promise<OfflineDocument[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const documents = await new Promise<OfflineDocument[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return documents;
  } catch (error) {
    console.error('[OfflineStorage] Failed to get all offline documents:', error);
    return [];
  }
}

/**
 * Create a local URL from offline document blob
 */
export function createOfflineDocumentURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke a previously created offline document URL
 */
export function revokeOfflineDocumentURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Sync offline documents with Supabase (check for updates)
 */
export async function syncOfflineDocuments(
  getSupabaseDocument: (id: string) => Promise<{ updated_at: string; blob: Blob; url: string } | null>
): Promise<{ updated: string[]; errors: string[] }> {
  const updated: string[] = [];
  const errors: string[] = [];

  try {
    const offlineDocuments = await getAllOfflineDocuments();

    for (const doc of offlineDocuments) {
      try {
        const supabaseDoc = await getSupabaseDocument(doc.id);
        
        if (!supabaseDoc) {
          console.log(`[OfflineStorage] Document ${doc.id} no longer exists in Supabase`);
          continue;
        }

        // Compare timestamps
        const offlineDate = new Date(doc.lastUpdated);
        const supabaseDate = new Date(supabaseDoc.updated_at);

        if (supabaseDate > offlineDate) {
          // Update needed
          await saveDocumentOfflineFromBlob(
            doc.id,
            doc.fileName,
            doc.fileType,
            doc.fileSize,
            supabaseDoc.blob,
            supabaseDoc.updated_at,
            supabaseDoc.url,
            doc.tripId // 🆕 Pass tripId through
          );
          updated.push(doc.id);
          console.log(`[OfflineStorage] Document ${doc.fileName} updated`);
        }
      } catch (error) {
        console.error(`[OfflineStorage] Failed to sync document ${doc.id}:`, error);
        errors.push(doc.id);
      }
    }

    return { updated, errors };
  } catch (error) {
    console.error('[OfflineStorage] Sync failed:', error);
    return { updated: [], errors: [] };
  }
}

/**
 * Get total storage size
 */
export async function getStorageSize(): Promise<number> {
  try {
    const documents = await getAllOfflineDocuments();
    return documents.reduce((total, doc) => total + doc.fileSize, 0);
  } catch (error) {
    console.error('[OfflineStorage] Failed to get storage size:', error);
    return 0;
  }
}

/**
 * Clear all offline documents
 */
export async function clearAllOfflineDocuments(): Promise<void> {
  try {
    // 🆕 Get all docs first to untrack them
    const documents = await getAllOfflineDocuments();

    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
    console.log('[OfflineStorage] All offline documents cleared');

    // 🆕 Untrack all from database
    for (const doc of documents) {
      await untrackFromDatabase(doc.id);
    }
  } catch (error) {
    console.error('[OfflineStorage] Failed to clear offline documents:', error);
    throw error;
  }
}