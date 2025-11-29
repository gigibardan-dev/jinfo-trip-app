import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Users, FileText, Clock, AlertCircle, Map } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/shared/StatsCard";
import { useNavigate } from "react-router-dom";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by_admin_id: string;
}

interface Assignment {
  id: string;
  trip_id: string;
  assigned_at: string;
  is_active: boolean;
  trips: Trip;
}

const GuideDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayReports, setTodayReports] = useState<any[]>([]);
  const [mapsAvailable, setMapsAvailable] = useState(0);
  const [todayActivities, setTodayActivities] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchTodayReports();
      fetchMapsAvailable();
    }
  }, [user]);

  const fetchAssignments = async () => {
    // Load cached guide dashboard instantly
    const cached = localStorage.getItem('cached_guide_dashboard');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        console.log('[GuideDashboard] Loading from cache instantly:', timestamp);
        
        setAssignments(data.assignments || []);
        setTodayReports(data.todayReports || []);
        setMapsAvailable(data.mapsAvailable || 0);
        
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        const isFresh = cacheAge < 5 * 60 * 1000;
        
        if (isFresh) {
          setLoading(false);
          console.log('[GuideDashboard] Using fresh cache, skipping fetch');
          return;
        }
      } catch (error) {
        console.error('[GuideDashboard] Cache error:', error);
      }
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch ALL data in PARALLEL
      const results = await Promise.allSettled([
        // Fetch 1: Guide assignments
        supabase
          .from('guide_assignments')
          .select('*')
          .eq('guide_user_id', user?.id)
          .eq('is_active', true)
          .order('assigned_at', { ascending: false }),
        
        // Fetch 2: Today's reports
        supabase
          .from('daily_reports')
          .select('*')
          .eq('guide_user_id', user?.id)
          .eq('report_date', today),
      ]);

      const [assignmentsResult, reportsResult] = results;

      if (assignmentsResult.status === 'fulfilled' && !assignmentsResult.value.error) {
        const assignmentsData = assignmentsResult.value.data;

        if (assignmentsData && assignmentsData.length > 0) {
          const tripIds = [...new Set(assignmentsData.map(a => a.trip_id))];

          // Fetch trips and maps in parallel
          const tripResults = await Promise.allSettled([
            // Fetch 3: Trip details
            supabase
              .from('trips')
              .select('id, nume, destinatie, start_date, end_date, status, created_by_admin_id')
              .in('id', tripIds),
            
            // Fetch 4: Available maps
            supabase
              .from('offline_map_configs')
              .select('id')
              .in('trip_id', tripIds),
          ]);

          const [tripsResult, mapsResult] = tripResults;

          let tripsData = [];
          if (tripsResult.status === 'fulfilled' && !tripsResult.value.error) {
            tripsData = tripsResult.value.data || [];
          }

          const assignmentsWithTrips = assignmentsData.map(assignment => ({
            ...assignment,
            trips: tripsData.find(trip => trip.id === assignment.trip_id) || null
          }));

          setAssignments(assignmentsWithTrips);

          if (mapsResult.status === 'fulfilled' && !mapsResult.value.error) {
            setMapsAvailable(mapsResult.value.data?.length || 0);
          }

          // Fetch today's activities for ACTIVE trip only
          const activeTrip = tripsData.find(trip => {
            const today = new Date();
            const startDate = new Date(trip.start_date);
            const endDate = new Date(trip.end_date);
            return today >= startDate && today <= endDate;
          });

          if (activeTrip) {
            const todayDate = new Date().toISOString().split('T')[0];
            const { data: itineraryDays } = await supabase
              .from('itinerary_days')
              .select('id')
              .eq('trip_id', activeTrip.id)
              .eq('date', todayDate);

            if (itineraryDays && itineraryDays.length > 0) {
              const { data: activities } = await supabase
                .from('itinerary_activities')
                .select('*')
                .eq('day_id', itineraryDays[0].id)
                .order('display_order');

              setTodayActivities(activities || []);
            }
          }
        } else {
          setAssignments([]);
        }
      }

      if (reportsResult.status === 'fulfilled' && !reportsResult.value.error) {
        setTodayReports(reportsResult.value.data || []);
      }

      // Update cache
      localStorage.setItem('cached_guide_dashboard', JSON.stringify({
        data: {
          assignments: assignments,
          todayReports: todayReports,
          mapsAvailable: mapsAvailable,
        },
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error fetching assignments:', error);
      if (!cached) {
        toast({
          title: "Eroare",
          description: "Nu s-au putut încărca circuitele atribuite.",
          variant: "destructive",
        });
      }
    }
  };

  const fetchTodayReports = async () => {
    // Now handled in fetchAssignments with parallel fetch
    setLoading(false);
  };

  const fetchMapsAvailable = async () => {
    // Now handled in fetchAssignments with parallel fetch
  };

  const getActiveTrips = () => {
    const today = new Date();
    return assignments.filter(assignment => {
      const startDate = new Date(assignment.trips.start_date);
      const endDate = new Date(assignment.trips.end_date);
      return today >= startDate && today <= endDate;
    });
  };

  const getUpcomingTrips = () => {
    const today = new Date();
    return assignments.filter(assignment => {
      const startDate = new Date(assignment.trips.start_date);
      return startDate > today;
    });
  };

  const getCompletedTrips = () => {
    const today = new Date();
    return assignments.filter(assignment => {
      const endDate = new Date(assignment.trips.end_date);
      return endDate < today;
    });
  };

  const activeTrips = getActiveTrips();
  const upcomingTrips = getUpcomingTrips();
  const completedTrips = getCompletedTrips();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  const getTripStatus = (trip: Trip) => {
    const today = new Date();
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);

    if (today < startDate) return { label: "Viitor", variant: "secondary" as const };
    if (today >= startDate && today <= endDate) return { label: "Activ", variant: "default" as const };
    return { label: "Completat", variant: "outline" as const };
  };

  const getTodayReport = (tripId: string) => {
    return todayReports.find(report => report.trip_id === tripId);
  };

  const calculateTripProgress = (trip: Trip) => {
    const start = new Date(trip.start_date).getTime();
    const end = new Date(trip.end_date).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getTripDay = (trip: Trip) => {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const now = new Date();
    
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = Math.min(
      Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))),
      totalDays
    );
    
    return { current: currentDay, total: totalDays };
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:px-8 lg:px-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Ghid</h1>
        <p className="text-muted-foreground">
          Gestionează circuitele tale și rapoartele zilnice
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Circuite Active"
          value={activeTrips.length}
          description="În desfășurare acum"
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatsCard
          title="Circuite Viitoare"
          value={upcomingTrips.length}
          description="Programate"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard
          title="Circuite Completate"
          value={completedTrips.length}
          description="Finalizate"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Rapoarte Astăzi"
          value={todayReports.length}
          description="Completate azi"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Maps Quick Access */}
      <Card className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/maps')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Map className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Hărți Offline</h3>
                <p className="text-sm text-muted-foreground">
                  {mapsAvailable} {mapsAvailable === 1 ? 'hartă disponibilă' : 'hărți disponibile'} pentru circuitele tale
                </p>
              </div>
            </div>
            <Button size="sm">
              Deschide Hărți
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Trip Info Section */}
      {activeTrips.length > 0 && (() => {
        const activeTrip = activeTrips[0].trips;
        const tripDay = getTripDay(activeTrip);
        const progress = calculateTripProgress(activeTrip);

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Programul de Azi
                  </CardTitle>
                  <CardDescription>{activeTrip.nume}</CardDescription>
                </CardHeader>
                <CardContent>
                  {todayActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nu există activități programate pentru astăzi</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="border rounded-lg p-4 px-2.5 sm:px-4 transition-all hover:shadow-soft"
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

            {/* Trip Progress */}
            <div>
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
                        activeTrip.status === 'active' ? 'bg-success text-success-foreground' :
                        activeTrip.status === 'confirmed' ? 'bg-primary text-primary-foreground' :
                        'bg-muted text-muted-foreground'
                      }>
                        {activeTrip.status === 'active' ? 'În desfășurare' :
                         activeTrip.status === 'confirmed' ? 'Confirmat' : activeTrip.status}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground mb-1">Destinație</div>
                      <div className="font-medium">{activeTrip.destinatie}</div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground mb-1">Perioada</div>
                      <div className="text-sm">
                        {formatDate(activeTrip.start_date)} - {formatDate(activeTrip.end_date)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })()}

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Circuite Active ({activeTrips.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Viitoare ({upcomingTrips.length})</TabsTrigger>
          <TabsTrigger value="completed">Completate ({completedTrips.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTrips.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Niciun circuit activ</h3>
                <p className="text-muted-foreground text-center">
                  Nu ai circuite active în acest moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeTrips.map((assignment) => {
                const trip = assignment.trips;
                const status = getTripStatus(trip);
                const hasReport = getTodayReport(trip.id);

                return (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{trip.nume}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {trip.destinatie}
                          </CardDescription>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Început: {formatDate(trip.start_date)}</span>
                        <span>Sfârșit: {formatDate(trip.end_date)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {hasReport ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <FileText className="h-3 w-3 mr-1" />
                            Raport completat
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Raport lipsă
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => navigate('/guide-itinerary')}>
                          Gestionează Itinerariu
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate('/guide-reports')}>
                          {hasReport ? "Editează Raport" : "Completează Raport"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingTrips.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Niciun circuit viitor</h3>
                <p className="text-muted-foreground text-center">
                  Nu ai circuite programate în viitor.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingTrips.map((assignment) => {
                const trip = assignment.trips;
                const status = getTripStatus(trip);

                return (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{trip.nume}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {trip.destinatie}
                          </CardDescription>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Început: {formatDate(trip.start_date)}</span>
                        <span>Sfârșit: {formatDate(trip.end_date)}</span>
                      </div>

                      <Button size="sm" className="w-full" onClick={() => navigate('/guide-itinerary')}>
                        Vezi Detalii
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTrips.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Niciun circuit completat</h3>
                <p className="text-muted-foreground text-center">
                  Nu ai circuite completate încă.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedTrips.map((assignment) => {
                const trip = assignment.trips;
                const status = getTripStatus(trip);

                return (
                  <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{trip.nume}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {trip.destinatie}
                          </CardDescription>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Început: {formatDate(trip.start_date)}</span>
                        <span>Sfârșit: {formatDate(trip.end_date)}</span>
                      </div>

                      <Button size="sm" variant="outline" className="w-full" onClick={() => navigate('/guide-reports')}>
                        Vezi Rapoarte
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuideDashboard;