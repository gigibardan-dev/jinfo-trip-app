import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  FileText, 
  Wifi, 
  WifiOff, 
  Clock,
  Camera,
  Navigation,
  Sun,
  CloudRain
} from "lucide-react";

const TouristDashboard = () => {
  // Mock data for current trip
  const currentTrip = {
    name: "Paris - City of Light",
    destination: "Paris, Franța",
    currentDay: 3,
    totalDays: 7,
    startDate: "15 Mar 2024",
    endDate: "22 Mar 2024",
    groupMembers: 24,
    nextActivity: "Vizită Muzeul Luvru",
    nextActivityTime: "14:30",
    weather: "☀️ 18°C"
  };

  const todaySchedule = [
    {
      time: "09:00",
      title: "Mic dejun la hotel",
      location: "Hotel Le Marais",
      status: "completed",
      type: "meal"
    },
    {
      time: "10:30",
      title: "Tur ghidat Montmartre",
      location: "Sacré-Cœur",
      status: "completed",
      type: "attraction"
    },
    {
      time: "14:30",
      title: "Vizită Muzeul Luvru",
      location: "Musée du Louvre",
      status: "upcoming",
      type: "attraction"
    },
    {
      time: "18:00",
      title: "Croazieră pe Sena",
      location: "Port de la Bourdonnais",
      status: "upcoming",
      type: "transport"
    }
  ];

  const quickActions = [
    { label: "Vezi Itinerariu", icon: Calendar, color: "primary" },
    { label: "Documente", icon: FileText, color: "accent" },
    { label: "Hărți Offline", icon: MapPin, color: "success" },
    { label: "Check-in", icon: Camera, color: "warning" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success text-success-foreground";
      case "upcoming": return "bg-primary text-primary-foreground";
      case "ongoing": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "meal": return "🍽️";
      case "attraction": return "🏛️";
      case "transport": return "🚢";
      case "accommodation": return "🏨";
      default: return "📍";
    }
  };

  return (
    <div className="space-y-6">
      {/* Trip Header */}
      <Card className="shadow-medium border-0 bg-gradient-hero text-primary-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{currentTrip.name}</h1>
              <div className="flex items-center gap-4 text-primary-foreground/90">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentTrip.destination}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Ziua {currentTrip.currentDay} din {currentTrip.totalDays}
                </div>
                <div className="flex items-center gap-1">
                  <Sun className="w-4 h-4" />
                  {currentTrip.weather}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0">
                <Wifi className="w-3 h-3 mr-1" />
                Online
              </Badge>
              <Button variant="secondary" className="bg-white/20 text-primary-foreground hover:bg-white/30 border-0">
                <Navigation className="w-4 h-4 mr-2" />
                Navigație
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-16 flex flex-col gap-2 hover:shadow-medium transition-all"
          >
            <action.icon className="w-5 h-5" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Programul de Azi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.map((activity, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${
                      activity.status === "upcoming" 
                        ? "border-primary bg-primary/5 shadow-soft" 
                        : activity.status === "completed"
                        ? "border-success bg-success/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{activity.title}</h3>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status === "completed" ? "Completat" : 
                             activity.status === "upcoming" ? "Urmează" : "În desfășurare"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {activity.location}
                          </div>
                        </div>
                        
                        {activity.status === "upcoming" && index === 2 && (
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" className="bg-primary">
                              <Navigation className="w-3 h-3 mr-1" />
                              Navigație
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="w-3 h-3 mr-1" />
                              Detalii
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trip Progress */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg">Progres Călătorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Ziua {currentTrip.currentDay} din {currentTrip.totalDays}</span>
                    <span className="font-medium">43%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="w-[43%] h-full bg-gradient-ocean rounded-full" />
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground mb-1">Următoarea activitate</div>
                  <div className="font-medium">{currentTrip.nextActivity}</div>
                  <div className="text-sm text-accent">{currentTrip.nextActivityTime}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Info */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg">Informații Grup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membri totali</span>
                  <span className="font-medium">{currentTrip.groupMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in azi</span>
                  <span className="font-medium text-success">18/24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mesaje noi</span>
                  <Badge variant="destructive">3</Badge>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  Vezi Grup Complet
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Offline Status */}
          <Card className="shadow-soft border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-success" />
                Status Offline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Hărți</span>
                  <Badge variant="secondary" className="bg-success text-success-foreground">
                    Sincronizat
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Itinerariu</span>
                  <Badge variant="secondary" className="bg-success text-success-foreground">
                    Sincronizat
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Documente</span>
                  <Badge variant="secondary" className="bg-warning text-warning-foreground">
                    Parțial
                  </Badge>
                </div>
                
                <Button variant="outline" className="w-full mt-4">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Forțează Sincronizare
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TouristDashboard;