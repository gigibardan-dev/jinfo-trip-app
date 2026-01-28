import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Search, 
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface Admin {
  id: string;
  email: string;
  nume: string;
  prenume: string;
  telefon?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

const AdminManager = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile?.role === 'admin') {
      fetchAdmins();
    }
  }, [user, profile]);

  const fetchAdmins = async () => {
    try {
      // Get all users with admin role from user_roles table
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (!adminRoles || adminRoles.length === 0) {
        setAdmins([]);
        setLoading(false);
        return;
      }

      const adminIds = adminRoles.map(r => r.user_id);

      // Get profiles for these admin users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', adminIds)
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">
                        {admin.nume} {admin.prenume}
                      </h3>
                      {user?.id === admin.id && (
                        <Badge variant="outline" className="text-xs shrink-0">Tu</Badge>
                      )}
                    </div>
                    
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-3">
                      <Shield className="w-3 h-3 mr-1" />
                      Administrator
                    </Badge>
                    
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminManager;