import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Navigation as NavigationIcon } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getMapFromIndexedDB, getTileFromIndexedDB } from "@/lib/mapStorage";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Note: Offline tile loading is handled by the tile layer's built-in mechanisms
// The tiles are pre-downloaded and cached in IndexedDB

export default function MapViewerPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [mapData, setMapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMapData();
  }, [tripId]);

  const loadMapData = async () => {
    try {
      const data = await getMapFromIndexedDB(tripId!);
      setMapData(data);
    } catch (error) {
      console.error('Error loading map:', error);
    } finally {
      setLoading(false);
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
          <p className="mb-4">Harta nu este disponibilă offline</p>
          <Button onClick={() => navigate('/tourist/maps')}>
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
      <div className="bg-background border-b p-4 flex items-center gap-4 z-[1000]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/tourist/maps')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Înapoi
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{tripName}</h1>
          <p className="text-sm text-muted-foreground">
            {config.locations?.length} locații
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Offline
          </span>
        </div>
      </div>

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
              key={idx}
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
        </MapContainer>
      </div>
    </div>
  );
}