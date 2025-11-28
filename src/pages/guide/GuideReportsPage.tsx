import { useState, useEffect } from "react";
import Navigation from "@/components/shared/layout/Navigation";
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Rapoarte Zilnice</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Creează și vizualizează rapoarte zilnice pentru circuiturile tale
            </p>
          </div>

          {trips.length > 1 && (
            <div className="mb-6 sm:mb-8">
              <Label htmlFor="trip-select" className="text-sm font-medium">Selectează circuitul:</Label>
              <select
                id="trip-select"
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              >
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.nume} - {trip.destinatie}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Raport Nou Section */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-xl sm:text-2xl font-semibold">Raport Nou</h2>
            </div>
            {selectedTripId && (
              <GuideDailyReport tripId={selectedTripId} onReportSaved={fetchReports} />
            )}
          </div>

          {/* Istoric Rapoarte Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Istoric Rapoarte
              </h2>
              <Badge variant="secondary" className="ml-auto">{reports.length}</Badge>
            </div>
            
            {reports.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground text-center">
                    Nu există rapoarte pentru acest circuit.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                {reports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          {format(parseISO(report.report_date), "d MMMM yyyy", { locale: ro })}
                        </span>
                        {report.participant_count && (
                          <Badge variant="secondary" className="w-fit">
                            {report.participant_count} participanți
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {report.activities_completed && report.activities_completed.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-1 text-foreground">Activități finalizate</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.activities_completed.length} activități completate
                          </p>
                        </div>
                      )}
                      {report.issues_encountered && (
                        <div>
                          <p className="text-sm font-semibold mb-1 text-foreground">Probleme întâmpinate</p>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {report.issues_encountered}
                          </p>
                        </div>
                      )}
                      {report.solutions_applied && (
                        <div>
                          <p className="text-sm font-semibold mb-1 text-foreground">Soluții aplicate</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.solutions_applied}
                          </p>
                        </div>
                      )}
                      {report.notes_for_admin && (
                        <div>
                          <p className="text-sm font-semibold mb-1 text-foreground">Note pentru administrator</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.notes_for_admin}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideReportsPage;
