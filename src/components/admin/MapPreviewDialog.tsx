import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapConfig: any;
}

export function MapPreviewDialog({ open, onOpenChange, mapConfig }: MapPreviewDialogProps) {
  if (!mapConfig || !mapConfig.locations || mapConfig.locations.length === 0) {
    return null;
  }

  const center: [number, number] = [
    (mapConfig.bounds_north + mapConfig.bounds_south) / 2,
    (mapConfig.bounds_east + mapConfig.bounds_west) / 2
  ];

  const bounds: [[number, number], [number, number]] = [
    [mapConfig.bounds_south, mapConfig.bounds_west],
    [mapConfig.bounds_north, mapConfig.bounds_east]
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Preview Hartă Offline</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 rounded-lg overflow-hidden border">
          <MapContainer
            center={center}
            zoom={mapConfig.zoom_min + 2}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Bounds rectangle */}
            <Rectangle
              bounds={bounds}
              pathOptions={{ 
                color: 'blue', 
                weight: 2, 
                fillOpacity: 0.1 
              }}
            />
            
            {/* City markers */}
            {mapConfig.locations.map((location: any, idx: number) => (
              <Marker 
                key={idx} 
                position={[location.lat, location.lng]}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{location.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Zona albastră reprezintă aria care va fi disponibilă offline
        </div>
      </DialogContent>
    </Dialog>
  );
}