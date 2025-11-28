import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Route } from "lucide-react";
import Navigation from "@/components/shared/layout/Navigation";
import TripList from "@/components/admin/trips/TripList";
import TripEditor from "@/components/admin/trips/TripEditor";
import ItineraryManager from "@/components/ItineraryManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  tara: string;
  descriere: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  group_id: string;
  offline_map_configs?: any;
}

const TripsPage = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);
  const [itineraryTrip, setItineraryTrip] = useState<Trip | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreateNew = () => {
    setSelectedTrip(null);
    setShowEditor(true);
  };

  const handleEdit = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowEditor(true);
  };

  const handleItinerary = (trip: Trip) => {
    setItineraryTrip(trip);
    setShowItinerary(true);
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest circuit?")) return;

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Circuitul a fost șters cu succes.",
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge circuitul.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (trip: Trip) => {
    if (!confirm(`Ești sigur că vrei să duplici circuitul "${trip.nume}"?`)) return;

    try {
      // Create duplicate trip with draft status and no group
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert([{
          nume: `${trip.nume} (Copie)`,
          destinatie: trip.destinatie,
          tara: trip.tara,
          descriere: trip.descriere,
          start_date: trip.start_date,
          end_date: trip.end_date,
          status: 'draft',
          group_id: null,
          created_by_admin_id: user!.id,
          budget_estimat: null,
          cover_image_url: null,
          metadata: null
        }])
        .select()
        .single();

      if (tripError) throw tripError;

      // Duplicate itinerary days and activities
      const { data: days, error: daysError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', trip.id)
        .order('day_number');

      if (daysError) throw daysError;

      if (days && days.length > 0) {
        await Promise.all(days.map(async (day) => {
          const { data: newDay, error: dayError } = await supabase
            .from('itinerary_days')
            .insert([{
              trip_id: newTrip.id,
              day_number: day.day_number,
              date: day.date,
              title: day.title,
              overview: day.overview
            }])
            .select()
            .single();

          if (dayError) throw dayError;

          // Duplicate activities for this day
          const { data: activities, error: activitiesError } = await supabase
            .from('itinerary_activities')
            .select('*')
            .eq('day_id', day.id)
            .order('display_order');

          if (activitiesError) throw activitiesError;

          if (activities && activities.length > 0) {
            const newActivities = activities.map(activity => ({
              day_id: newDay.id,
              title: activity.title,
              description: activity.description,
              activity_type: activity.activity_type,
              start_time: activity.start_time,
              end_time: activity.end_time,
              location_name: activity.location_name,
              address: activity.address,
              cost_estimate: activity.cost_estimate,
              booking_reference: activity.booking_reference,
              tips_and_notes: activity.tips_and_notes,
              display_order: activity.display_order,
              latitude: activity.latitude,
              longitude: activity.longitude,
              images: activity.images,
              metadata: activity.metadata
            }));

            const { error: activitiesInsertError } = await supabase
              .from('itinerary_activities')
              .insert(newActivities);

            if (activitiesInsertError) throw activitiesInsertError;
          }

          return newDay;
        }));
      }

      toast({
        title: "Succes",
        description: "Circuitul a fost duplicat cu succes.",
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error duplicating trip:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut duplica circuitul.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    setShowEditor(false);
    setSelectedTrip(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Navigation userRole="admin" />
      <div className="pt-14 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TripList
            key={refreshTrigger}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onItinerary={handleItinerary}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />

          <TripEditor
            trip={selectedTrip}
            open={showEditor}
            onOpenChange={setShowEditor}
            onSave={handleSave}
          />

          {/* Itinerary Management Dialog */}
          <Dialog open={showItinerary} onOpenChange={setShowItinerary}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] flex flex-col p-0">
              <DialogHeader className="p-6 pb-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Gestionează Itinerariu - {itineraryTrip?.nume}
                </DialogTitle>
                <DialogDescription>
                  Vizualizează și gestionează itinerarul complet al circuitului.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-6">
                {itineraryTrip && (
                  <ItineraryManager
                    tripId={itineraryTrip.id}
                    tripName={itineraryTrip.nume}
                    startDate={itineraryTrip.start_date}
                    endDate={itineraryTrip.end_date}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default TripsPage;