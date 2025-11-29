import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Trophy, Sparkles, MapPin } from "lucide-react";
import Navigation from "@/components/shared/layout/Navigation";

interface Stamp {
  id: string;
  trip_id: string;
  name: string;
  description: string | null;
  stamp_icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  points_value: number;
  location_lat: number | null;
  location_lng: number | null;
  trips?: {
    nume: string;
    destinatie: string;
  };
}

interface CollectedStamp {
  id: string;
  stamp_id: string;
  collected_at: string;
  collection_method: string;
  poi_stamps: Stamp;
}

const StampsPage = () => {
  const [availableStamps, setAvailableStamps] = useState<Stamp[]>([]);
  const [collectedStamps, setCollectedStamps] = useState<CollectedStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectingStampId, setCollectingStampId] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.id) {
      fetchStamps();
    }
  }, [profile?.id]);

  const fetchStamps = async () => {
    try {
      setLoading(true);

      // Fetch trip-ul activ al turistului
      const { data: groupData, error: groupError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', profile!.id)
        .maybeSingle();

      if (groupError) throw groupError;

      if (!groupData) {
        console.log('[StampsPage] No group found for tourist');
        setAvailableStamps([]);
        setCollectedStamps([]);
        setLoading(false);
        return;
      }

      // Fetch trip-ul pentru grup
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id, nume, destinatie, status')
        .eq('group_id', groupData.group_id)
        .in('status', ['confirmed', 'active'])
        .maybeSingle();

      if (tripError) throw tripError;

      if (!tripData) {
        console.log('[StampsPage] No active trip found for group');
        setAvailableStamps([]);
        setCollectedStamps([]);
        setLoading(false);
        return;
      }

      // Fetch toate stamps-urile pentru trip
      const { data: stamps, error: stampsError } = await supabase
        .from('poi_stamps')
        .select(`
          *,
          trips (nume, destinatie)
        `)
        .eq('trip_id', tripData.id)
        .order('rarity', { ascending: false })
        .order('points_value', { ascending: false });

      if (stampsError) throw stampsError;

      // Fetch stamps-urile deja colectate
      const { data: collected, error: collectedError } = await supabase
        .from('tourist_collected_stamps')
        .select(`
          *,
          poi_stamps (*)
        `)
        .eq('tourist_id', profile!.id)
        .eq('trip_id', tripData.id)
        .order('collected_at', { ascending: false });

      if (collectedError) throw collectedError;

      setAvailableStamps(stamps || []);
      setCollectedStamps(collected || []);

    } catch (error) {
      console.error('[StampsPage] Error fetching stamps:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca stamps-urile. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCollectStamp = async (stamp: Stamp) => {
    try {
      setCollectingStampId(stamp.id);

      const { error } = await supabase
        .from('tourist_collected_stamps')
        .insert({
          tourist_id: profile!.id,
          stamp_id: stamp.id,
          trip_id: stamp.trip_id,
          collection_method: 'manual'
        });

      if (error) throw error;

      // Confetti animation (optional - simple toast version)
      toast({
        title: `🎉 Stamp colectat!`,
        description: `${stamp.stamp_icon} ${stamp.name} +${stamp.points_value} puncte`,
        duration: 5000,
      });

      // Refresh stamps
      fetchStamps();

    } catch (error: any) {
      console.error('[StampsPage] Error collecting stamp:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Info",
          description: "Ai deja acest stamp în colecție!",
        });
      } else {
        toast({
          title: "Eroare",
          description: "Nu s-a putut colecta stamp-ul.",
          variant: "destructive",
        });
      }
    } finally {
      setCollectingStampId(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
      case 'rare':
        return 'bg-gradient-to-r from-purple-500 to-violet-600 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'Legendar';
      case 'rare':
        return 'Rar';
      default:
        return 'Comun';
    }
  };

  // Calculate statistics
  const collectedIds = new Set(collectedStamps.map(cs => cs.stamp_id));
  const uncollectedStamps = availableStamps.filter(s => !collectedIds.has(s.id));
  const totalStamps = availableStamps.length;
  const totalCollected = collectedStamps.length;
  const totalPoints = collectedStamps.reduce((sum, cs) => sum + cs.poi_stamps.points_value, 0);
  const progressPercentage = totalStamps > 0 ? Math.round((totalCollected / totalStamps) * 100) : 0;

  const legendaryCollected = collectedStamps.filter(cs => cs.poi_stamps.rarity === 'legendary').length;
  const rareCollected = collectedStamps.filter(cs => cs.poi_stamps.rarity === 'rare').length;
  const commonCollected = collectedStamps.filter(cs => cs.poi_stamps.rarity === 'common').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Trophy className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Se încarcă colecția...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (totalStamps === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Nicio colecție disponibilă</h3>
              <p className="text-muted-foreground">
                Nu există stamps disponibile pentru călătoria ta activă.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl space-y-6">
        {/* Header cu Progress */}
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-2">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Colecția Mea
              </CardTitle>
              <Badge variant="outline" className="text-lg px-4 py-1">
                <Sparkles className="w-4 h-4 mr-1" />
                {totalPoints} puncte
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Stamps Colectate</span>
                <span className="font-bold">{totalCollected}/{totalStamps}</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {progressPercentage}% complet
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Summary */}
        {totalCollected > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-gradient-to-br from-amber-500/10 to-background">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{legendaryCollected}</div>
                <div className="text-xs text-muted-foreground">Legendar</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-background">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{rareCollected}</div>
                <div className="text-xs text-muted-foreground">Rar</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-muted/50 to-background">
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{commonCollected}</div>
                <div className="text-xs text-muted-foreground">Comun</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available Stamps (pentru check-in) */}
        {uncollectedStamps.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Disponibile pentru Check-in
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {uncollectedStamps.map((stamp) => (
                <Card key={stamp.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{stamp.stamp_icon}</div>
                      
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold">{stamp.name}</h4>
                        
                        {stamp.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {stamp.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getRarityColor(stamp.rarity)}>
                            {getRarityLabel(stamp.rarity)}
                          </Badge>
                          <Badge variant="outline">
                            +{stamp.points_value} puncte
                          </Badge>
                        </div>
                        
                        <Button
                          onClick={() => handleCollectStamp(stamp)}
                          disabled={collectingStampId === stamp.id}
                          className="w-full mt-2"
                          size="sm"
                        >
                          {collectingStampId === stamp.id ? (
                            'Se colectează...'
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Check-in
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Collected Stamps (istoric) */}
        {collectedStamps.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Stamps Colectate ({collectedStamps.length})
            </h3>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {collectedStamps.map((collected) => {
                const stamp = collected.poi_stamps;
                return (
                  <Card key={collected.id} className="bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl opacity-90">{stamp.stamp_icon}</div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <h5 className="font-medium text-sm truncate">{stamp.name}</h5>
                          </div>
                          
                          <Badge className={`${getRarityColor(stamp.rarity)} text-xs`}>
                            {getRarityLabel(stamp.rarity)}
                          </Badge>
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(collected.collected_at).toLocaleDateString('ro-RO', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {totalCollected === totalStamps && totalStamps > 0 && (
          <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500">
            <CardContent className="py-8 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-600" />
              <h3 className="text-2xl font-bold mb-2">🏆 Felicitări!</h3>
              <p className="text-lg">
                Ai colectat toate stamps-urile disponibile!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Total: {totalPoints} puncte
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StampsPage;
