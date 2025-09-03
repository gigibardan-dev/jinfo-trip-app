import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plane, Users, FileText, MessageSquare, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface NavigationProps {
  userRole?: "admin" | "tourist" | "guide";
}

const Navigation = ({ userRole = "admin" }: NavigationProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { profile, signOut } = useAuth();

  const adminNavItems = [
    { id: "dashboard", label: "Dashboard", icon: MapPin },
    { id: "trips", label: "Călătorii", icon: Plane },
    { id: "tourists", label: "Turiști", icon: Users },
    { id: "documents", label: "Documente", icon: FileText },
    { id: "communications", label: "Comunicări", icon: MessageSquare },
    { id: "guides", label: "Ghizi", icon: Users },
    { id: "settings", label: "Setări", icon: Settings },
  ];

  const guideNavItems = [
    { id: "guide-dashboard", label: "Dashboard", icon: MapPin },
    { id: "guide-itinerary", label: "Itinerariu", icon: Plane },
    { id: "guide-reports", label: "Rapoarte", icon: FileText },
  ];

  const touristNavItems = [
    { id: "dashboard", label: "Acasă", icon: MapPin },
    { id: "itinerary", label: "Itinerariu", icon: Plane },
    { id: "documents", label: "Documente", icon: FileText },
    { id: "messages", label: "Mesaje", icon: MessageSquare },
  ];

  const navItems = userRole === "admin" ? adminNavItems : 
                   userRole === "guide" ? guideNavItems : touristNavItems;

  const handleNavigation = (id: string) => {
    setActiveTab(id);
    if (id === "dashboard") {
      navigate("/");
    } else if (id === "documents" && userRole === "admin") {
      navigate("/admin-documents");
    } else {
      navigate(`/${id}`);
    }
  };

  return (
    <nav className="bg-gradient-ocean border-b shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Plane className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">TravelPro</h1>
              <p className="text-xs text-primary-foreground/80">
                {userRole === "admin" ? "Admin Panel" : "Your Journey"}
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleNavigation(item.id)}
                className={
                  activeTab === item.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                }
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              {profile?.nume ? `${profile.nume} ${profile.prenume}` : (userRole === "admin" ? "Administrator" : "Turist")}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Ieșire
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleNavigation(item.id)}
                className={
                  activeTab === item.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                }
              >
                <item.icon className="w-4 h-4 mr-1" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;