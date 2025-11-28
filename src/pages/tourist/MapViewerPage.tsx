import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Navigation as NavigationIcon, Hotel, Utensils, Camera, Hospital, Bus, ShoppingBag, MapPin as MapPinIcon, Phone, Globe, Download, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getMapFromIndexedDB, saveMapToIndexedDB, downloadTiles } from "@/lib/mapStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

export default function MapViewerPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [pois, setPois] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, [tripId]);

  const loadData = async () => {
    try {
      // Try offline first
      const cached = await getMapFromIndexedDB(tripId!);
      if (cached) {
        setMapData(cached);
        setPois(cached.pointsOfInterest || []);
        setIsOffline(true);
        setLoading(false);
        return;
      }

      // Load online
      await loadOnlineData();
    } catch (error) {
      console.error('Error loading map:', error);
      setLoading(false);
    }
  };

  const loadOnlineData = async () => {
    try {
      const [tripResult, configResult, poisResult] = await Promise.all([
        supabase.from('trips').select('*').eq('id', tripId!).single(),
        supabase.from('offline_map_configs').select('*').eq('trip_id', tripId!).single(),
        supabase.from('map_points_of_interest').select('*').eq('trip_id', tripId!).eq('is_visible', true)
      ]);

      if (tripResult.error) throw tripResult.error;
      if (configResult.error) throw configResult.error;

      setMapData({
        config: configResult.data,
        tripName: tripResult.data.nume,
        tripDestination: tripResult.data.destinatie,
      });
      setPois(poisResult.data || []);
      setIsOffline(false);
    } catch (error) {
      console.error('Error loading online data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOffline = async () => {
    if (!mapData?.config) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const tiles = await downloadTiles(mapData.config, (progress) => {
        setDownloadProgress(progress);
      });

      await saveMapToIndexedDB(tripId!, {
        config: mapData.config,
        tiles,
        tripName: mapData.tripName,
        tripDestination: mapData.tripDestination,
        pointsOfInterest: pois,
        downloadedAt: new Date().toISOString()
      });

      await supabase.from('offline_map_downloads').upsert({
        user_id: user!.id,
        trip_id: tripId!,
        config_id: mapData.config.id,
        tiles_downloaded: tiles.length,
        size_mb: mapData.config.estimated_size_mb,
        downloaded_at: new Date().toISOString()
      });

      toast({
        title: "✓ Hartă descărcată!",
        description: `Disponibilă offline (${mapData.config.estimated_size_mb} MB)`
      });

      setIsOffline(true);
    } catch (error: any) {
      console.error('Error downloading map:', error);
      toast({
        title: "Eroare la download",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Se încarcă harta...</p>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6">
        <Card className="p-12 text-center">
          <p className="mb-4">Harta nu este disponibilă</p>
          <Button onClick={() => navigate('/maps')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la Hărți
          </Button>
        </Card>
      </div>
    );
  }

  const { config, tripName, tripDestination } = mapData;
  const center: [number, number] = [
    (config.bounds_north + config.bounds_south) / 2,
    (config.bounds_east + config.bounds_west) / 2
  ];

  // Create polyline through all locations
  const pathCoordinates: [number, number][] = config.locations.map((loc: any) => [
    loc.lat,
    loc.lng
  ]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-background border-b p-4 flex items-center gap-3 z-[1000] flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/maps')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{tripName}</h1>
          <p className="text-sm text-muted-foreground">
            {config.locations?.length} locații · {pois.length} POI-uri
          </p>
        </div>
        
        {isOffline ? (
          <Badge className="shrink-0 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <Check className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        ) : (
          <Button
            size="sm"
            onClick={handleDownloadOffline}
            disabled={downloading}
            className="shrink-0"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {downloadProgress}%
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Salvează Offline
              </>
            )}
          </Button>
        )}
      </div>

      {/* Download Progress */}
      {downloading && (
        <div className="px-4 py-2 bg-muted border-b">
          <Progress value={downloadProgress} className="h-2" />
        </div>
      )}

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={center}
          zoom={config.zoom_min + 3}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* Draw route */}
          {pathCoordinates.length > 1 && (
            <Polyline
              positions={pathCoordinates}
              color="blue"
              weight={3}
              opacity={0.7}
            />
          )}

          {/* City markers */}
          {config.locations.map((location: any, idx: number) => (
            <Marker
              key={`city-${idx}`}
              position={[location.lat, location.lng]}
            >
              <Popup>
                <div className="space-y-2">
                  <h3 className="font-semibold">{location.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {location.display_name}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <NavigationIcon className="w-3 h-3 mr-2" />
                    Navighează (Google Maps)
                  </Button>
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
                  <div className="space-y-3 min-w-[220px]">
                    <div className="flex items-start gap-2">
                      <div className={`p-2 rounded-lg`} style={{ backgroundColor: categoryColors[poi.color || 'blue'] + '20' }}>
                        <Icon className="w-5 h-5" style={{ color: categoryColors[poi.color || 'blue'] }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{poi.name}</h3>
                        {poi.description && (
                          <p className="text-xs text-muted-foreground mt-1">{poi.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {(poi.phone || poi.website || poi.address) && (
                      <div className="space-y-1.5 pt-2 border-t">
                        {poi.address && (
                          <p className="text-xs text-muted-foreground">{poi.address}</p>
                        )}
                        {poi.phone && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Phone className="w-3.5 h-3.5" />
                            <a href={`tel:${poi.phone}`} className="hover:underline">{poi.phone}</a>
                          </div>
                        )}
                        {poi.website && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <Globe className="w-3.5 h-3.5" />
                            <a href={poi.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <NavigationIcon className="w-3 h-3 mr-2" />
                      Navighează (Google Maps)
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}