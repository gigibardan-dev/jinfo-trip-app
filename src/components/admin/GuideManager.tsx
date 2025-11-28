import React, { useState, useEffect } from "react";
import { UserCheck, Plus, Search, Filter, MapPin, Calendar, Users, FileText, Edit, Trash2, Power, Phone, Mail, Shield, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/shared/StatsCard";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";

interface Guide {
  id: string;
  nume: string;
  prenume: string;
  email: string;
  telefon?: string;
  is_active: boolean;
  created_at: string;
}

interface Trip {
  id: string;
  nume: string;
  destinatie: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Assignment {
  id: string;
  guide_user_id: string;
  trip_id: string;
  assigned_at: string;
  is_active: boolean;
  trips: Trip;
  guides: Guide;
}

interface DailyReport {
  id: string;
  trip_id: string;
  guide_user_id: string;
  report_date: string;
  activities_completed: string[];
  issues_encountered?: string;
  participant_count?: number;
  trips: Trip;
  guides: Guide;
}

interface GuideFormData {
  email: string;
  nume: string;
  prenume: string;
  telefon: string;
  password: string;
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

const GuideManager = () => {
  const { user } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");
  const [selectedGuideForAction, setSelectedGuideForAction] = useState<Guide | null>(null);
  const [formData, setFormData] = useState<GuideFormData>({
    email: "",
    nume: "",
    prenume: "",
    telefon: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch guides - din profiles cu role='guide'
      const { data: guidesData, error: guidesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'guide')
        .order('nume');

      if (guidesError) throw guidesError;
      setGuides(guidesData || []);

      // Fetch trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: false });

      if (tripsError) throw tripsError;
      setTrips(tripsData || []);

      // Fetch assignments with related data
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('guide_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      if (assignmentsData && assignmentsData.length > 0) {
        const tripIds = [...new Set(assignmentsData.map(a => a.trip_id))];
        const guideIds = [...new Set(assignmentsData.map(a => a.guide_user_id))];

        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('id, nume, destinatie, start_date, end_date, status')
          .in('id', tripIds);

        if (tripsError) throw tripsError;

        const { data: guidesData, error: guidesError } = await supabase
          .from('profiles')
          .select('id, nume, prenume, email, is_active, created_at, telefon')
          .in('id', guideIds);

        if (guidesError) throw guidesError;

        const assignmentsWithData = assignmentsData.map(assignment => ({
          ...assignment,
          trips: tripsData?.find(trip => trip.id === assignment.trip_id) || null,
          guides: guidesData?.find(guide => guide.id === assignment.guide_user_id) || null
        }));

        setAssignments(assignmentsWithData);
      } else {
        setAssignments([]);
      }

      // Fetch recent reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(50);

      if (reportsError) throw reportsError;

      if (reportsData && reportsData.length > 0) {
        const tripIds = [...new Set(reportsData.map(r => r.trip_id))];
        const guideIds = [...new Set(reportsData.map(r => r.guide_user_id))];

        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('id, nume, destinatie, start_date, end_date, status')
          .in('id', tripIds);

        if (tripsError) throw tripsError;

        const { data: guidesData, error: guidesError } = await supabase
          .from('profiles')
          .select('id, nume, prenume, email, is_active, created_at, telefon')
          .in('id', guideIds);

        if (guidesError) throw guidesError;

        const reportsWithData = reportsData.map(report => ({
          ...report,
          trips: tripsData?.find(trip => trip.id === report.trip_id) || null,
          guides: guidesData?.find(guide => guide.id === report.guide_user_id) || null
        }));

        setReports(reportsWithData);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca datele.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuide = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Generează parolă temporară
      const tempPassword = generateTemporaryPassword();
      
      // 1. Salvează session-ul curent (admin-ul)
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // 2. Creează user în Supabase Auth cu intended_role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/reset-password`,
          data: {
            nume: formData.nume,
            prenume: formData.prenume,
            telefon: formData.telefon,
            intended_role: 'guide' // ✅ Trigger-ul va folosi asta!
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 3. Așteaptă ca trigger-ul să creeze profilul
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 4. Restore session-ul admin-ului (CRITICAL!)
        // 5. Trimite email de reset password
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          formData.email,
          {
            redirectTo: `${window.location.origin}/reset-password`
          }
        );

        if (resetError) {
          console.error('Error sending reset email:', resetError);
        }

        // 6. Restore session-ul admin-ului
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token
          });
        }

        toast({
          title: "Ghid creat cu succes!",
          description: `${formData.nume} ${formData.prenume} a primit email pentru setarea parolei.`,
        });

        setIsCreateDialogOpen(false);
        resetForm();
        fetchData();
      }
    } catch (error: any) {
      console.error('Error creating guide:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut crea ghidul.",
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
      password: ""
    });
    setShowPassword(false);
  };

  const handleEdit = (guide: Guide) => {
    setSelectedGuideForAction(guide);
    setFormData({
      email: guide.email,
      nume: guide.nume,
      prenume: guide.prenume,
      telefon: guide.telefon || "",
      password: ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGuideForAction || !formData.nume || !formData.prenume) {
      toast({
        title: "Eroare",
        description: "Completează toate câmpurile obligatorii",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nume: formData.nume,
          prenume: formData.prenume,
          telefon: formData.telefon || null,
        })
        .eq("id", selectedGuideForAction.id);

      if (error) throw error;

      // Update email and/or password using Edge Function
      const authUpdates: { email?: string; password?: string } = {};
      
      if (formData.email !== selectedGuideForAction.email) {
        authUpdates.email = formData.email;
      }
      
      if (formData.password && formData.password.trim().length >= 6) {
        authUpdates.password = formData.password;
      }
      
      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.functions.invoke('admin-update-user', {
          body: {
            userId: selectedGuideForAction.id,
            ...authUpdates
          }
        });

        if (authError) throw authError;
      }

      toast({
        title: "Succes",
        description: "Ghid actualizat cu succes",
      });

      setIsEditDialogOpen(false);
      setSelectedGuideForAction(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error updating guide:", error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut actualiza ghidul",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (guideId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', guideId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: `Ghidul a fost ${!currentStatus ? 'activat' : 'dezactivat'}.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling guide status:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza statusul ghidului.",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (guide: Guide) => {
    setSelectedGuideForAction(guide);
    setIsDeleteDialogOpen(true);
  };

  const openPromoteDialog = (guide: Guide) => {
    setSelectedGuideForAction(guide);
    setIsPromoteDialogOpen(true);
  };

  const handlePromoteToAdmin = async () => {
    if (!selectedGuideForAction) return;

    try {
      // Check if user already has admin role
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', selectedGuideForAction.id)
        .eq('role', 'admin')
        .single();

      if (existingRoles) {
        toast({
          title: "User-ul este deja administrator",
          variant: "default"
        });
        setIsPromoteDialogOpen(false);
        return;
      }

      // Insert admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedGuideForAction.id,
          role: 'admin',
          assigned_by: user?.id
        });

      if (error) throw error;

      // Update profiles table (backwards compat)
      await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', selectedGuideForAction.id);

      toast({
        title: "Promovare reușită!",
        description: `${selectedGuideForAction.nume} ${selectedGuideForAction.prenume} este acum administrator.`,
      });

      setIsPromoteDialogOpen(false);
      fetchData();

    } catch (error: any) {
      toast({
        title: "Eroare la promovare",
        description: error.message || "Nu s-a putut promova user-ul.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedGuideForAction) return;

    try {
      // Check if guide has active assignments
      const guideAssignments = assignments.filter(
        a => a.guide_user_id === selectedGuideForAction.id && a.is_active
      );

      if (guideAssignments.length > 0) {
        toast({
          title: "Eroare",
          description: `Ghidul are ${guideAssignments.length} călătorii asignate. Dezasignează călătoriile înainte de ștergere.`,
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        return;
      }

      // 1. Șterge din user_roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedGuideForAction.id)
        .eq('role', 'guide');

      // 2. Șterge din profiles (soft delete)
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', selectedGuideForAction.id);

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Ghidul a fost șters cu succes.",
      });

      setIsDeleteDialogOpen(false);
      setSelectedGuideForAction(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting guide:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge ghidul. Verifică dacă are atribuiri active.",
        variant: "destructive",
      });
    }
  };

  const handleAssignGuide = async () => {
    if (!selectedGuide || !selectedTrip) {
      toast({
        title: "Eroare",
        description: "Selectează ghidul și circuitul.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('guide_assignments')
        .insert({
          guide_user_id: selectedGuide,
          trip_id: selectedTrip,
          assigned_by_admin_id: user?.id,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Succes",
        description: "Ghidul a fost atribuit cu succes.",
      });

      setIsAssignDialogOpen(false);
      setSelectedGuide("");
      setSelectedTrip("");
      fetchData();
    } catch (error: any) {
      console.error('Error assigning guide:', error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut atribui ghidul.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAssignment = async (assignmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('guide_assignments')
        .update({ is_active: !currentStatus })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: `Atribuirea a fost ${!currentStatus ? 'activată' : 'dezactivată'}.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling assignment:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza atribuirea.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  const getTripStatus = (trip: Trip) => {
    const now = new Date();
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);

    if (trip.status === 'cancelled') {
      return { label: 'Anulat', variant: 'destructive' as const };
    }
    if (trip.status === 'completed') {
      return { label: 'Finalizat', variant: 'secondary' as const };
    }
    if (now < startDate) {
      return { label: 'Viitor', variant: 'outline' as const };
    }
    if (now > endDate) {
      return { label: 'Trecut', variant: 'secondary' as const };
    }
    return { label: 'În desfășurare', variant: 'default' as const };
  };

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = 
      (guide.nume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guide.prenume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guide.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && guide.is_active) ||
      (filterStatus === 'inactive' && !guide.is_active);

    return matchesSearch && matchesStatus;
  });

  const filteredAssignments = assignments.filter(assignment => {
    if (!assignment.guides || !assignment.trips) return false;

    const matchesSearch = 
      (assignment.guides.nume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.guides.prenume || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.trips.nume || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && assignment.is_active) ||
      (filterStatus === 'inactive' && !assignment.is_active);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <ListSkeleton count={6} showAvatar={true} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestionează Ghizi</h1>
          <p className="text-muted-foreground mt-1">
            Gestionează ghizii și atribuirile lor la circuite
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Creează Ghid Nou
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Creează Ghid Nou</DialogTitle>
                <DialogDescription>
                  Completează informațiile pentru a crea un cont de ghid
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGuide} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

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
                  <Label htmlFor="telefon">Telefon</Label>
                  <Input
                    id="telefon"
                    type="tel"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    placeholder="+40 722 123 456"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Parolă *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Minim 6 caractere"
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
                  <p className="text-xs text-muted-foreground">
                    Minim 6 caractere
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Anulează
                  </Button>
                  <Button type="submit">
                    Creează Ghid
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <UserCheck className="h-4 w-4" />
                Atribuie Ghid
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atribuie Ghid la Circuit</DialogTitle>
                <DialogDescription>
                  Selectează ghidul și circuitul pentru atribuire
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Ghid</Label>
                  <Select value={selectedGuide} onValueChange={setSelectedGuide}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează ghid" />
                    </SelectTrigger>
                    <SelectContent>
                      {guides.map(guide => (
                        <SelectItem key={guide.id} value={guide.id}>
                          {guide.nume} {guide.prenume}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Circuit</Label>
                  <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectează circuit" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map(trip => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.nume} - {trip.destinatie}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Anulează
                </Button>
                <Button onClick={handleAssignGuide}>
                  Atribuie
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Ghizi Activi"
          value={guides.filter(g => g.is_active).length}
          description="Ghizi disponibili"
          icon={<UserCheck className="h-4 w-4" />}
        />
        <StatsCard
          title="Atribuiri Active"
          value={assignments.filter(a => a.is_active).length}
          description="Ghizi atribuiți"
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatsCard
          title="Rapoarte Totale"
          value={reports.length}
          description="Rapoarte primite"
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută ghizi, circuite..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="guides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="guides">
            Ghizi ({filteredGuides.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Atribuiri ({filteredAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="reports">
            Rapoarte ({reports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGuides.map(guide => {
              const guideAssignments = assignments.filter(a => a.guide_user_id === guide.id && a.is_active);
              const guideReports = reports.filter(r => r.guide_user_id === guide.id);
              
              return (
                <Card key={guide.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {guide.nume} {guide.prenume}
                        </CardTitle>
                        <CardDescription>{guide.email}</CardDescription>
                      </div>
                      <Badge variant={guide.is_active ? "default" : "secondary"}>
                        {guide.is_active ? "Activ" : "Inactiv"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Atribuiri active:</span>
                        <span className="font-medium">{guideAssignments.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rapoarte totale:</span>
                        <span className="font-medium">{guideReports.length}</span>
                      </div>
                      {guide.telefon && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Telefon:</span>
                          <span className="font-medium">{guide.telefon}</span>
                        </div>
                      )}
                    </div>

                    {/* Butoane acțiuni */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(guide)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editează
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(guide.id, guide.is_active)}
                          className={guide.is_active ? "" : "border-green-500 text-green-600"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(guide)}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPromoteDialog(guide)}
                        className="text-warning border-warning hover:bg-warning hover:text-warning-foreground"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atribuiri Ghizi</CardTitle>
              <CardDescription>
                Gestionează atribuirile ghizilor la circuite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ghid</TableHead>
                    <TableHead>Circuit</TableHead>
                    <TableHead>Destinație</TableHead>
                    <TableHead>Perioada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const guide = assignment.guides;
                    const trip = assignment.trips;
                    const tripStatus = getTripStatus(trip);
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {guide.nume} {guide.prenume}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {guide.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{trip.nume}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {trip.destinatie}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(trip.start_date)}</div>
                            <div className="text-muted-foreground">
                              {formatDate(trip.end_date)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={tripStatus.variant}>
                              {tripStatus.label}
                            </Badge>
                            {assignment.is_active && (
                              <Badge variant="outline">Activ</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={assignment.is_active ? "destructive" : "default"}
                            onClick={() => handleToggleAssignment(assignment.id, assignment.is_active)}
                          >
                            {assignment.is_active ? "Dezactivează" : "Activează"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapoarte Zilnice</CardTitle>
              <CardDescription>
                Rapoartele primite de la ghizi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ghid</TableHead>
                    <TableHead>Circuit</TableHead>
                    <TableHead>Participanți</TableHead>
                    <TableHead>Activități</TableHead>
                    <TableHead>Probleme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const guide = report.guides;
                    const trip = report.trips;
                    
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="font-medium">
                            {formatDate(report.report_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {guide.nume} {guide.prenume}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {guide.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{trip.nume}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {trip.destinatie}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {report.participant_count || "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {report.activities_completed?.length || 0} completate
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.issues_encountered ? (
                            <Badge variant="destructive">Probleme</Badge>
                          ) : (
                            <Badge variant="outline">Fără probleme</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditGuide}>
            <DialogHeader>
              <DialogTitle>Editează Ghid</DialogTitle>
              <DialogDescription>
                Modifică informațiile ghidului
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-email">Email *</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                  >
                    Editabil
                  </Button>
                </div>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-nume">Nume *</Label>
                  <Input
                    id="edit-nume"
                    value={formData.nume}
                    onChange={(e) =>
                      setFormData({ ...formData, nume: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-prenume">Prenume *</Label>
                  <Input
                    id="edit-prenume"
                    value={formData.prenume}
                    onChange={(e) =>
                      setFormData({ ...formData, prenume: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-telefon">Telefon</Label>
                <Input
                  id="edit-telefon"
                  type="tel"
                  value={formData.telefon}
                  onChange={(e) =>
                    setFormData({ ...formData, telefon: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">
                  Parolă (opțional - lasă gol pentru a nu schimba)
                </Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Lasă gol pentru a păstra parola actuală"
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
                <p className="text-xs text-muted-foreground">
                  Minim 6 caractere dacă vrei să schimbi parola
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedGuideForAction(null);
                  resetForm();
                }}
              >
                Anulează
              </Button>
              <Button type="submit">Salvează</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ești sigur?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune va șterge ghidul{" "}
              <span className="font-semibold">
                {selectedGuideForAction?.nume} {selectedGuideForAction?.prenume}
              </span>
              . Ghidul nu va mai putea accesa sistemul.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge Ghid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote to Admin Confirmation Dialog */}
      <AlertDialog open={isPromoteDialogOpen} onOpenChange={setIsPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promovează la Administrator?</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să dai drepturi de administrator pentru{" "}
              <span className="font-semibold">
                {selectedGuideForAction?.nume} {selectedGuideForAction?.prenume}
              </span>
              ? Acest user va avea acces complet la sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteToAdmin}>
              Da, promovează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GuideManager;