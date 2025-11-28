import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Map, Download, Check, Trash2, Eye, AlertCircle, MapPin } from "lucide-react";
import { downloadTiles, saveMapToIndexedDB, deleteMapFromIndexedDB, getAllCachedMaps } from "@/lib/mapStorage";

export default function OfflineMapsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [cachedMaps, setCachedMaps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchTrips();
      loadCachedMaps();
    }
  }, [user, profile]);

  const fetchTrips = async () => {
    try {
      // Get user's trips
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);

      if (!groupMembers || groupMembers.length === 0) {
        setLoading(false);
        return;
      }

      const groupIds = groupMembers.map(gm => gm.group_id);

      const { data: tripsData } = await supabase
        .from('trips')
        .select(`
          *,
          offline_map_configs(*)
        `)
        .in('group_id', groupIds)
        .order('start_date', { ascending: false });

      setTrips(tripsData || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCachedMaps = async () => {
    const cached = await getAllCachedMaps();
    setCachedMaps(cached);
  };

  const handleDownloadMap = async (trip: any) => {
    if (!trip.offline_map_configs || trip.offline_map_configs.length === 0) {
      toast({
        title: "Hartă indisponibilă",
        description: "Această călătorie nu are configurată hartă offline",
        variant: "destructive"
      });
      return;
    }

    const config = trip.offline_map_configs[0];
    setDownloading(trip.id);
    setDownloadProgress(0);

    try {
      // Download tiles
      const tiles = await downloadTiles(config, (progress) => {
        setDownloadProgress(progress);
      });

      // Save to IndexedDB
      await saveMapToIndexedDB(trip.id, {
        config,
        tiles,
        tripName: trip.nume,
        tripDestination: trip.destinatie,
        downloadedAt: new Date().toISOString()
      });

      // Track download
      await supabase.from('offline_map_downloads').upsert({
        user_id: user!.id,
        trip_id: trip.id,
        config_id: config.id,
        tiles_downloaded: tiles.length,
        size_mb: config.estimated_size_mb,
        downloaded_at: new Date().toISOString()
      });

      toast({
        title: "Hartă descărcată!",
        description: `${tiles.length} tile-uri salvate. Disponibil offline!`
      });

      setCachedMaps(prev => new Set([...prev, trip.id]));

    } catch (error: any) {
      console.error('Error downloading map:', error);
      toast({
        title: "Eroare la download",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloading(null);
      setDownloadProgress(0);
    }
  };

  const handleDeleteMap = async (tripId: string) => {
    try {
      await deleteMapFromIndexedDB(tripId);
      setCachedMaps(prev => {
        const newSet = new Set(prev);
        newSet.delete(tripId);
        return newSet;
      });

      toast({
        title: "Hartă ștearsă",
        description: "Cache-ul a fost eliberat"
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu am putut șterge harta",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation userRole={profile?.role || 'tourist'} />
        <div className="pt-14 pb-20">
          <div className="container mx-auto p-6">
            <p className="text-center">Se încarcă...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole={profile?.role || 'tourist'} />
      <div className="pt-14 pb-20">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Map className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Hărți Offline</h1>
              <p className="text-muted-foreground">
                Descarcă hărți pentru călătoriile tale
              </p>
            </div>
          </div>

          {trips.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nu ai călătorii disponibile
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {trips.map((trip) => {
                const config = trip.offline_map_configs?.[0];
                const isCached = cachedMaps.has(trip.id);
                const isDownloading = downloading === trip.id;

                return (
                  <Card key={trip.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">
                          {trip.nume}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {trip.destinatie}
                        </p>

                        {config ? (
                          <>
                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Orașe:</p>
                                <p className="font-medium">
                                  {config.locations?.length || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Mărime:</p>
                                <p className="font-medium">
                                  {config.estimated_size_mb} MB
                                </p>
                              </div>
                            </div>

                            {config.locations && config.locations.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {config.locations.slice(0, 3).map((loc: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                                    <MapPin className="w-3 h-3" />
                                    {loc.name}
                                  </div>
                                ))}
                                {config.locations.length > 3 && (
                                  <div className="text-xs text-muted-foreground px-2 py-1">
                                    +{config.locations.length - 3} mai multe
                                  </div>
                                )}
                              </div>
                            )}

                            {isDownloading && (
                              <div className="space-y-2 mb-4">
                                <Progress value={downloadProgress} />
                                <p className="text-xs text-muted-foreground text-center">
                                  Descărcare {downloadProgress}%
                                </p>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {isCached ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => navigate(`/tourist/maps/${trip.id}`)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Vezi Harta
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteMap(trip.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handleDownloadMap(trip)}
                                  disabled={isDownloading}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Descarcă Hartă Offline
                                </Button>
                              )}
                            </div>

                            {isCached && (
                              <div className="flex items-center gap-2 mt-3 text-sm text-green-600 dark:text-green-400">
                                <Check className="w-4 h-4" />
                                <span>Disponibil offline</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Hartă offline nu este configurată pentru acest trip
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}