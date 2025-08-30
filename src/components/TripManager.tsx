import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Plus, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  tara: string;
  oras: string;
  descriere: string;
  start_date: string;
  end_date: string;
  status: string;
  cover_image_url: string;
  budget_estimat: number;
  group_id: string;
  tourist_groups?: {
    nume_grup: string;
  };
}

interface TripFormData {
  nume: string;
  destinatie: string;
  tara: string;
  oras: string;
  descriere: string;
  start_date: string;
  end_date: string;
  budget_estimat: string;
  group_id: string;
}

const TripManager = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<TripFormData>({
    nume: "",
    destinatie: "",
    tara: "",
    oras: "",
    descriere: "",
    start_date: "",
    end_date: "",
    budget_estimat: "",
    group_id: ""
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();

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
        description: "Nu s-au putut încărca turele.",
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
        .select('*')
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
    
    try {
      const tripData = {
        ...formData,
        budget_estimat: formData.budget_estimat ? parseFloat(formData.budget_estimat) : null,
        created_by_admin_id: user!.id
      };

      if (editingTrip) {
        const { error } = await supabase
          .from('trips')
          .update(tripData)
          .eq('id', editingTrip.id);

        if (error) throw error;
        toast({
          title: "Succes",
          description: "Tura a fost actualizată cu succes.",
        });
      } else {
        const { error } = await supabase
          .from('trips')
          .insert([tripData]);

        if (error) throw error;
        toast({
          title: "Succes",
          description: "Tura a fost creată cu succes.",
        });
      }

      setShowDialog(false);
      setEditingTrip(null);
      resetForm();
      fetchTrips();
    } catch (error) {
      console.error('Error saving trip:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut salva tura.",
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
      oras: trip.oras,
      descriere: trip.descriere || "",
      start_date: trip.start_date,
      end_date: trip.end_date,
      budget_estimat: trip.budget_estimat?.toString() || "",
      group_id: trip.group_id
    });
    setShowDialog(true);
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi această tură?")) return;

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Tura a fost ștearsă cu succes.",
      });
      fetchTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge tura.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nume: "",
      destinatie: "",
      tara: "",
      oras: "",
      descriere: "",
      start_date: "",
      end_date: "",
      budget_estimat: "",
      group_id: ""
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă turele...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestionare Ture</h2>
        {profile?.role === 'admin' && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingTrip(null); }}>
                <Plus className="w-4 h-4 mr-2" />
                Tură Nouă
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTrip ? 'Editează Tura' : 'Tură Nouă'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nume">Nume Tură</Label>
                    <Input
                      id="nume"
                      value={formData.nume}
                      onChange={(e) => setFormData({ ...formData, nume: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destinatie">Destinație</Label>
                    <Input
                      id="destinatie"
                      value={formData.destinatie}
                      onChange={(e) => setFormData({ ...formData, destinatie: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tara">Țară</Label>
                    <Input
                      id="tara"
                      value={formData.tara}
                      onChange={(e) => setFormData({ ...formData, tara: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oras">Oraș</Label>
                    <Input
                      id="oras"
                      value={formData.oras}
                      onChange={(e) => setFormData({ ...formData, oras: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descriere">Descriere</Label>
                  <Textarea
                    id="descriere"
                    value={formData.descriere}
                    onChange={(e) => setFormData({ ...formData, descriere: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Data Start</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Data Sfârșit</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_estimat">Budget Estimat (EUR)</Label>
                    <Input
                      id="budget_estimat"
                      type="number"
                      value={formData.budget_estimat}
                      onChange={(e) => setFormData({ ...formData, budget_estimat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group_id">Grup</Label>
                    <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează grupul" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.nume_grup}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Anulează
                  </Button>
                  <Button type="submit">
                    {editingTrip ? 'Actualizează' : 'Creează'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip) => (
          <Card key={trip.id} className="bg-card/95 backdrop-blur-sm border-border/20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{trip.nume}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {trip.destinatie}, {trip.tara}
                  </div>
                </div>
                <Badge className={`${getStatusColor(trip.status)} text-white`}>
                  {trip.status}
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
                  {trip.tourist_groups?.nume_grup}
                </div>

                {trip.budget_estimat && (
                  <div className="text-sm">
                    <span className="font-medium">Budget:</span> €{trip.budget_estimat}
                  </div>
                )}

                {trip.descriere && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trip.descriere}
                  </p>
                )}

                {profile?.role === 'admin' && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(trip)}>
                      <Edit className="w-4 h-4" />
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

      {trips.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nicio tură găsită</h3>
          <p className="text-muted-foreground mb-4">
            {profile?.role === 'admin' 
              ? 'Începe prin a crea prima tură.' 
              : 'Nu există ture disponibile momentan.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TripManager;