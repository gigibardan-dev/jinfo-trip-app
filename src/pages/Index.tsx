import { useState } from "react";
import Navigation from "@/components/Navigation";
import AdminDashboard from "@/components/AdminDashboard";
import TouristDashboard from "@/components/TouristDashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Plane, Globe } from "lucide-react";

const Index = () => {
  const [userRole, setUserRole] = useState<"admin" | "tourist" | null>(null);

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-hero rounded-2xl flex items-center justify-center shadow-strong">
                <Plane className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
              TravelPro PWA
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Aplicația completă pentru agenții de turism - gestionează călătorii, turiști și documente 
              cu funcționalitate offline avansată
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="secondary" className="px-4 py-2">
                <Globe className="w-4 h-4 mr-2" />
                PWA Ready
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                Supabase Backend
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                📱 Offline First
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card 
              className="p-8 shadow-strong border-0 cursor-pointer transition-all hover:shadow-strong hover:-translate-y-1"
              onClick={() => setUserRole("admin")}
            >
              <CardContent className="p-0 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Admin Panel</h3>
                <p className="text-muted-foreground mb-6">
                  Gestionează călătorii, turiști, documente și comunicări. 
                  Dashboard complet cu analytics și monitorizare.
                </p>
                <Button className="w-full bg-gradient-ocean text-primary-foreground">
                  Acces Administrator
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="p-8 shadow-strong border-0 cursor-pointer transition-all hover:shadow-strong hover:-translate-y-1"
              onClick={() => setUserRole("tourist")}
            >
              <CardContent className="p-0 text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Aplicația Turist</h3>
                <p className="text-muted-foreground mb-6">
                  Accesează itinerariul, documentele și hărțile offline. 
                  Comunicare cu ghidul și check-in activități.
                </p>
                <Button className="w-full bg-gradient-sunset text-accent-foreground">
                  Acces Turist
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16">
            <p className="text-muted-foreground">
              Demo aplicație - În versiunea completă este necesară autentificare
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation userRole={userRole} />
      
      <main className="container mx-auto px-4 py-8">
        {userRole === "admin" ? <AdminDashboard /> : <TouristDashboard />}
      </main>

      {/* Demo Mode Indicator */}
      <div className="fixed bottom-4 right-4">
        <Card className="shadow-medium border-0">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-muted-foreground">Demo Mode</span>
              <Button 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-primary"
                onClick={() => setUserRole(null)}
              >
                Schimbă Role
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
