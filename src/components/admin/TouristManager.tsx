import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Mail,
  Phone,
  UserPlus,
  UserMinus,
  Eye
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Tourist {
  id: string;
  email: string;
  nume: string;
  prenume: string;
  telefon?: string;
  avatar_url?: string;
  is_active: boolean;
  role: string;
  created_at: string;
  group_memberships?: {
    group_id: string;
    role_in_group: string;
    tourist_groups: {
      nume_grup: string;
    };
  }[];
}

interface TouristGroup {
  id: string;
  nume_grup: string;
  is_active: boolean;
  member_count?: any;
}

interface TouristFormData {
  email: string;
  nume: string;
  prenume: string;
  telefon: string;
  password: string;
  avatar_url: string;
  group_ids: string[];
}

const TouristManager = () => {
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [groups, setGroups] = useState<TouristGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTourist, setEditingTourist] = useState<Tourist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState<TouristFormData>({
    email: "",
    nume: "",
    prenume: "",
    telefon: "",
    password: "",
    avatar_url: "",
    group_ids: []
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchTourists();
      fetchGroups();
    }
  }, [user, profile]);

  const fetchTourists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          group_memberships:group_members(
            group_id,
            role_in_group,
            tourist_groups(nume_grup)
          )
        `)
        .eq('role', 'tourist')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTourists(data || []);
    } catch (error) {
      console.error('Error fetching tourists:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca turiștii.",
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
        .select(`
          *,
          member_count:group_members(count)
        `)
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
      if (editingTourist) {
        // Update existing tourist
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            nume: formData.nume,
            prenume: formData.prenume,
            telefon: formData.telefon,
            avatar_url: formData.avatar_url
          })
          .eq('id', editingTourist.id);

        if (updateError) throw updateError;

        // Update group memberships
        await updateGroupMemberships(editingTourist.id);

        toast({
          title: "Succes",
          description: "Turistul a fost actualizat cu succes.",
        });
      } else {
        // Create new tourist
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              nume: formData.nume,
              prenume: formData.prenume,
              telefon: formData.telefon,
              role: 'tourist'
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Add group memberships
          await updateGroupMemberships(authData.user.id);
        }

        toast({
          title: "Succes",
          description: "Turistul a fost creat cu succes.",
        });
      }

      setShowDialog(false);
      setEditingTourist(null);
      resetForm();
      fetchTourists();
    } catch (error: any) {
      console.error('Error saving tourist:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut salva turistul.",
        variant: "destructive",
      });
    }
  };

  const updateGroupMemberships = async (userId: string) => {
    try {
      // Remove existing memberships
      await supabase
        .from('group_members')
        .delete()
        .eq('user_id', userId);

      // Add new memberships
      if (formData.group_ids.length > 0) {
        const memberships = formData.group_ids.map(groupId => ({
          user_id: userId,
          group_id: groupId,
          role_in_group: 'member' as const
        }));

        const { error } = await supabase
          .from('group_members')
          .insert(memberships);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating group memberships:', error);
      throw error;
    }
  };

  const handleEdit = (tourist: Tourist) => {
    setEditingTourist(tourist);
    setFormData({
      email: tourist.email,
      nume: tourist.nume,
      prenume: tourist.prenume,
      telefon: tourist.telefon || "",
      password: "",
      avatar_url: tourist.avatar_url || "",
      group_ids: tourist.group_memberships?.map(gm => gm.group_id) || []
    });
    setShowDialog(true);
  };

  const handleDelete = async (touristId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest turist?")) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', touristId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Turistul a fost dezactivat cu succes.",
      });
      fetchTourists();
    } catch (error) {
      console.error('Error deleting tourist:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut dezactiva turistul.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (touristId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', touristId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: `Turistul a fost ${!currentStatus ? 'activat' : 'dezactivat'} cu succes.`,
      });
      fetchTourists();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza statusul.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      nume: "",
      prenume: "",
      telefon: "",
      password: "",
      avatar_url: "",
      group_ids: []
    });
  };

  const filteredTourists = tourists.filter(tourist => {
    const matchesSearch = 
      tourist.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tourist.prenume.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tourist.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = filterGroup === 'all' || 
      tourist.group_memberships?.some(gm => gm.group_id === filterGroup);
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && tourist.is_active) ||
      (filterStatus === 'inactive' && !tourist.is_active);

    return matchesSearch && matchesGroup && matchesStatus;
  });

  const getInitials = (nume: string, prenume: string) => {
    return `${nume.charAt(0)}${prenume.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă turiștii...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestionare Turiști</h2>
          <p className="text-muted-foreground">Adaugă și gestionează turiștii înregistrați</p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingTourist(null); }} className="bg-gradient-hero">
              <Plus className="w-4 h-4 mr-2" />
              Turist Nou
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTourist ? 'Editează Turistul' : 'Turist Nou'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Date Personale</TabsTrigger>
                  <TabsTrigger value="groups">Grupuri</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nume">Nume *</Label>
                      <Input
                        id="nume"
                        value={formData.nume}
                        onChange={(e) => setFormData({ ...formData, nume: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prenume">Prenume *</Label>
                      <Input
                        id="prenume"
                        value={formData.prenume}
                        onChange={(e) => setFormData({ ...formData, prenume: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingTourist}
                      required
                    />
                  </div>

                  {!editingTourist && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Parolă *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefon">Telefon</Label>
                      <Input
                        id="telefon"
                        value={formData.telefon}
                        onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">URL Avatar</Label>
                      <Input
                        id="avatar_url"
                        type="url"
                        value={formData.avatar_url}
                        onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Adaugă în Grupuri</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`group-${group.id}`}
                            checked={formData.group_ids.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  group_ids: [...formData.group_ids, group.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  group_ids: formData.group_ids.filter(id => id !== group.id)
                                });
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`group-${group.id}`} className="text-sm">
                            {group.nume_grup}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Anulează
                </Button>
                <Button type="submit" className="bg-gradient-hero">
                  {editingTourist ? 'Actualizează' : 'Creează'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Caută turiști..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Grup" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate grupurile</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.nume_grup}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="active">Activi</SelectItem>
              <SelectItem value="inactive">Inactivi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tourists Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTourists.map((tourist) => (
          <Card key={tourist.id} className="hover:shadow-soft transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={tourist.avatar_url} />
                    <AvatarFallback>
                      {getInitials(tourist.nume, tourist.prenume)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {tourist.nume} {tourist.prenume}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="w-3 h-3 mr-1" />
                      {tourist.email}
                    </div>
                  </div>
                </div>
                <Badge variant={tourist.is_active ? "default" : "secondary"}>
                  {tourist.is_active ? "Activ" : "Inactiv"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {tourist.telefon && (
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    {tourist.telefon}
                  </div>
                )}

                {tourist.group_memberships && tourist.group_memberships.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Grupuri:</div>
                    <div className="flex flex-wrap gap-1">
                      {tourist.group_memberships.map((gm, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {gm.tourist_groups.nume_grup}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Înregistrat: {new Date(tourist.created_at).toLocaleDateString('ro-RO')}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(tourist)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editează
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(tourist.id, tourist.is_active)}
                  >
                    {tourist.is_active ? <UserMinus className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(tourist.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTourists.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Niciun turist găsit</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterGroup !== 'all' || filterStatus !== 'all'
              ? 'Încearcă să modifici filtrele de căutare.'
              : 'Începe prin a adăuga primul turist.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default TouristManager;