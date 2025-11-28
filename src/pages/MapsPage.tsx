import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Map, Download, Check, Trash2, Eye, MapPin, Calendar, Navigation2, Wifi, WifiOff } from "lucide-react";
import { downloadTiles, saveMapToIndexedDB, deleteMapFromIndexedDB, getAllCachedMaps } from "@/lib/mapStorage";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

export default function MapsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<any[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [cachedMaps, setCachedMaps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user && profile) {
      fetchTrips();
      loadCachedMaps();
    }
  }, [user, profile]);

  const fetchTrips = async () => {
    try {
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
    if (!trip.offline_map_configs) {
      toast({
        title: "Hartă indisponibilă",
        description: "Această călătorie nu are configurată hartă offline",
        variant: "destructive"
      });
      return;
    }

    const config = trip.offline_map_configs;
    setDownloading(trip.id);
    setDownloadProgress(0);

    try {
      // Fetch POIs for this trip
      const { data: poisData } = await supabase
        .from('map_points_of_interest')
        .select('*')
        .eq('trip_id', trip.id)
        .eq('is_visible', true);

      const tiles = await downloadTiles(config, (progress) => {
        setDownloadProgress(progress);
      });

      await saveMapToIndexedDB(trip.id, {
        config,
        tiles,
        tripName: trip.nume,
        tripDestination: trip.destinatie,
        pointsOfInterest: poisData || [],
        downloadedAt: new Date().toISOString()
      });

      await supabase.from('offline_map_downloads').upsert({
        user_id: user!.id,
        trip_id: trip.id,
        config_id: config.id,
        tiles_downloaded: tiles.length,
        size_mb: config.estimated_size_mb,
        downloaded_at: new Date().toISOString()
      });

      toast({
        title: "✓ Hartă descărcată!",
        description: `Disponibilă offline (${config.estimated_size_mb} MB)`
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
        title: "✓ Hartă ștearsă",
        description: "Spațiul a fost eliberat"
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
        <div className="pt-20 pb-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Se încarcă hărțile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const offlineTrips = trips.filter(t => cachedMaps.has(t.id));
  const onlineTrips = trips.filter(t => !cachedMaps.has(t.id) && t.offline_map_configs);

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole={profile?.role || 'tourist'} />
      
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Map className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Hărțile Tale
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Descarcă și explorează hărți offline pentru călătoriile tale
            </p>
          </div>

          {/* Connection Status */}
          <Card className="p-4 border-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <>
                    <Wifi className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Conectat la internet</p>
                      <p className="text-xs text-muted-foreground">Poți descărca hărți noi</p>
                    </div>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="font-medium text-sm">Offline</p>
                      <p className="text-xs text-muted-foreground">Doar hărțile descărcate sunt disponibile</p>
                    </div>
                  </>
                )}
              </div>
              <Badge variant={isOnline ? "default" : "secondary"} className="shrink-0">
                {cachedMaps.size} offline
              </Badge>
            </div>
          </Card>

          {/* Offline Maps Section */}
          {offlineTrips.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-semibold">Disponibile Offline</h2>
                <Badge variant="secondary">{offlineTrips.length}</Badge>
              </div>

              <div className="grid gap-4">
                {offlineTrips.map((trip) => {
                  const config = trip.offline_map_configs;
                  
                  return (
                    <Card key={trip.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                      <div className="p-5 space-y-4">
                        {/* Trip Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1 truncate">
                              {trip.nume}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {trip.destinatie}
                            </p>
                          </div>
                          <Badge className="shrink-0 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            <Check className="w-3 h-3 mr-1" />
                            Offline
                          </Badge>
                        </div>

                        {/* Trip Info */}
                        {config && (
                          <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{config.locations?.length || 0} locații</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Download className="w-3.5 h-3.5" />
                              <span>{config.estimated_size_mb} MB</span>
                            </div>
                            {trip.start_date && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(trip.start_date).toLocaleDateString('ro-RO')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Locations Preview */}
                        {config?.locations && config.locations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {config.locations.slice(0, 4).map((loc: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {loc.name}
                              </Badge>
                            ))}
                            {config.locations.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{config.locations.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            className="flex-1"
                            size="sm"
                            onClick={() => navigate(`/tourist/maps/${trip.id}`)}
                          >
                            <Navigation2 className="w-4 h-4 mr-2" />
                            Deschide Harta
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMap(trip.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Online Maps Section */}
          {onlineTrips.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Disponibile pentru Descărcare</h2>
                <Badge variant="secondary">{onlineTrips.length}</Badge>
              </div>

              <div className="grid gap-4">
                {onlineTrips.map((trip) => {
                  const config = trip.offline_map_configs;
                  const isDownloading = downloading === trip.id;
                  
                  return (
                    <Card key={trip.id} className="overflow-hidden border-2">
                      <div className="p-5 space-y-4">
                        {/* Trip Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold mb-1 truncate">
                              {trip.nume}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {trip.destinatie}
                            </p>
                          </div>
                          {isOnline && (
                            <Badge variant="outline" className="shrink-0">
                              <Wifi className="w-3 h-3 mr-1" />
                              Online
                            </Badge>
                          )}
                        </div>

                        {/* Trip Info */}
                        {config && (
                          <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{config.locations?.length || 0} locații</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Download className="w-3.5 h-3.5" />
                              <span>{config.estimated_size_mb} MB</span>
                            </div>
                            {trip.start_date && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(trip.start_date).toLocaleDateString('ro-RO')}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Locations Preview */}
                        {config?.locations && config.locations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {config.locations.slice(0, 4).map((loc: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {loc.name}
                              </Badge>
                            ))}
                            {config.locations.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{config.locations.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Download Progress */}
                        {isDownloading && (
                          <div className="space-y-2">
                            <Progress value={downloadProgress} className="h-2" />
                            <p className="text-xs text-center text-muted-foreground">
                              Se descarcă {downloadProgress}%
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => handleDownloadMap(trip)}
                          disabled={isDownloading || !isOnline}
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Se descarcă...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              {isOnline ? 'Descarcă pentru Offline' : 'Necesită internet'}
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {trips.length === 0 && (
            <Card className="p-12 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
                  <Map className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Nicio hartă disponibilă</h3>
                  <p className="text-sm text-muted-foreground">
                    Vei vedea aici hărțile pentru călătoriile tale când acestea vor fi configurate de administrator
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
