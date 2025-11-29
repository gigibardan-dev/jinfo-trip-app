import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/shared/layout/Navigation";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Coffee,
  Hotel,
  Camera,
  Car,
  Utensils,
  Plus,
  Euro,
  AlertTriangle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  start_date: string;
  end_date: string;
}

interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string;
  overview?: string;
  activities: ItineraryActivity[];
}

interface ItineraryActivity {
  id: string;
  day_id: string;
  title: string;
  description?: string;
  activity_type: "custom" | "transport" | "accommodation" | "meal" | "attraction" | "free_time";
  start_time?: string;
  end_time?: string;
  location_name?: string;
  address?: string;
  cost_estimate?: number;
  booking_reference?: string;
  tips_and_notes?: string;
  display_order: number;
}

const activityTypeConfig = {
  attraction: { label: "Atracție", color: "bg-primary", icon: Camera },
  meal: { label: "Masă", color: "bg-green-500", icon: Utensils },
  transport: { label: "Transport", color: "bg-purple-500", icon: Car },
  accommodation: { label: "Cazare", color: "bg-orange-500", icon: Hotel },
  free_time: { label: "Timp Liber", color: "bg-yellow-500", icon: Clock },
  custom: { label: "Altele", color: "bg-muted", icon: Plus }
};

const ItineraryPage = () => {
  const { user, profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchUserTrips();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedTrip) {
      fetchItinerary();
    }
  }, [selectedTrip]);

  const fetchUserTrips = async () => {
    // STEP 1: Load cached trips instantly (for immediate UI)
    const cached = localStorage.getItem('cached_user_trips');
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        console.log('[ItineraryPage] Loading trips from cache instantly:', timestamp);
        
        // Set data IMMEDIATELY - user sees trips instantly
        setTrips(data || []);
        if (data && data.length > 0) {
          setSelectedTrip(data[0]);
        }
        
        // IMPORTANT: We do NOT skip the fetch!
        // Cache only provides instant UI, fetch ALWAYS runs for fresh data
      } catch (error) {
        console.error('[ItineraryPage] Cache error:', error);
      }
    }

    // STEP 2: ALWAYS fetch fresh data (even if we have cache)

    try {
      // Parallel fetching
      const results = await Promise.allSettled([
        supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user!.id),
      ]);

      const [groupsResult] = results;

      if (groupsResult.status === 'fulfilled' && !groupsResult.value.error) {
        const memberGroups = groupsResult.value.data;

        if (!memberGroups || memberGroups.length === 0) {
          setLoading(false);
          return;
        }

        const groupIds = memberGroups.map(g => g.group_id);

        const { data, error } = await supabase
          .from("trips")
          .select("id, nume, destinatie, start_date, end_date")
          .in("group_id", groupIds)
          .eq("status", "active")
          .order("start_date", { ascending: true });

        if (error) throw error;
        setTrips(data || []);
        
        if (data && data.length > 0) {
          setSelectedTrip(data[0]);
        }

        // Update cache
        localStorage.setItem('cached_user_trips', JSON.stringify({
          data: data || [],
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      if (!cached) {
        toast.error("Eroare la încărcarea circuitelor");
      }
    }
  };

  const fetchItinerary = async () => {
    if (!selectedTrip) return;
    
    // STEP 1: Load cached itinerary instantly (for immediate UI)
    const cacheKey = `cached_itinerary_${selectedTrip.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        console.log('[ItineraryPage] Loading itinerary from cache instantly:', timestamp);
        
        // Set data IMMEDIATELY - user sees itinerary instantly
        setItineraryDays(data);
        if (!selectedDay || selectedDay === "all") {
          setSelectedDay("all");
        }
        
        // IMPORTANT: We do NOT skip the fetch!
        // Cache only provides instant UI, fetch ALWAYS runs for fresh data
      } catch (error) {
        console.error('[ItineraryPage] Cache error:', error);
      }
    }
    
    // STEP 2: ALWAYS fetch fresh data (even if we have cache)
    
    setLoading(true);
    try {
      const { data: daysData, error: daysError } = await supabase
        .from("itinerary_days")
        .select("*")
        .eq("trip_id", selectedTrip.id)
        .order("day_number", { ascending: true });

      if (daysError) throw daysError;

      // Fetch all activities in parallel
      const daysWithActivities = await Promise.all(
        (daysData || []).map(async (day) => {
          const { data: activitiesData, error: activitiesError } = await supabase
            .from("itinerary_activities")
            .select("*")
            .eq("day_id", day.id)
            .order("display_order", { ascending: true });

          if (activitiesError) throw activitiesError;

          return {
            ...day,
            activities: activitiesData || []
          };
        })
      );

      setItineraryDays(daysWithActivities);
      if (!selectedDay || selectedDay === "all") {
        setSelectedDay("all");
      }

      // Update cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data: daysWithActivities,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error fetching itinerary:", error);
      if (!cached) {
        toast.error("Eroare la încărcarea itinerarului");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time.slice(0, 5);
  };

  const formatCost = (cost: number | null) => {
    if (!cost) return "";
    return `${cost} €`;
  };

  const ActivityCard = ({ activity }: { activity: ItineraryActivity }) => {
    const config = activityTypeConfig[activity.activity_type];
    const IconComponent = config.icon;

    return (
      <Card className="mb-4 border-l-4 border-l-primary/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-full ${config.color} text-white`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">{activity.title}</h4>
                {(activity.start_time || activity.end_time) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatTime(activity.start_time)} 
                    {activity.start_time && activity.end_time && " - "}
                    {formatTime(activity.end_time)}
                  </div>
                )}
              </div>
            </div>
            <Badge variant="secondary">{config.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {activity.description && (
            <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
          )}
          
          {activity.location_name && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <MapPin className="h-3 w-3" />
              {activity.location_name}
            </div>
          )}
          
          {activity.cost_estimate && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Euro className="h-3 w-3" />
              {formatCost(activity.cost_estimate)}
            </div>
          )}
          
          {activity.booking_reference && (
            <div className="text-sm text-muted-foreground mb-1">
              <strong>Rezervare:</strong> {activity.booking_reference}
            </div>
          )}
          
          {activity.tips_and_notes && (
            <div className="text-sm bg-muted p-2 rounded mt-2">
              <strong>Note:</strong> {activity.tips_and_notes}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!user || profile?.role !== 'tourist') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Această pagină este disponibilă doar pentru turiști autentificați.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole="tourist" />
      <div className="pt-14 pb-20"> 
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Itinerariul Meu</h1>
          <p className="text-muted-foreground">Vizualizează itinerariul detaliat al circuitului tău</p>
        </div>

        {trips.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nu ești înscris la niciun circuit activ momentan.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {trips.length > 1 && (
              <div className="mb-6">
                <Label htmlFor="trip-select">Selectează circuitul:</Label>
                <select
                  id="trip-select"
                  value={selectedTrip?.id || ""}
                  onChange={(e) => {
                    const trip = trips.find(t => t.id === e.target.value);
                    setSelectedTrip(trip || null);
                  }}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.nume} - {trip.destinatie}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedTrip && (
              <Card className="mb-6 bg-gradient-to-br from-primary to-accent border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary-foreground">
                    <Calendar className="h-5 w-5" />
                    {selectedTrip.nume}
                  </CardTitle>
                  <p className="text-primary-foreground/90">
                    {selectedTrip.destinatie} • {format(parseISO(selectedTrip.start_date), "d MMMM", { locale: ro })} - 
                    {format(parseISO(selectedTrip.end_date), "d MMMM yyyy", { locale: ro })}
                  </p>
                </CardHeader>
              </Card>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : itineraryDays.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Itinerarul pentru acest circuit nu a fost încă finalizat. Te vom anunța când va fi disponibil.
                </AlertDescription>
              </Alert>
            ) : (
              <div>
                {/* Mobile-friendly day selector with horizontal scroll */}
                <div className="mb-6">
                  <Label className="mb-3 block text-sm font-medium">Selectează ziua:</Label>
                  <div className="relative">
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                      {/* "All Days" option */}
                      <button
                        onClick={() => setSelectedDay("all")}
                        className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all snap-start ${
                          selectedDay === "all"
                            ? 'border-primary bg-primary text-primary-foreground shadow-md'
                            : 'border-muted bg-background hover:border-primary/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="text-sm font-semibold whitespace-nowrap">Toate Zilele</div>
                        <div className="text-xs opacity-80">
                          {itineraryDays.length} {itineraryDays.length === 1 ? 'zi' : 'zile'}
                        </div>
                      </button>
                      
                      {/* Individual days */}
                      {itineraryDays.map((day) => (
                        <button
                          key={day.id}
                          onClick={() => setSelectedDay(day.id)}
                          className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all snap-start ${
                            selectedDay === day.id
                              ? 'border-primary bg-primary text-primary-foreground shadow-md'
                              : 'border-muted bg-background hover:border-primary/50 hover:shadow-sm'
                          }`}
                        >
                          <div className="text-sm font-semibold whitespace-nowrap">Ziua {day.day_number}</div>
                          <div className="text-xs opacity-80 whitespace-nowrap">
                            {format(parseISO(day.date), "d MMM", { locale: ro })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content area */}
                {selectedDay === "all" ? (
                  // Show all days in sequence
                  <div className="space-y-8">
                    {itineraryDays.map((day, index) => (
                      <div key={day.id} className="scroll-mt-20" id={`day-${day.day_number}`}>
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              <span>Ziua {day.day_number}: {day.title}</span>
                            </CardTitle>
                            <p className="text-muted-foreground">
                              {format(parseISO(day.date), "EEEE, d MMMM yyyy", { locale: ro })}
                            </p>
                            {day.overview && (
                              <p className="text-sm text-muted-foreground mt-2">{day.overview}</p>
                            )}
                          </CardHeader>
                        </Card>

                        <div className="space-y-4">
                          {day.activities.length === 0 ? (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Nu sunt planificate activități pentru această zi.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            day.activities.map((activity) => (
                              <ActivityCard key={activity.id} activity={activity} />
                            ))
                          )}
                        </div>

                        {/* Separator between days (except last one) */}
                        {index < itineraryDays.length - 1 && (
                          <div className="mt-8 border-t border-border/50"></div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Show selected day only
                  (() => {
                    const day = itineraryDays.find(d => d.id === selectedDay);
                    if (!day) return null;
                    
                    return (
                      <div>
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="h-5 w-5" />
                              {day.title}
                            </CardTitle>
                            <p className="text-muted-foreground">
                              {format(parseISO(day.date), "EEEE, d MMMM yyyy", { locale: ro })}
                            </p>
                            {day.overview && (
                              <p className="text-sm text-muted-foreground mt-2">{day.overview}</p>
                            )}
                          </CardHeader>
                        </Card>

                        <div className="space-y-4">
                          {day.activities.length === 0 ? (
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Nu sunt planificate activități pentru această zi.
                              </AlertDescription>
                            </Alert>
                          ) : (
                            day.activities.map((activity) => (
                              <ActivityCard key={activity.id} activity={activity} />
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default ItineraryPage;