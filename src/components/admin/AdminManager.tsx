import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import {
  Shield,
  Search,
  Mail,
  Phone,
  Calendar,
  Plus,
  UserMinus,
  Eye,
  EyeOff,
  Crown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { SuperAdminBadge } from "@/components/badges/SuperAdminBadge";

interface Admin {
  id: string;
  email: string;
  nume: string;
  prenume: string;
  telefon?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  role: string;
  show_superadmin_badge?: boolean;
}

interface AdminFormData {
  email: string;
  nume: string;
  prenume: string;
  telefon: string;
  password: string;
}

const AdminManager = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedAdminForDowngrade, setSelectedAdminForDowngrade] = useState<Admin | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<AdminFormData>({
    email: "",
    nume: "",
    prenume: "",
    telefon: "",
    password: ""
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();

  const isSuperAdmin = profile?.role === 'superadmin';

  useEffect(() => {
    if (user && (profile?.role === 'admin' || profile?.role === 'superadmin')) {
      fetchAdmins();
    }
  }, [user, profile]);

  const fetchAdmins = async () => {
    try {
      // Citește DIRECT din profiles.role (sursa de adevăr pentru tine)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'superadmin'])
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setAdmins(profiles || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca administratorii.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: createData, error: createError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          nume: formData.nume,
          prenume: formData.prenume,
          telefon: formData.telefon,
          intended_role: 'admin',
          password: formData.password,
        }
      });

      if (createError) throw createError;
      if (!createData?.userId) throw new Error('Nu s-a putut crea administratorul.');

      toast({
        title: "✅ Administrator creat",
        description: `${formData.nume} ${formData.prenume} poate să se logheze acum.`,
      });

      setShowCreateDialog(false);
      setFormData({ email: "", nume: "", prenume: "", telefon: "", password: "" });
      fetchAdmins();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea administratorul.",
        variant: "destructive",
      });
    }
  };

  const handleDowngrade = (admin: Admin) => {
    setSelectedAdminForDowngrade(admin);
    setShowDowngradeDialog(true);
  };

  const confirmDowngrade = async () => {
    if (!selectedAdminForDowngrade) return;

    try {
      const { error } = await supabase.rpc('downgrade_admin_to_tourist', {
        admin_user_id: selectedAdminForDowngrade.id
      });

      if (error) throw error;

      // Also update user_roles
      await supabase
        .from('user_roles')
        .update({ role: 'tourist' })
        .eq('user_id', selectedAdminForDowngrade.id)
        .eq('role', 'admin');

      toast({
        title: "Admin retrogradat",
        description: `${selectedAdminForDowngrade.nume} ${selectedAdminForDowngrade.prenume} este acum turist.`,
      });

      setShowDowngradeDialog(false);
      setSelectedAdminForDowngrade(null);
      fetchAdmins();
    } catch (error: any) {
      console.error('Error downgrading admin:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut retrograda administratorul.",
        variant: "destructive",
      });
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch =
      (admin.nume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.prenume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getInitials = (nume: string, prenume: string) => {
    return `${nume.charAt(0)}${prenume.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return <div className="text-center py-8">Se încarcă administratorii...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Administratori</h2>
          <p className="text-muted-foreground">Lista utilizatorilor cu rol de administrator</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Admin Nou
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Caută după nume sau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="w-4 h-4" />
        <span>{filteredAdmins.length} administratori</span>
      </div>

      {/* Admin Cards Grid */}
      {filteredAdmins.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nu există administratori.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAdmins.map((admin) => (
            <Card key={admin.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarImage src={admin.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getInitials(admin.nume, admin.prenume)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold truncate">
                        {admin.nume} {admin.prenume}
                      </h3>
                      {user?.id === admin.id && (
                        <Badge variant="outline" className="text-xs shrink-0">Tu</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {admin.role === 'superadmin' ? (
                        <SuperAdminBadge size="sm" showText />
                      ) : (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <Shield className="w-3 h-3 mr-1" />
                          Administrator
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{admin.email}</span>
                      </div>

                      {admin.telefon && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{admin.telefon}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Membru din {format(new Date(admin.created_at), 'MMM yyyy', { locale: ro })}
                        </span>
                      </div>
                    </div>

                    {/* Downgrade button (only for superadmins, not on self or other superadmins) */}
                    {isSuperAdmin && admin.role === 'admin' && admin.id !== user?.id && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDowngrade(admin)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserMinus className="w-3 h-3 mr-1" />
                          Retrogradează la turist
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Admin Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Creează Administrator Nou</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-nume">Nume *</Label>
                <Input
                  id="admin-nume"
                  value={formData.nume}
                  onChange={(e) => setFormData({ ...formData, nume: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-prenume">Prenume *</Label>
                <Input
                  id="admin-prenume"
                  value={formData.prenume}
                  onChange={(e) => setFormData({ ...formData, prenume: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-telefon">Telefon</Label>
              <Input
                id="admin-telefon"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Parolă *</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Anulează
              </Button>
              <Button type="submit">Creează Admin</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Downgrade Confirmation Dialog */}
      <AlertDialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retrogradare Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să retrogradezi pe{" "}
              <strong>{selectedAdminForDowngrade?.nume} {selectedAdminForDowngrade?.prenume}</strong>{" "}
              la rol de turist? Această acțiune va elimina toate privilegiile de administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDowngrade} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Da, retrogradează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminManager;
