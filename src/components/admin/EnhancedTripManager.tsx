import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Plus, Edit, Trash2, Eye, Settings, Route } from "lucide-react";
import ItineraryManager from "@/components/ItineraryManager";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "./RichTextEditor";

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
  cover_image_url?: string | null;
  tourist_groups?: {
    nume_grup: string;
  };
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

const EnhancedCircuitManager = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showItinerary, setShowItinerary] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
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

  const { user, profile } = useAuth();
  const { toast } = useToast();

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

  useEffect(() => {
    if (user) {
      fetchTrips();
      fetchGroups();
    }
  }, [user]);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          tourist_groups (
            nume_grup
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca circuitele.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

      if (editingTrip) {
        const oldStartDate = editingTrip.start_date;
        const oldEndDate = editingTrip.end_date;
        const hasDateChanged = oldStartDate !== formData.start_date || oldEndDate !== formData.end_date;

        const { error } = await supabase
          .from('trips')
          .update(tripData)
          .eq('id', editingTrip.id);

        if (error) throw error;

        // Update itinerary dates if trip dates changed
        if (hasDateChanged) {
          await updateItineraryDates(editingTrip.id, formData.start_date, formData.end_date);
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

      setShowDialog(false);
      setEditingTrip(null);
      resetForm();
      fetchTrips();
    } catch (error: any) {
      console.error('Error saving trip:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut salva circuitul.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip);
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
    setShowDialog(true);
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
          cover_image_url: trip.cover_image_url || null,
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
        const newDays = await Promise.all(days.map(async (day) => {
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
      fetchTrips();
    } catch (error) {
      console.error('Error duplicating trip:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut duplica circuitul.",
        variant: "destructive",
      });
    }
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
      fetchTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge circuitul.",
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
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      case 'confirmed': return 'bg-blue-500 text-white';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'În Desfășurare';
      case 'completed': return 'Finalizat';
      case 'cancelled': return 'Anulat';
      case 'confirmed': return 'Confirmat';
      case 'draft': return 'Schiță';
      default: return status;
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destinatie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.tara.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-8">Se încarcă circuitele...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestionare Circuite</h2>
          <p className="text-muted-foreground">Creează și gestionează circuitele turistice</p>
        </div>
        
        {profile?.role === 'admin' && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingTrip(null); }} className="bg-gradient-hero">
                <Plus className="w-4 h-4 mr-2" />
                Circuit Nou
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  {editingTrip ? 'Editează Circuitul' : 'Circuit Nou'}
                </DialogTitle>
                <DialogDescription>
                  Completează informațiile pentru circuit.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Informații de Bază</TabsTrigger>
                  <TabsTrigger value="details">Detalii</TabsTrigger>
                  <TabsTrigger value="settings">Setări</TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleSubmit}>
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
                      <RichTextEditor
                        content={formData.descriere}
                        onChange={(content) => setFormData({ ...formData, descriere: content })}
                        placeholder="Descrie circuitul, obiectivele turistice, serviciile incluse..."
                      />
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

                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      Anulează
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-gradient-hero"
                    >
                      {editingTrip ? 'Actualizează' : 'Creează'}
                    </Button>
                  </div>
                </form>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Caută circuite..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="draft">Schiță</SelectItem>
              <SelectItem value="confirmed">Confirmate</SelectItem>
              <SelectItem value="active">În Desfășurare</SelectItem>
              <SelectItem value="completed">Finalizate</SelectItem>
              <SelectItem value="cancelled">Anulate</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <Eye className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Circuits Grid */}
      <div className={viewMode === 'grid' ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
        {filteredTrips.map((trip) => (
          <Card key={trip.id} className="group hover:shadow-soft transition-all duration-300 border-border/20">            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {trip.nume}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {trip.destinatie}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {trip.tara}
                  </div>
                </div>
                <Badge className={getStatusColor(trip.status)}>
                  {getStatusText(trip.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                  {new Date(trip.start_date).toLocaleDateString('ro-RO')} - 
                  {new Date(trip.end_date).toLocaleDateString('ro-RO')}
                </div>
                
                <div className="flex items-center text-sm">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  {trip.tourist_groups?.nume_grup || 'Grup nespecificat'}
                </div>

                {trip.descriere && (
                  <div 
                    className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: trip.descriere }}
                  />
                )}

                {profile?.role === 'admin' && (
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setSelectedTrip(trip);
                        setShowItinerary(true);
                      }}
                      className="flex-1"
                    >
                      <Route className="w-4 h-4 mr-1" />
                      Itinerariu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(trip)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editează
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicate(trip)} className="flex-1">
                      <Plus className="w-4 h-4 mr-1" />
                      Duplică
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(trip.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTrips.length === 0 && (
        <div className="text-center py-12">
          <Route className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Niciun circuit găsit</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Încearcă să modifici filtrele de căutare.'
              : profile?.role === 'admin' 
                ? 'Începe prin a crea primul circuit.' 
                : 'Nu există circuite disponibile momentan.'
            }
          </p>
        </div>
      )}

      {/* Itinerary Management Dialog */}
      <Dialog open={showItinerary} onOpenChange={setShowItinerary}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Gestionează Itinerariu - {selectedTrip?.nume}
            </DialogTitle>
            <DialogDescription>
              Vizualizează și gestionează itinerarul complet al circuitului.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {selectedTrip && (
              <ItineraryManager
                tripId={selectedTrip.id}
                tripName={selectedTrip.nume}
                startDate={selectedTrip.start_date}
                endDate={selectedTrip.end_date}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedCircuitManager;