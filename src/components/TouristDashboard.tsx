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
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // === MOCK DATA - FOR UI DEVELOPMENT ===
  const MOCK_todaySchedule = [
    {
      time: "09:00",
      title: "Mic dejun la hotel",
      location: "Hotel Le Marais",
      status: "completed",
      type: "meal"
    },
    {
      time: "10:30",
      title: "Tur ghidat Montmartre",
      location: "Sacré-Cœur",
      status: "completed",
      type: "attraction"
    },
    {
      time: "14:30",
      title: "Vizită Muzeul Luvru",
      location: "Musée du Louvre",
      status: "upcoming",
      type: "attraction"
    },
    {
      time: "18:00",
      title: "Croazieră pe Sena",
      location: "Port de la Bourdonnais",
      status: "upcoming",
      type: "transport"
    }
  ];

  const MOCK_groupStats = {
    totalMembers: 24,
    checkedInToday: 18,
    newMessages: 3
  };

  const MOCK_offlineStatus = [
    { name: "Hărți", status: "synced" },
    { name: "Itinerariu", status: "synced" },
    { name: "Documente", status: "partial" }
  ];
  // === END MOCK DATA ===

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

        // 4. Setează informații despre grupuri
        const groupsInfo = memberGroups.map(mg => ({
          id: mg.group_id,
          nume_grup: mg.tourist_groups.nume_grup,
          member_count: 0 // TODO: Calculate real member count
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
    { label: "Vezi Itinerariu", icon: Calendar, color: "primary" },
    { label: "Documente", icon: FileText, color: "accent" },
    { label: "Hărți Offline", icon: MapPin, color: "success" },
    { label: "Check-in", icon: Camera, color: "warning" }
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
        {/* Today's Schedule - MOCK DATA */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft border-0 relative">
            {/* Mock Data Badge */}
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                MOCK SCHEDULE
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Programul de Azi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_todaySchedule.map((activity, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${
                      activity.status === "upcoming" 
                        ? "border-primary bg-primary/5 shadow-soft" 
                        : activity.status === "completed"
                        ? "border-success bg-success/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{activity.title}</h3>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status === "completed" ? "Completat" : 
                             activity.status === "upcoming" ? "Urmează" : "În desfășurare"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {activity.location}
                          </div>
                        </div>
                        
                        {activity.status === "upcoming" && index === 2 && (
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" className="bg-primary">
                              <Navigation className="w-3 h-3 mr-1" />
                              Navigație
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="w-3 h-3 mr-1" />
                              Detalii
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

          {/* Group Info - MIXED: Real group name, Mock stats */}
          <Card className="shadow-soft border-0 relative">
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                MOCK STATS
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg">Informații Grup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membri totali</span>
                  <span className="font-medium">{MOCK_groupStats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in azi</span>
                  <span className="font-medium text-success">{MOCK_groupStats.checkedInToday}/{MOCK_groupStats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mesaje noi</span>
                  <Badge variant="destructive">{MOCK_groupStats.newMessages}</Badge>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Vezi Grup Complet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Offline Status - MOCK DATA */}
          <Card className="shadow-soft border-0 relative">
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                MOCK OFFLINE
              </Badge>
            </div>
            
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-success" />
                Status Offline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_offlineStatus.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <Badge className={getOfflineStatusBadge(item.status)}>
                      {item.status === 'synced' ? 'Sincronizat' :
                       item.status === 'partial' ? 'Parțial' : 'Învechit'}
                    </Badge>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Forțează Sincronizare
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