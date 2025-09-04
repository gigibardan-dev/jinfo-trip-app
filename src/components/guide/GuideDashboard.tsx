import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Users, FileText, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/shared/StatsCard";

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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayReports, setTodayReports] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchTodayReports();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_assignments')
        .select(`
          *,
          trips (
            id,
            nume,
            destinatie,
            start_date,
            end_date,
            status,
            created_by_admin_id
          )
        `)
        .eq('guide_user_id', user?.id)
        .eq('is_active', true)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca circuitele atribuite.",
        variant: "destructive",
      });
    }
  };

  const fetchTodayReports = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('guide_user_id', user?.id)
        .eq('report_date', today);

      if (error) throw error;
      setTodayReports(data || []);
    } catch (error) {
      console.error('Error fetching today reports:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                        <Button size="sm" className="flex-1">
                          Gestionează Itinerariu
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
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

                      <Button size="sm" className="w-full">
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

                      <Button size="sm" variant="outline" className="w-full">
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