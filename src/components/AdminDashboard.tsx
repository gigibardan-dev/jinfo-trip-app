import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GroupManager from "./admin/GroupManager";


import {
  Users,
  Plane,
  FileText,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  Plus,
  ArrowLeft
} from "lucide-react";

// Import componentele pentru navigare
import EnhancedTripManager from "./admin/EnhancedTripManager";
import TouristManager from "./admin/TouristManager";
import DocumentUploader from "./admin/DocumentUploader";

type ActiveView = 'dashboard' | 'trips' | 'tourists' | 'documents' | 'groups';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  // === MOCK DATA - TO BE REPLACED WITH REAL DATA ===
  const MOCK_stats = [
    {
      title: "Călătorii Active",
      value: "12",
      change: "+2 această lună",
      icon: Plane,
      color: "text-primary"
    },
    {
      title: "Turiști Înregistrați",
      value: "284",
      change: "+18 această săptămână",
      icon: Users,
      color: "text-success"
    },
    {
      title: "Documente Uploadate",
      value: "1,547",
      change: "+156 azi",
      icon: FileText,
      color: "text-accent"
    },
    {
      title: "Alerte Active",
      value: "3",
      change: "Necesită atenție",
      icon: AlertTriangle,
      color: "text-warning"
    }
  ];

  const MOCK_recentTrips = [
    {
      id: 1,
      name: "Paris - City of Light",
      destination: "Paris, Franța",
      startDate: "15 Mar 2024",
      tourists: 24,
      status: "active",
      progress: 65
    },
    {
      id: 2,
      name: "Alpine Adventure",
      destination: "Zermatt, Elveția",
      startDate: "22 Mar 2024",
      tourists: 18,
      status: "confirmed",
      progress: 90
    },
    {
      id: 3,
      name: "Mediterranean Escape",
      destination: "Santorini, Grecia",
      startDate: "5 Apr 2024",
      tourists: 32,
      status: "draft",
      progress: 35
    }
  ];
  // === END MOCK DATA ===

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

  const renderDashboard = () => (
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

      {/* Stats Grid - MOCK DATA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_stats.map((stat, index) => (
          <Card key={index} className="shadow-soft border-0 relative">
            {/* Mock Data Badge */}
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                MOCK
              </Badge>
            </div>
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
        {/* Recent Trips - MOCK DATA */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft border-0 relative">
            {/* Mock Data Badge */}
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                MOCK DATA
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary" />
                Călătorii Recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_recentTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="border rounded-lg p-4 hover:shadow-medium transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{trip.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-1" />
                          {trip.destination}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1" />
                          {trip.startDate}
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <Badge className={getStatusColor(trip.status)}>
                          {getStatusText(trip.status)}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {trip.tourists} turiști
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">
                            {trip.progress}%
                          </div>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${trip.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Activity - MOCK DATA */}
        <div className="space-y-6">
          {/* Alerts */}
          <Card className="shadow-soft border-0 relative">
            {/* Mock Data Badge */}
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                MOCK
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Alerte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Documente expirate</p>
                    <p className="text-muted-foreground">5 pașapoarte necesită reînnoire</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-accent mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Capacitate maximă</p>
                    <p className="text-muted-foreground">Călătoria la Roma este completă</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Deadline apropiat</p>
                    <p className="text-muted-foreground">Itinerariu Paris - 2 zile</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats - MOCK DATA */}
          <Card className="shadow-soft border-0 relative">
            {/* Mock Data Badge */}
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                MOCK
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Performanță
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Satisfacție clienți</span>
                    <span className="font-medium">4.8/5</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div className="w-[96%] h-full bg-success rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Documente complete</span>
                    <span className="font-medium">89%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div className="w-[89%] h-full bg-primary rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utilizare offline</span>
                    <span className="font-medium">67%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div className="w-[67%] h-full bg-accent rounded-full" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderActiveView()}
    </div>
  );
};

export default AdminDashboard;