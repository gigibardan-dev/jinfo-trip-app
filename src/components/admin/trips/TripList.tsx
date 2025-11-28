import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Users, Plus, Edit, Trash2, Route, Eye, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DOMPurify from 'dompurify';
import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";

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
  offline_map_configs?: {
    id: string;
    locations: any;
    estimated_size_mb: number;
  } | null;
}

interface TripListProps {
  onCreateNew: () => void;
  onEdit: (trip: Trip) => void;
  onItinerary: (trip: Trip) => void;
  onDelete: (tripId: string) => Promise<void>;
  onDuplicate: (trip: Trip) => Promise<void>;
}

const TripList = ({ onCreateNew, onEdit, onItinerary, onDelete, onDuplicate }: TripListProps) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTrips();
      
      // Real-time updates
      const channel = supabase
        .channel('trips_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'trips'
        }, () => {
          fetchTrips();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
          ),
          offline_map_configs (
            id,
            locations,
            estimated_size_mb
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

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = (trip.nume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (trip.destinatie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (trip.tara || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [trips, searchTerm, filterStatus]);

  // Statistics
  const stats = useMemo(() => ({
    total: trips.length,
    active: trips.filter(t => t.status === 'active').length,
    completed: trips.filter(t => t.status === 'completed').length,
    draft: trips.filter(t => t.status === 'draft').length
  }), [trips]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <ListSkeleton count={6} />
      </div>
    );
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
          <Button onClick={onCreateNew} className="bg-gradient-hero">
            <Plus className="w-4 h-4 mr-2" />
            Circuit Nou
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Circuite</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Active</div>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Completate</div>
            <div className="text-2xl font-bold text-primary">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Schițe</div>
            <div className="text-2xl font-bold text-muted-foreground">{stats.draft}</div>
          </CardContent>
        </Card>
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

      {/* Trips Grid */}
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
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(trip.descriere) }}
                  />
                )}

                {profile?.role === 'admin' && (
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onItinerary(trip)}
                      className="flex-1"
                    >
                      <Route className="w-4 h-4 mr-1" />
                      Itinerariu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEdit(trip)} className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editează
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDuplicate(trip)} className="flex-1">
                      <Plus className="w-4 h-4 mr-1" />
                      Duplică
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onDelete(trip.id)}
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
    </div>
  );
};

export default TripList;
