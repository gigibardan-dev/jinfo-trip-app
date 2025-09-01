import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Plus, Edit, Trash2, Eye, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "./RichTextEditor";

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  tara: string;
  oras: string;
  descriere: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  cover_image_url: string;
  budget_estimat: number;
  group_id: string;
  tourist_groups?: {
    nume_grup: string;
  };
  metadata?: any;
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
  cover_image_url: string;
  status: 'draft' | 'confirmed' | 'active' | 'completed' | 'cancelled';
}

const EnhancedTripManager = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<TripFormData>({
    nume: "",
    destinatie: "",
    tara: "",
    oras: "",
    descriere: "",
    start_date: "",
    end_date: "",
    budget_estimat: "",
    group_id: "",
    cover_image_url: "",
    status: "draft"
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
      group_id: trip.group_id,
      cover_image_url: trip.cover_image_url || "",
      status: trip.status
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
      group_id: "",
      cover_image_url: "",
      status: "draft"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activă';
      case 'completed': return 'Finalizată';
      case 'cancelled': return 'Anulată';
      case 'draft': return 'Schiță';
      default: return status;
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destinatie.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-8">Se încarcă turele...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestionare Ture Avansată</h2>
          <p className="text-muted-foreground">Creează și gestionează călătoriile cu instrumente avansate</p>
        </div>
        
        {profile?.role === 'admin' && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingTrip(null); }} className="bg-gradient-hero">
                <Plus className="w-4 h-4 mr-2" />
                Tură Nouă
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTrip ? 'Editează Tura' : 'Tură Nouă'}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Informații de Bază</TabsTrigger>
                  <TabsTrigger value="details">Detalii</TabsTrigger>
                  <TabsTrigger value="settings">Setări</TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleSubmit}>
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nume">Nume Tură *</Label>
                        <Input
                          id="nume"
                          value={formData.nume}
                          onChange={(e) => setFormData({ ...formData, nume: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="destinatie">Destinație *</Label>
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
                        <Label htmlFor="tara">Țară *</Label>
                        <Input
                          id="tara"
                          value={formData.tara}
                          onChange={(e) => setFormData({ ...formData, tara: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="oras">Oraș *</Label>
                        <Input
                          id="oras"
                          value={formData.oras}
                          onChange={(e) => setFormData({ ...formData, oras: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start_date">Data Start *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_date">Data Sfârșit *</Label>
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
                      <Label htmlFor="descriere">Descriere Detaliată</Label>
                      <RichTextEditor
                        content={formData.descriere}
                        onChange={(content) => setFormData({ ...formData, descriere: content })}
                        placeholder="Descrie tura în detaliu..."
                      />
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
                        <Label htmlFor="cover_image_url">URL Imagine Principală</Label>
                        <Input
                          id="cover_image_url"
                          type="url"
                          value={formData.cover_image_url}
                          onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="group_id">Grup *</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Schiță</SelectItem>
                            <SelectItem value="active">Activă</SelectItem>
                            <SelectItem value="completed">Finalizată</SelectItem>
                            <SelectItem value="cancelled">Anulată</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                      Anulează
                    </Button>
                    <Button type="submit" className="bg-gradient-hero">
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
            placeholder="Caută ture..."
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
              <SelectItem value="active">Active</SelectItem>
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

      {/* Trips Grid */}
      <div className={viewMode === 'grid' ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
        {filteredTrips.map((trip) => (
          <Card key={trip.id} className="group hover:shadow-soft transition-all duration-300 border-border/20">
            {trip.cover_image_url && viewMode === 'grid' && (
              <div className="aspect-video overflow-hidden">
                <img 
                  src={trip.cover_image_url} 
                  alt={trip.nume}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {trip.nume}
                  </CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {trip.destinatie}, {trip.tara}
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
                  {trip.tourist_groups?.nume_grup}
                </div>

                {trip.budget_estimat && (
                  <div className="text-sm">
                    <span className="font-medium">Budget:</span> €{trip.budget_estimat}
                  </div>
                )}

                {trip.descriere && (
                  <div 
                    className="text-sm text-muted-foreground line-clamp-2 prose prose-sm"
                    dangerouslySetInnerHTML={{ __html: trip.descriere }}
                  />
                )}

                {profile?.role === 'admin' && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(trip)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editează
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
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nicio tură găsită</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Încearcă să modifici filtrele de căutare.'
              : profile?.role === 'admin' 
                ? 'Începe prin a crea prima tură.' 
                : 'Nu există ture disponibile momentan.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedTripManager;