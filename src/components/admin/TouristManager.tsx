import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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

// Helper function to generate temporary password
const generateTemporaryPassword = (length = 8): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const TouristManager = () => {
  const [tourists, setTourists] = useState<Tourist[]>([]);
  const [groups, setGroups] = useState<TouristGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTourist, setEditingTourist] = useState<Tourist | null>(null);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [selectedTouristForPromotion, setSelectedTouristForPromotion] = useState<Tourist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [formData, setFormData] = useState<TouristFormData>({
    email: "",
    nume: "",
    prenume: "",
    telefon: "",
    password: "",
    avatar_url: "",
    group_ids: []
  });
  const [showPassword, setShowPassword] = useState(false);

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

        // Update email and/or password using Edge Function
        const authUpdates: { email?: string; password?: string } = {};
        
        if (formData.email !== editingTourist.email) {
          authUpdates.email = formData.email;
        }
        
        if (formData.password && formData.password.trim().length >= 6) {
          authUpdates.password = formData.password;
        }
        
        if (Object.keys(authUpdates).length > 0) {
          const { error: authError } = await supabase.functions.invoke('admin-update-user', {
            body: {
              userId: editingTourist.id,
              ...authUpdates
            }
          });

          if (authError) throw authError;
        }

        // Update group memberships
        await updateGroupMemberships(editingTourist.id);

        toast({
          title: "Succes",
          description: "Turistul a fost actualizat cu succes.",
        });
      } else {
        // Generează parolă temporară
        const tempPassword = generateTemporaryPassword();
        
        // Salvează session-ul admin
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // Create new tourist cu intended_role
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/reset-password`,
            data: {
              nume: formData.nume,
              prenume: formData.prenume,
              telefon: formData.telefon,
              intended_role: 'tourist' // ✅ Trigger-ul va folosi asta!
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Așteaptă ca trigger să creeze profilul
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Update profile cu avatar
          if (formData.avatar_url) {
            await supabase
              .from('profiles')
              .update({ avatar_url: formData.avatar_url })
              .eq('id', authData.user.id);
          }

          // Add group memberships
          await updateGroupMemberships(authData.user.id);

          // Trimite email de reset password
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            formData.email,
            {
              redirectTo: `${window.location.origin}/reset-password`
            }
          );

          if (resetError) {
            console.error('Error sending reset email:', resetError);
          }

          // CRITICAL: Restore admin session
          if (currentSession) {
            await supabase.auth.setSession({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token
            });
          }
        }

        toast({
          title: "Tourist creat cu succes!",
          description: `${formData.nume} ${formData.prenume} a primit email pentru setarea parolei.`,
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

  const handlePromoteToAdmin = async (tourist: Tourist) => {
    setSelectedTouristForPromotion(tourist);
    setShowPromoteDialog(true);
  };

  const confirmPromoteToAdmin = async () => {
    if (!selectedTouristForPromotion) return;

    try {
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', selectedTouristForPromotion.id)
        .eq('role', 'admin')
        .single();

      if (existingRoles) {
        toast({ title: "User-ul este deja administrator" });
        setShowPromoteDialog(false);
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedTouristForPromotion.id,
          role: 'admin',
          assigned_by: user?.id
        });

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', selectedTouristForPromotion.id);

      toast({
        title: "Promovare reușită!",
        description: `${selectedTouristForPromotion.nume} ${selectedTouristForPromotion.prenume} este acum administrator.`,
      });

      setShowPromoteDialog(false);
      fetchTourists();
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message,
        variant: "destructive",
      });
    }
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
    setShowPassword(false);
  };

  const filteredTourists = tourists.filter(tourist => {
    const matchesSearch = 
      (tourist.nume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tourist.prenume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tourist.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email">Email *</Label>
                      {editingTourist && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                        >
                          Editabil
                        </Button>
                      )}
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">
                      Parolă {editingTourist ? "(opțional - lasă gol pentru a nu schimba)" : "*"}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder={editingTourist ? "Lasă gol pentru a păstra parola actuală" : "Minim 6 caractere"}
                        required={!editingTourist}
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

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
        
        <div className="flex gap-2 items-center">
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

          <div className="flex border rounded-lg p-1 bg-muted">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('cards')}
              className={cn(
                "h-8 px-3",
                viewMode === 'cards' && "bg-background shadow-sm"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-8 px-3",
                viewMode === 'list' && "bg-background shadow-sm"
              )}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tourists View */}
      {viewMode === 'cards' ? (
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

                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromoteToAdmin(tourist)}
                        className="text-warning border-warning hover:bg-warning hover:text-warning-foreground"
                      >
                        <Shield className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Turist</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Grupuri</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTourists.map((tourist) => (
                <TableRow key={tourist.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={tourist.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {getInitials(tourist.nume, tourist.prenume)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {tourist.nume} {tourist.prenume}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(tourist.created_at).toLocaleDateString('ro-RO')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 mr-1 text-muted-foreground" />
                        {tourist.email}
                      </div>
                      {tourist.telefon && (
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
                          {tourist.telefon}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tourist.group_memberships && tourist.group_memberships.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tourist.group_memberships.map((gm, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {gm.tourist_groups.nume_grup}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tourist.is_active ? "default" : "secondary"}>
                      {tourist.is_active ? "Activ" : "Inactiv"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEdit(tourist)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(tourist.id, tourist.is_active)}
                      >
                        {tourist.is_active ? <UserMinus className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDelete(tourist.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePromoteToAdmin(tourist)}
                        className="text-warning hover:text-warning"
                      >
                        <Shield className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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

      {/* Promote to Admin Confirmation Dialog */}
      <AlertDialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promovează la Administrator?</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să dai drepturi de administrator pentru{" "}
              <span className="font-semibold">
                {selectedTouristForPromotion?.nume} {selectedTouristForPromotion?.prenume}
              </span>
              ? Acest user va avea acces complet la sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPromoteToAdmin}>
              Da, promovează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TouristManager;