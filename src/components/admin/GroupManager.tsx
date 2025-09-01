import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Copy,
  UserPlus,
  UserMinus,
  RefreshCw,
  Mail,
  Phone,
  Eye,
  Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TouristGroup {
  id: string;
  nume_grup: string;
  invite_code: string;
  is_active: boolean;
  created_at: string;
  admin_user_id: string;
  metadata?: any;
  member_count?: number;
  members?: GroupMember[];
}

interface GroupMember {
  user_id: string;
  role_in_group: 'primary' | 'member';
  joined_at: string;
  profiles: {
    nume: string;
    prenume: string;
    email: string;
    telefon?: string;
    avatar_url?: string;
    is_active: boolean;
  };
}

interface AvailableTourist {
  id: string;
  nume: string;
  prenume: string;
  email: string;
  telefon?: string;
  avatar_url?: string;
  is_active: boolean;
}

interface GroupFormData {
  nume_grup: string;
  is_active: boolean;
}

const GroupManager = () => {
  const [groups, setGroups] = useState<TouristGroup[]>([]);
  const [availableTourists, setAvailableTourists] = useState<AvailableTourist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TouristGroup | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<TouristGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState<GroupFormData>({
    nume_grup: "",
    
    is_active: true
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchGroups();
      fetchAvailableTourists();
    }
  }, [user, profile]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('tourist_groups')
        .select(`
          *,
          members:group_members(
            user_id,
            role_in_group,
            joined_at,
            profiles(
              nume,
              prenume,
              email,
              telefon,
              avatar_url,
              is_active
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Calculate member count
      const groupsWithCount = data?.map(group => ({
        ...group,
        member_count: group.members?.length || 0
      })) || [];
      
      setGroups(groupsWithCount);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca grupurile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTourists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nume, prenume, email, telefon, avatar_url, is_active')
        .eq('role', 'tourist')
        .eq('is_active', true)
        .order('nume');

      if (error) throw error;
      setAvailableTourists(data || []);
    } catch (error) {
      console.error('Error fetching tourists:', error);
    }
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const groupData = {
        ...formData,
        admin_user_id: user!.id,
        invite_code: editingGroup ? editingGroup.invite_code : generateInviteCode()
      };

      if (editingGroup) {
        const { error } = await supabase
          .from('tourist_groups')
          .update(groupData)
          .eq('id', editingGroup.id);

        if (error) throw error;
        
        toast({
          title: "Succes",
          description: "Grupul a fost actualizat cu succes.",
        });
      } else {
        const { error } = await supabase
          .from('tourist_groups')
          .insert([groupData]);

        if (error) throw error;
        
        toast({
          title: "Succes",
          description: "Grupul a fost creat cu succes.",
        });
      }

      setShowDialog(false);
      setEditingGroup(null);
      resetForm();
      fetchGroups();
    } catch (error: any) {
      console.error('Error saving group:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut salva grupul.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (group: TouristGroup) => {
    setEditingGroup(group);
    setFormData({
      nume_grup: group.nume_grup,
      is_active: group.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest grup? Această acțiune va elimina și toți membrii din grup.")) return;

    try {
      const { error } = await supabase
        .from('tourist_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Grupul a fost șters cu succes.",
      });
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge grupul.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateNewInviteCode = async (groupId: string) => {
    try {
      const newCode = generateInviteCode();
      const { error } = await supabase
        .from('tourist_groups')
        .update({ invite_code: newCode })
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Cod de invitație nou generat cu succes.",
      });
      fetchGroups();
    } catch (error) {
      console.error('Error generating new invite code:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut genera codul nou.",
        variant: "destructive",
      });
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copiat",
      description: "Codul de invitație a fost copiat în clipboard.",
    });
  };

  const handleAddMemberToGroup = async (groupId: string, touristId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: touristId,
          role_in_group: 'member'
        }]);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Turistul a fost adăugat în grup cu succes.",
      });
      fetchGroups();
    } catch (error: any) {
      console.error('Error adding member:', error);
      if (error.code === '23505') {
        toast({
          title: "Eroare",
          description: "Turistul este deja membru al acestui grup.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Eroare",
          description: "Nu s-a putut adăuga turistul în grup.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveMemberFromGroup = async (groupId: string, touristId: string) => {
    if (!confirm("Ești sigur că vrei să elimini acest turist din grup?")) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', touristId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Turistul a fost eliminat din grup cu succes.",
      });
      fetchGroups();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut elimina turistul din grup.",
        variant: "destructive",
      });
    }
  };

  const handleViewMembers = (group: TouristGroup) => {
    setSelectedGroup(group);
    setShowMembersDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nume_grup: "",
            is_active: true
    });
  };

  const getInitials = (nume: string, prenume: string) => {
    return `${nume.charAt(0)}${prenume.charAt(0)}`.toUpperCase();
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.nume_grup.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && group.is_active) ||
      (filterStatus === 'inactive' && !group.is_active);

    return matchesSearch && matchesStatus;
  });

  const getUnassignedTourists = (group: TouristGroup) => {
    const groupMemberIds = group.members?.map(m => m.user_id) || [];
    return availableTourists.filter(tourist => !groupMemberIds.includes(tourist.id));
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă grupurile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestionare Grupuri</h2>
          <p className="text-muted-foreground">Organizează turiștii în grupuri pentru circuite</p>
        </div>
        
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingGroup(null); }} className="bg-gradient-hero">
              <Plus className="w-4 h-4 mr-2" />
              Grup Nou
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingGroup ? 'Editează Grupul' : 'Grup Nou'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nume_grup">Nume Grup *</Label>
                <Input
                  id="nume_grup"
                  value={formData.nume_grup}
                  onChange={(e) => setFormData({ ...formData, nume_grup: e.target.value })}
                  placeholder="ex: Circuit Roma Martie 2024"
                  required
                />
              </div>

             

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active">Grup activ</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Anulează
                </Button>
                <Button type="submit" className="bg-gradient-hero">
                  {editingGroup ? 'Actualizează' : 'Creează'}
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
            placeholder="Caută grupuri..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Groups Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-soft transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{group.nume_grup}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Users className="w-3 h-3 mr-1" />
                    {group.member_count} membri
                  </div>
                </div>
                <Badge variant={group.is_active ? "default" : "secondary"}>
                  {group.is_active ? "Activ" : "Inactiv"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Invite Code */}
                <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Cod:</span>
                    <code className="text-sm font-mono font-bold">{group.invite_code}</code>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyInviteCode(group.invite_code)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGenerateNewInviteCode(group.id)}
                      className="h-6 w-6 p-0"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Member Preview */}
                {group.members && group.members.length > 0 && (
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 4).map((member, index) => (
                      <Avatar key={member.user_id} className="w-6 h-6 border-2 border-background">
                        <AvatarImage src={member.profiles.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.profiles.nume, member.profiles.prenume)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {group.members.length > 4 && (
                      <div className="w-6 h-6 bg-muted border-2 border-background rounded-full flex items-center justify-center">
                        <span className="text-xs">+{group.members.length - 4}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Creat: {new Date(group.created_at).toLocaleDateString('ro-RO')}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleViewMembers(group)}
                    className="flex-1"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Vezi Membri
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(group)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(group.id)}
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

      {/* Members Management Dialog */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Membri - {selectedGroup?.nume_grup}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGroup && (
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Membri Actuali ({selectedGroup.member_count})</TabsTrigger>
                <TabsTrigger value="add">Adaugă Membri</TabsTrigger>
              </TabsList>
              
              <TabsContent value="members" className="space-y-4">
                {selectedGroup.members && selectedGroup.members.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedGroup.members.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.profiles.avatar_url} />
                            <AvatarFallback>
                              {getInitials(member.profiles.nume, member.profiles.prenume)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.profiles.nume} {member.profiles.prenume}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {member.profiles.email}
                            </div>
                            {member.profiles.telefon && (
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {member.profiles.telefon}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={member.role_in_group === 'primary' ? 'default' : 'outline'}>
                            {member.role_in_group === 'primary' ? 'Principal' : 'Membru'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMemberFromGroup(selectedGroup.id, member.user_id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <UserMinus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Acest grup nu are membri încă.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="add" className="space-y-4">
                <div className="grid gap-3">
                  {getUnassignedTourists(selectedGroup).map((tourist) => (
                    <div key={tourist.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={tourist.avatar_url} />
                          <AvatarFallback>
                            {getInitials(tourist.nume, tourist.prenume)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{tourist.nume} {tourist.prenume}</div>
                          <div className="text-sm text-muted-foreground">{tourist.email}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddMemberToGroup(selectedGroup.id, tourist.id)}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Adaugă
                      </Button>
                    </div>
                  ))}
                  {getUnassignedTourists(selectedGroup).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Toți turiștii disponibili sunt deja membri ai acestui grup.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Niciun grup găsit</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Încearcă să modifici filtrele de căutare.'
              : 'Începe prin a crea primul grup pentru circuite.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default GroupManager;