import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GroupManager from "./admin/GroupManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Users,
  Plane,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  Plus,
  ArrowLeft,
  UserCheck
} from "lucide-react";

// Import componentele pentru navigare
import EnhancedTripManager from "./admin/EnhancedTripManager";
import TouristManager from "./admin/TouristManager";
import DocumentUploader from "./admin/DocumentUploader";

type ActiveView = 'dashboard' | 'trips' | 'tourists' | 'documents' | 'groups';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [stats, setStats] = useState({
    activeTrips: 0,
    tourists: 0,
    documents: 0,
    guides: 0
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [expiringDocuments, setExpiringDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch active trips count
      const { data: activeTripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id', { count: 'exact' })
        .in('status', ['active', 'confirmed']);
      
      if (tripsError) throw tripsError;

      // Fetch tourists count
      const { data: touristsData, error: touristsError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'tourist')
        .eq('is_active', true);
      
      if (touristsError) throw touristsError;

      // Fetch documents count
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id', { count: 'exact' });
      
      if (documentsError) throw documentsError;

      // Fetch guides count
      const { data: guidesData, error: guidesError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'guide')
        .eq('is_active', true);
      
      if (guidesError) throw guidesError;

      setStats({
        activeTrips: activeTripsData?.length || 0,
        tourists: touristsData?.length || 0,
        documents: documentsData?.length || 0,
        guides: guidesData?.length || 0
      });

      // Fetch recent trips with group info
      const { data: tripsData, error: recentTripsError } = await supabase
        .from('trips')
        .select(`
          *,
          tourist_groups (
            nume_grup
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentTripsError) throw recentTripsError;
      setRecentTrips(tripsData || []);

      // Fetch expiring documents (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data: expiringDocs, error: expiringError } = await supabase
        .from('documents')
        .select('id, nume, expiry_date, trip_id')
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })
        .limit(5);
      
      if (expiringError) throw expiringError;
      setExpiringDocuments(expiringDocs || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca datele dashboard-ului.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleNewTrip = () => {
    setActiveView('trips');
  };

  const handleAddTourists = () => {
    setActiveView('tourists');
  };

  const handleUploadDocuments = () => {
    setActiveView('documents');
  };
  const handleManageGroups = () => {
    setActiveView('groups');
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
  };

  // Render views based on active selection
  const renderActiveView = () => {
    switch (activeView) {
      case 'trips':
        return (
          <div>
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la Dashboard
            </Button>
            <EnhancedTripManager />
          </div>
        );
      case 'tourists':
        return (
          <div>
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la Dashboard
            </Button>
            <TouristManager />
          </div>
        );
      case 'documents':
        return (
          <div>
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la Dashboard
            </Button>
            <DocumentUploader />
          </div>
        );
      case 'groups':
        return (
          <div>
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Înapoi la Dashboard
            </Button>
            <GroupManager />
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-success text-success-foreground";
      case "confirmed": return "bg-primary text-primary-foreground";
      case "draft": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "În Desfășurare";
      case "confirmed": return "Confirmată";
      case "draft": return "Schiță";
      default: return status;
    }
  };

  const renderDashboard = () => {
    if (loading) {
      return <div className="text-center py-8">Se încarcă datele...</div>;
    }

    const statsCards = [
      {
        title: "Călătorii Active",
        value: stats.activeTrips.toString(),
        change: "Active sau confirmate",
        icon: Plane,
        color: "text-primary"
      },
      {
        title: "Turiști Înregistrați",
        value: stats.tourists.toString(),
        change: "Activi în sistem",
        icon: Users,
        color: "text-success"
      },
      {
        title: "Documente Uploadate",
        value: stats.documents.toString(),
        change: "Total documente",
        icon: FileText,
        color: "text-accent"
      },
      {
        title: "Ghizi Activi",
        value: stats.guides.toString(),
        change: "Disponibili",
        icon: UserCheck,
        color: "text-warning"
      }
    ];

    return (
    <div className="space-y-6">
      {/* Quick Actions - WITH NAVIGATION */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          className="bg-gradient-hero text-primary-foreground hover:opacity-90"
          onClick={handleNewTrip}
        >
          <Plus className="w-4 h-4 mr-2" />
          Circuit Nou
        </Button>

        <Button
          variant="outline"
          onClick={handleAddTourists}
        >
          <Users className="w-4 h-4 mr-2" />
          Adaugă Turiști
        </Button>

        <Button
          variant="outline"
          onClick={handleUploadDocuments}
        >
          <FileText className="w-4 h-4 mr-2" />
          Upload Documente
        </Button>

        <Button
          variant="outline"
          onClick={handleManageGroups}
        >
          <Users className="w-4 h-4 mr-2" />
          Gestionare Grupuri
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="shadow-soft border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trips */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary" />
                Călătorii Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Plane className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nu există călătorii încă</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="border rounded-lg p-4 hover:shadow-medium transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{trip.nume}</h3>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            {trip.destinatie}, {trip.tara}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(trip.start_date).toLocaleDateString('ro-RO')} - 
                            {new Date(trip.end_date).toLocaleDateString('ro-RO')}
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end gap-2">
                          <Badge className={getStatusColor(trip.status)}>
                            {getStatusText(trip.status)}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {trip.tourist_groups?.nume_grup || 'Fără grup'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Activity */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Alerte
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringDocuments.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nu există alerte în acest moment
                </div>
              ) : (
                <div className="space-y-3">
                  {expiringDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Document expiră curând</p>
                        <p className="text-muted-foreground">
                          {doc.nume} - {new Date(doc.expiry_date).toLocaleDateString('ro-RO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Statistici Rapide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Circuite active</span>
                    <span className="font-medium">{stats.activeTrips}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div 
                      className="h-full bg-success rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (stats.activeTrips / Math.max(1, stats.activeTrips + 5)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Turiști activi</span>
                    <span className="font-medium">{stats.tourists}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div 
                      className="h-full bg-primary rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (stats.tourists / Math.max(1, stats.tourists + 10)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ghizi disponibili</span>
                    <span className="font-medium">{stats.guides}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div 
                      className="h-full bg-accent rounded-full transition-all" 
                      style={{ width: `${Math.min(100, (stats.guides / Math.max(1, stats.guides + 3)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div className="space-y-6">
      {renderActiveView()}
    </div>
  );
};

export default AdminDashboard;