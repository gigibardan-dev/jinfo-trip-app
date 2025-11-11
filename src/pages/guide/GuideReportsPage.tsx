import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import GuideDailyReport from "@/components/guide/GuideDailyReport";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ro } from "date-fns/locale";
import { FileText, Calendar } from "lucide-react";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  start_date: string;
  end_date: string;
}

interface DailyReport {
  id: string;
  trip_id: string;
  report_date: string;
  participant_count: number | null;
  activities_completed: string[] | null;
  issues_encountered: string | null;
  solutions_applied: string | null;
  notes_for_admin: string | null;
  created_at: string;
  trips?: {
    nume: string;
    destinatie: string;
  };
}

const GuideReportsPage = () => {
  const { user, profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === "guide") {
      fetchAssignedTrips();
    }
  }, [user, profile]);

  useEffect(() => {
    if (selectedTripId) {
      fetchReports();
    }
  }, [selectedTripId]);

  const fetchAssignedTrips = async () => {
    try {
      // First fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('guide_assignments')
        .select('*')
        .eq('guide_user_id', user!.id)
        .eq('is_active', true);

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setTrips([]);
        setLoading(false);
        return;
      }

      // Get unique trip IDs
      const tripIds = [...new Set(assignmentsData.map(a => a.trip_id))];

      // Fetch trip details
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, nume, destinatie, start_date, end_date')
        .in('id', tripIds);

      if (tripsError) throw tripsError;

      setTrips(tripsData || []);
      if (tripsData && tripsData.length > 0) {
        setSelectedTripId(tripsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching assigned trips:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!selectedTripId) return;

    try {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("trip_id", selectedTripId)
        .eq("guide_user_id", user!.id)
        .order("report_date", { ascending: false });

      if (error) throw error;
      setReports((data as any) || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  if (!user || profile?.role !== "guide") {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation userRole="guide" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Această pagină este disponibilă doar pentru ghizi autentificați.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation userRole="guide" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Se încarcă...</div>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <Navigation userRole="guide" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nu ai circuite asignate momentan.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="guide" />
      <div className="pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Rapoarte Zilnice</h1>
            <p className="text-muted-foreground">
              Creează și vizualizează rapoarte zilnice pentru circuiturile tale
            </p>
          </div>

          {trips.length > 1 && (
            <div className="mb-6">
              <Label htmlFor="trip-select">Selectează circuitul:</Label>
              <select
                id="trip-select"
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
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

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-semibold mb-4">Raport Nou</h2>
              {selectedTripId && (
                <GuideDailyReport tripId={selectedTripId} />
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Istoric Rapoarte ({reports.length})
              </h2>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      Nu există rapoarte pentru acest circuit.
                    </AlertDescription>
                  </Alert>
                ) : (
                  reports.map((report) => (
                    <Card key={report.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(parseISO(report.report_date), "d MMMM yyyy", { locale: ro })}
                          </span>
                          {report.participant_count && (
                            <Badge variant="secondary">
                              {report.participant_count} participanți
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {report.activities_completed && report.activities_completed.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium">Activități finalizate:</p>
                            <p className="text-sm text-muted-foreground">
                              {report.activities_completed.join(", ")}
                            </p>
                          </div>
                        )}
                        {report.issues_encountered && (
                          <div className="mb-2">
                            <p className="text-sm font-medium">Probleme întâmpinate:</p>
                            <p className="text-sm text-muted-foreground">
                              {report.issues_encountered}
                            </p>
                          </div>
                        )}
                        {report.solutions_applied && (
                          <div className="mb-2">
                            <p className="text-sm font-medium">Soluții aplicate:</p>
                            <p className="text-sm text-muted-foreground">
                              {report.solutions_applied}
                            </p>
                          </div>
                        )}
                        {report.notes_for_admin && (
                          <div>
                            <p className="text-sm font-medium">Note pentru administrator:</p>
                            <p className="text-sm text-muted-foreground">
                              {report.notes_for_admin}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideReportsPage;
