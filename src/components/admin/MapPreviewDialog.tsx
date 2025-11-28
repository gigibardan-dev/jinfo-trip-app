import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup, Rectangle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Hotel, Utensils, Camera, Hospital, Bus, ShoppingBag, MapPin as MapPinIcon, Phone, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  tripId: string;
}

const categoryIcons: Record<string, any> = {
  hotel: Hotel,
  restaurant: Utensils,
  attraction: Camera,
  emergency: Hospital,
  transport: Bus,
  shop: ShoppingBag,
  other: MapPinIcon,
};

const categoryColors: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
  purple: '#a855f7',
  yellow: '#eab308',
  gray: '#6b7280',
};

const createPOIIcon = (category: string, color: string) => {
  const colorHex = categoryColors[color] || categoryColors.blue;
  return L.divIcon({
    html: `<div style="background-color: ${colorHex}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${getCategoryIconPath(category)}
      </svg>
    </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const getCategoryIconPath = (category: string) => {
  const paths: Record<string, string> = {
    hotel: '<path d="M3 9h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Z"/><path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3"/>',
    restaurant: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    attraction: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    emergency: '<path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>',
    transport: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>',
    shop: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    other: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  };
  return paths[category] || paths.other;
};

export function MapPreviewDialog({ open, onOpenChange, mapConfig, tripId }: MapPreviewDialogProps) {
  const [pois, setPois] = useState<any[]>([]);

  useEffect(() => {
    if (open && tripId) {
      fetchPOIs();
    }
  }, [open, tripId]);

  const fetchPOIs = async () => {
    try {
      const { data, error } = await supabase
        .from('map_points_of_interest')
        .select('*')
        .eq('trip_id', tripId)
        .eq('is_visible', true);

      if (error) throw error;
      setPois(data || []);
    } catch (error) {
      console.error('Error fetching POIs:', error);
    }
  };

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
                key={`city-${idx}`}
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

            {/* POI markers */}
            {pois.map((poi) => {
              const Icon = categoryIcons[poi.category] || MapPinIcon;
              return (
                <Marker
                  key={`poi-${poi.id}`}
                  position={[Number(poi.lat), Number(poi.lng)]}
                  icon={createPOIIcon(poi.category, poi.color || 'blue')}
                >
                  <Popup>
                    <div className="space-y-2 min-w-[200px]">
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded-lg`} style={{ backgroundColor: categoryColors[poi.color || 'blue'] + '20' }}>
                          <Icon className="w-4 h-4" style={{ color: categoryColors[poi.color || 'blue'] }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{poi.name}</h3>
                          {poi.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{poi.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {(poi.phone || poi.website || poi.address) && (
                        <div className="space-y-1 pt-2 border-t">
                          {poi.address && (
                            <p className="text-xs text-muted-foreground">{poi.address}</p>
                          )}
                          {poi.phone && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="w-3 h-3" />
                              <span>{poi.phone}</span>
                            </div>
                          )}
                          {poi.website && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Globe className="w-3 h-3" />
                              <a href={poi.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Zona albastră reprezintă aria care va fi disponibilă offline</span>
          <span className="font-medium">{pois.length} POI-uri marcate</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}