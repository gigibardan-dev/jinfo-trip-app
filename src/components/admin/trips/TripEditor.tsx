import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Route } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FormSkeleton } from "@/components/shared/skeletons/FormSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load componente heavy
const ItineraryManager = lazy(() => import("@/components/ItineraryManager"));
const TripMapConfig = lazy(() => import("./TripMapConfig"));
const RichTextEditor = lazy(() => import("../RichTextEditor"));

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
  offline_map_configs?: {
    id: string;
    locations: any;
    estimated_size_mb: number;
    bounds_north: number;
    bounds_south: number;
    bounds_east: number;
    bounds_west: number;
    zoom_min: number;
    zoom_max: number;
  } | null;
}

interface TripFormData {
  nume: string;
  destinatie: string;
  tara: string;
  descriere: string;
  start_date: string;
  end_date: string;
  group_id: string;
  status: 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled';
}

interface TripEditorProps {
  trip?: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

const TripEditor = ({ trip, open, onOpenChange, onSave }: TripEditorProps) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [mapConfig, setMapConfig] = useState<any>(null);
  const [formData, setFormData] = useState<TripFormData>({
    nume: "",
    destinatie: "",
    tara: "",
    descriere: "",
    start_date: "",
    end_date: "",
    group_id: "",
    status: "draft"
  });
  const [activeTab, setActiveTab] = useState<string>("basic");

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (trip) {
      setFormData({
        nume: trip.nume,
        destinatie: trip.destinatie,
        tara: trip.tara,
        descriere: trip.descriere || "",
        start_date: trip.start_date,
        end_date: trip.end_date,
        group_id: trip.group_id,
        status: trip.status
      });
      setMapConfig(trip.offline_map_configs || null);
    } else {
      resetForm();
    }
  }, [trip]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('tourist_groups')
        .select('id, nume_grup')
        .eq('is_active', true)
        .order('nume_grup');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const updateItineraryDates = async (tripId: string, newStartDate: string, newEndDate: string) => {
    try {
      const { data: existingDays, error: fetchError } = await supabase
        .from('itinerary_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('day_number');

      if (fetchError) throw fetchError;

      if (!existingDays || existingDays.length === 0) return;

      const start = new Date(newStartDate);
      const updatedDays = existingDays.map((day, index) => {
        const newDate = new Date(start);
        newDate.setDate(start.getDate() + index);
        return {
          id: day.id,
          date: newDate.toISOString().split('T')[0]
        };
      });

      for (const day of updatedDays) {
        const { error: updateError } = await supabase
          .from('itinerary_days')
          .update({ date: day.date })
          .eq('id', day.id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error updating itinerary dates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validare date
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast({
        title: "Eroare",
        description: "Data de sfârșit trebuie să fie după data de start.",
        variant: "destructive",
      });
      return;
    }

    // Validare pentru status activ - trebuie să aibă grup
    if ((formData.status === 'active' || formData.status === 'confirmed') && !formData.group_id) {
      toast({
        title: "Eroare",
        description: "Circuitele confirmate sau active trebuie să aibă un grup asignat.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const tripData = {
        nume: formData.nume.trim(),
        destinatie: formData.destinatie.trim(),
        tara: formData.tara.trim(),
        oras: null,
        descriere: formData.descriere.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        group_id: formData.group_id || null, // Allow null group_id for drafts
        status: formData.status,
        created_by_admin_id: user!.id,
        budget_estimat: null,
        cover_image_url: null,
        metadata: null
      };

      if (trip) {
        const oldStartDate = trip.start_date;
        const oldEndDate = trip.end_date;
        const hasDateChanged = oldStartDate !== formData.start_date || oldEndDate !== formData.end_date;

        const { error } = await supabase
          .from('trips')
          .update(tripData)
          .eq('id', trip.id);

        if (error) throw error;

        // Update itinerary dates if trip dates changed
        if (hasDateChanged) {
          await updateItineraryDates(trip.id, formData.start_date, formData.end_date);
        }

        toast({
          title: "Succes",
          description: "Circuitul a fost actualizat cu succes.",
        });
      } else {
        const { error } = await supabase
          .from('trips')
          .insert([tripData]);

        if (error) throw error;
        toast({
          title: "Succes",
          description: "Circuitul a fost creat cu succes.",
        });
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving trip:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut salva circuitul.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nume: "",
      destinatie: "",
      tara: "",
      descriere: "",
      start_date: "",
      end_date: "",
      group_id: "",
      status: "draft"
    });
    setMapConfig(null);
    setActiveTab("basic");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            {trip ? 'Editează Circuitul' : 'Circuit Nou'}
          </DialogTitle>
          <DialogDescription>
            Completează informațiile pentru circuit.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Informații de Bază</TabsTrigger>
            <TabsTrigger value="details">Detalii</TabsTrigger>
            <TabsTrigger value="settings">Setări</TabsTrigger>
            <TabsTrigger value="map" disabled={!trip}>Hartă Offline</TabsTrigger>
          </TabsList>
          
          <form id="trip-form" onSubmit={handleSubmit}>
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nume">Numele Circuitului *</Label>
                <Input
                  id="nume"
                  value={formData.nume}
                  onChange={(e) => setFormData({ ...formData, nume: e.target.value })}
                  placeholder="ex: Circuitul Europei de Est"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destinatie">Destinații *</Label>
                  <Input
                    id="destinatie"
                    value={formData.destinatie}
                    onChange={(e) => setFormData({ ...formData, destinatie: e.target.value })}
                    placeholder="ex: Budapesta, Viena, Praga"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tara">Țări *</Label>
                  <Input
                    id="tara"
                    value={formData.tara}
                    onChange={(e) => setFormData({ ...formData, tara: e.target.value })}
                    placeholder="ex: Ungaria, Austria, Cehia"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data Plecare *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Întoarcere *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descriere">Descrierea Circuitului</Label>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <RichTextEditor
                    content={formData.descriere}
                    onChange={(content) => setFormData({ ...formData, descriere: content })}
                    placeholder="Descrie circuitul, obiectivele turistice, serviciile incluse..."
                  />
                </Suspense>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="group_id">Grup Participanți</Label>
                  <Select 
                    value={formData.group_id || "no-group"} 
                    onValueChange={(value) => setFormData({ ...formData, group_id: value === "no-group" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează grupul (opțional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-group">Fără grup (doar schiță)</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.nume_grup}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.group_id && (formData.status === 'active' || formData.status === 'confirmed') && (
                    <p className="text-sm text-destructive">
                      Grupul este obligatoriu pentru circuitele confirmate/active
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status Circuit</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Schiță</SelectItem>
                      <SelectItem value="confirmed">Confirmat</SelectItem>
                      <SelectItem value="active">În Desfășurare</SelectItem>
                      <SelectItem value="completed">Finalizat</SelectItem>
                      <SelectItem value="cancelled">Anulat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {groups.length === 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Info:</strong> Nu există grupuri active. 
                    <br />Poți crea circuitul ca schiță și îl vei putea asigna la un grup mai târziu.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="map" className="space-y-4">
              {trip ? (
                <Suspense fallback={<FormSkeleton />}>
                  <TripMapConfig
                    tripId={trip.id}
                    tripData={{
                      id: trip.id,
                      destinatie: formData.destinatie,
                      tara: formData.tara
                    }}
                    mapConfig={mapConfig}
                    onConfigUpdated={(config) => setMapConfig(config)}
                  />
                </Suspense>
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  Salvează mai întâi circuitul pentru a configura harta offline.
                </div>
              )}
            </TabsContent>
          </form>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button 
            type="submit"
            form="trip-form"
            className="bg-gradient-hero"
          >
            {trip ? 'Actualizează' : 'Creează'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TripEditor;
