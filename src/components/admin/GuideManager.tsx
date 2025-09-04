import React, { useState, useEffect } from "react";
import { UserCheck, Plus, Search, Filter, MapPin, Calendar, Users, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { StatsCard } from "@/components/shared/StatsCard";

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
  const [selectedGuide, setSelectedGuide] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch guides
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

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('guide_assignments')
        .select(`
          *,
          trips (
            id,
            nume,
            destinatie,
            start_date,
            end_date,
            status
          ),
          guides:profiles!guide_assignments_guide_user_id_fkey (
            id,
            nume,
            prenume,
            email
          )
        `)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // Fetch recent reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('daily_reports')
        .select(`
          *,
          trips (
            id,
            nume,
            destinatie
          ),
          guides:profiles!daily_reports_guide_user_id_fkey (
            id,
            nume,
            prenume,
            email
          )
        `)
        .order('report_date', { ascending: false })
        .limit(50);

      if (reportsError) throw reportsError;
      setReports(reportsData || []);
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
    } catch (error) {
      console.error('Error assigning guide:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut atribui ghidul.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAssignment = async (assignmentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('guide_assignments')
        .update({ is_active: !isActive })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Succes",
        description: `Atribuirea a fost ${!isActive ? 'activată' : 'dezactivată'}.`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling assignment:', error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut modifica atribuirea.",
        variant: "destructive",
      });
    }
  };

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.prenume.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guide.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || 
                         (filterStatus === "active" && guide.is_active) ||
                         (filterStatus === "inactive" && !guide.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const filteredAssignments = assignments.filter(assignment => {
    const guide = assignment.guides;
    const trip = assignment.trips;
    return guide && trip && (
      guide.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.prenume.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.nume.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destinatie.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getActiveAssignmentsCount = () => {
    return assignments.filter(a => a.is_active).length;
  };

  const getActiveGuidesCount = () => {
    return guides.filter(g => g.is_active).length;
  };

  const getRecentReportsCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return reports.filter(r => r.report_date === today).length;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ro-RO');
  };

  const getTripStatus = (trip: Trip) => {
    const today = new Date();
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);

    if (today < startDate) return { label: "Viitor", variant: "secondary" as const };
    if (today >= startDate && today <= endDate) return { label: "Activ", variant: "default" as const };
    return { label: "Completat", variant: "outline" as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Gestionare Ghizi</h1>
          <p className="text-muted-foreground">
            Gestionează ghizii și atribuirile lor la circuite
          </p>
        </div>
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Atribuie Ghid
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuie Ghid la Circuit</DialogTitle>
              <DialogDescription>
                Selectează ghidul și circuitul pentru atribuire.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="guide">Ghid</Label>
                <Select value={selectedGuide} onValueChange={setSelectedGuide}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează ghidul" />
                  </SelectTrigger>
                  <SelectContent>
                    {guides.filter(g => g.is_active).map(guide => (
                      <SelectItem key={guide.id} value={guide.id}>
                        {guide.nume} {guide.prenume} - {guide.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trip">Circuit</Label>
                <Select value={selectedTrip} onValueChange={setSelectedTrip}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează circuitul" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map(trip => {
                      const status = getTripStatus(trip);
                      return (
                        <SelectItem key={trip.id} value={trip.id}>
                          <div className="flex items-center gap-2">
                            <span>{trip.nume} - {trip.destinatie}</span>
                            <Badge variant={status.variant} className="text-xs">
                              {status.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAssignGuide} className="flex-1">
                  Atribuie
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAssignDialogOpen(false)}
                >
                  Anulează
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Ghizi Activi"
          value={getActiveGuidesCount()}
          description="Ghizi disponibili"
          icon={<UserCheck className="h-4 w-4" />}
        />
        <StatsCard
          title="Atribuiri Active"
          value={getActiveAssignmentsCount()}
          description="Ghizi atribuiți"
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatsCard
          title="Rapoarte Astăzi"
          value={getRecentReportsCount()}
          description="Rapoarte primite"
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Total Circuite"
          value={trips.length}
          description="În sistem"
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută ghizi, circuite..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toți ghizii</SelectItem>
            <SelectItem value="active">Ghizi activi</SelectItem>
            <SelectItem value="inactive">Ghizi inactivi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="guides" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guides">Ghizi ({filteredGuides.length})</TabsTrigger>
          <TabsTrigger value="assignments">Atribuiri ({filteredAssignments.length})</TabsTrigger>
          <TabsTrigger value="reports">Rapoarte ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGuides.map((guide) => {
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
    </div>
  );
};

export default GuideManager;