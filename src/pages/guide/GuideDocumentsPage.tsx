import { useState, useEffect } from "react";
import Navigation from "@/components/shared/layout/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GuideReceivedDocuments from "@/components/guide/GuideReceivedDocuments";
import { GuideOfflineSavedDocuments } from "@/components/guide/documents/GuideOfflineSavedDocuments";
import GuideUploadDocuments from "@/components/guide/documents/GuideUploadDocuments";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  start_date: string;
  end_date: string;
}

const GuideDocumentsPage = () => {
  const { user, profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [offlineRefreshKey, setOfflineRefreshKey] = useState(0);

  useEffect(() => {
    if (user && profile?.role === "guide") {
      fetchAssignedTrips();
    }
  }, [user, profile]);

  const fetchAssignedTrips = async () => {
    try {
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

      const tripIds = [...new Set(assignmentsData.map(a => a.trip_id))];

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

  const handleOfflineSaved = () => {
    setOfflineRefreshKey(prev => prev + 1);
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
            <h1 className="text-3xl font-bold mb-2">Documente</h1>
            <p className="text-muted-foreground">
              Gestionează documentele pentru circuiturile tale
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

          <Tabs defaultValue="received" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2 h-auto p-2 bg-transparent">
              <TabsTrigger value="received" className="border-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10">
                Documente Primite
              </TabsTrigger>
              <TabsTrigger value="offline" className="border-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10">
                Salvate Offline
              </TabsTrigger>
              <TabsTrigger value="upload" className="border-2 data-[state=active]:border-primary data-[state=active]:bg-primary/10">
                Upload Documente
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received">
              <GuideReceivedDocuments onOfflineSaved={handleOfflineSaved} />
            </TabsContent>

            <TabsContent value="offline">
              <GuideOfflineSavedDocuments key={offlineRefreshKey} />
            </TabsContent>

            <TabsContent value="upload">
              <GuideUploadDocuments 
                trips={trips}
                selectedTripId={selectedTripId}
                onTripChange={setSelectedTripId}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GuideDocumentsPage;