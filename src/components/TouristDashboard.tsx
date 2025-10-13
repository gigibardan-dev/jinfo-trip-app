import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  FileText, 
  Wifi, 
  WifiOff, 
  Clock,
  Camera,
  Navigation,
  Sun,
  CloudRain,
  Users,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserTrip {
  id: string;
  nume: string;
  destinatie: string;
  tara: string;
  start_date: string;
  end_date: string;
  status: string;
  descriere?: string;
  tourist_groups?: {
    nume_grup: string;
  };
}

interface GroupInfo {
  id: string;
  nume_grup: string;
  member_count: number;
}

const TouristDashboard = () => {
  const [currentTrip, setCurrentTrip] = useState<UserTrip | null>(null);
  const [userGroups, setUserGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayActivities, setTodayActivities] = useState<any[]>([]);
  const [groupMemberCount, setGroupMemberCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile?.role === 'tourist') {
      fetchUserData();
    }
  }, [user, profile]);

  const fetchUserData = async () => {
    try {
      // 1. Găsește grupurile utilizatorului
      const { data: memberGroups, error: groupsError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          tourist_groups (
            id,
            nume_grup
          )
        `)
        .eq('user_id', user!.id);

      if (groupsError) throw groupsError;

      // 2. Găsește circuitele active pentru acele grupuri
      if (memberGroups && memberGroups.length > 0) {
        const groupIds = memberGroups.map(g => g.group_id);
        
        const { data: trips, error: tripsError } = await supabase
          .from('trips')
          .select(`
            *,
            tourist_groups (
              nume_grup
            )
          `)
          .in('group_id', groupIds)
          .in('status', ['active', 'confirmed'])
          .order('start_date', { ascending: true });

        if (tripsError) throw tripsError;

        // 3. Setează circuitul curent (primul activ sau confirmat)
        const activeTrip = trips?.find(trip => trip.status === 'active') || trips?.[0];
        setCurrentTrip(activeTrip || null);

        // 4. Setează informații despre grupuri și număr membrii
        if (activeTrip) {
          const { count, error: countError } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', activeTrip.group_id);
          
          if (!countError && count !== null) {
            setGroupMemberCount(count);
          }

          // 5. Fetch today's activities
          const today = new Date().toISOString().split('T')[0];
          const { data: itineraryDays, error: daysError } = await supabase
            .from('itinerary_days')
            .select('id')
            .eq('trip_id', activeTrip.id)
            .eq('date', today);

          if (!daysError && itineraryDays && itineraryDays.length > 0) {
            const { data: activities, error: activitiesError } = await supabase
              .from('itinerary_activities')
              .select('*')
              .eq('day_id', itineraryDays[0].id)
              .order('display_order');

            if (!activitiesError) {
              setTodayActivities(activities || []);
            }
          }
        }

        const groupsInfo = memberGroups.map(mg => ({
          id: mg.group_id,
          nume_grup: mg.tourist_groups.nume_grup,
          member_count: 0
        }));
        setUserGroups(groupsInfo);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca informațiile călătoriei.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTripProgress = () => {
    if (!currentTrip) return 0;
    
    const start = new Date(currentTrip.start_date).getTime();
    const end = new Date(currentTrip.end_date).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getTripDay = () => {
    if (!currentTrip) return { current: 0, total: 0 };
    
    const start = new Date(currentTrip.start_date);
    const end = new Date(currentTrip.end_date);
    const now = new Date();
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(
      Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))),
      totalDays
    );
    
    return { current: currentDay, total: totalDays };
  };

  const quickActions = [
    { label: "Vezi Itinerariu", icon: Calendar, color: "primary", path: "/itinerary" },
    { label: "Documente", icon: FileText, color: "accent", path: "/documents" },
    { label: "Hărți Offline", icon: MapPin, color: "success", path: "/maps" },
    { label: "Check-in", icon: Camera, color: "warning", path: "/checkin" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "upcoming": return "bg-primary text-primary-foreground";
      case "ongoing": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "meal": return "🍽️";
      case "attraction": return "🏛️";
      case "transport": return "🚢";
      case "accommodation": return "🏨";
      case "free_time": return "🎯";
      case "custom": return "📍";
      default: return "📍";
    }
  };

  const getOfflineStatusBadge = (status: string) => {
    switch (status) {
      case "synced": return "bg-success text-success-foreground";
      case "partial": return "bg-warning text-warning-foreground";
      case "outdated": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă informațiile călătoriei...</div>;
  }

  // No active trip found
  if (!currentTrip) {
    return (
      <div className="space-y-6">
        <Card className="shadow-medium border-0">
          <CardContent className="p-8 text-center">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nicio călătorie activă</h2>
            <p className="text-muted-foreground mb-4">
              {userGroups.length === 0 
                ? "Nu faci parte din niciun grup de călătorie."
                : "Grupurile tale nu au călătorii active momentan."
              }
            </p>
            {userGroups.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Grupurile tale: {userGroups.map(g => g.nume_grup).join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const tripDay = getTripDay();
  const progress = calculateTripProgress();

  return (
    <div className="space-y-6">
      {/* Trip Header - REAL DATA */}
      <Card className="shadow-medium border-0 bg-gradient-hero text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{currentTrip.nume}</h1>
              <div className="flex items-center gap-4 text-primary-foreground/90">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentTrip.destinatie}, {currentTrip.tara}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Ziua {tripDay.current} din {tripDay.total}
                </div>
                <div className="flex items-center gap-1">
                  <Sun className="w-4 h-4" />
                  ☀️ 18°C {/* TODO: Real weather data */}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
              <Button variant="secondary" className="bg-white/20 text-primary-foreground hover:bg-white/30 border-0">
                <Navigation className="w-4 h-4 mr-2" />
                Navigație
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-16 flex flex-col gap-2 hover:shadow-medium transition-all"
          >
            <action.icon className="w-5 h-5" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Programul de Azi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nu există activități programate pentru astăzi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayActivities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className="border rounded-lg p-4 transition-all hover:shadow-soft"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-2xl">{getActivityIcon(activity.activity_type)}</div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{activity.title}</h3>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {activity.start_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activity.start_time.substring(0, 5)}
                              </div>
                            )}
                            {activity.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.location_name}
                              </div>
                            )}
                          </div>

                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trip Progress - REAL DATA */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg">Progres Călătorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Ziua {tripDay.current} din {tripDay.total}</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-ocean rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <Badge className={
                    currentTrip.status === 'active' ? 'bg-success text-success-foreground' :
                    currentTrip.status === 'confirmed' ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }>
                    {currentTrip.status === 'active' ? 'În desfășurare' :
                     currentTrip.status === 'confirmed' ? 'Confirmat' : currentTrip.status}
                  </Badge>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Grup</div>
                  <div className="font-medium">{currentTrip.tourist_groups?.nume_grup}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Info */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg">Informații Grup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membri totali</span>
                  <span className="font-medium">{groupMemberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mesaje noi</span>
                  <Badge variant="secondary">{unreadMessages}</Badge>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Vezi Grup Complet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents Status */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground text-center py-4">
                <FileText className="w-12 h-12 mx-auto opacity-50" />
                <p>Verifică documentele în secțiunea dedicată</p>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Vezi Documente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real Trip Description - if available */}
      {currentTrip.descriere && (
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Despre acest circuit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: currentTrip.descriere }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TouristDashboard;