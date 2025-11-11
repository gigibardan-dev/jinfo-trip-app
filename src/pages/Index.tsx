import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Users, Settings, Map, FileText, LogIn } from "lucide-react";
import Navigation from "@/components/Navigation";
import AdminDashboard from "@/components/AdminDashboard";
import TouristDashboard from "@/components/TouristDashboard";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [selectedRole, setSelectedRole] = useState<"admin" | "tourist" | null>(null);
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.role) {
      setSelectedRole(profile.role);
    }
  }, [profile]);

  // If not authenticated, show landing page with login option
  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-ocean">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-full mb-6">
              <Plane className="w-10 h-10 text-accent-foreground" />
            </div>
            <h1 className="text-5xl font-bold text-primary-foreground mb-4">TravelPro</h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Platforma completă pentru gestionarea călătoriilor. Administratorii gestionează turiștii și călătoriile, 
              iar turiștii accesează informațiile offline.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-card/95 backdrop-blur-sm border-border/20">
              <CardContent className="p-6">
                <Users className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Management Turiști</h3>
                <p className="text-sm text-muted-foreground">Gestionarea completă a turiștilor și grupurilor</p>
              </CardContent>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm border-border/20">
              <CardContent className="p-6">
                <Map className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Itinerarii Interactive</h3>
                <p className="text-sm text-muted-foreground">Itinerarii detaliate cu maps offline</p>
              </CardContent>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm border-border/20">
              <CardContent className="p-6">
                <FileText className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">Documente Digitale</h3>
                <p className="text-sm text-muted-foreground">Upload și acces offline la documente</p>
              </CardContent>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm border-border/20">
              <CardContent className="p-6">
                <Settings className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">PWA Advanced</h3>
                <p className="text-sm text-muted-foreground">Funcționează perfect fără internet</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="min-w-48">
              <LogIn className="w-5 h-5 mr-2" />
              Autentificare
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-ocean flex items-center justify-center">
        <div className="text-center text-primary-foreground">
          <Plane className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Se încarcă...</p>
        </div>
      </div>
    );
  }

 return (
  <div className="min-h-screen bg-gradient-ocean">
    <Navigation userRole={selectedRole || "tourist"} />
    
    {/* Spacer pentru top nav (h-14) + padding bottom pentru bottom nav */}
    <div className="pt-14 pb-20 px-2">
      {selectedRole === "admin" ? (
        <AdminDashboard />
      ) : (
        <TouristDashboard />
      )}
    </div>
  </div>
);
};

export default Index;