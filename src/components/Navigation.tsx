import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Home, Plane, FileText, MessageSquare, Users, Compass, ClipboardList, Settings, LogOut, ChevronDown, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { InstallPWAButton } from "@/components/pwa/InstallPWAButton";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface NavigationProps {
  userRole?: "admin" | "tourist" | "guide";
}

const Navigation = ({ userRole = "admin" }: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const unreadMessages = useUnreadMessages();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/" || path.includes("dashboard")) {
      setActiveTab("dashboard");
    } else if (path.includes("trips")) {
      setActiveTab("trips");
    } else if (path.includes("tourists")) {
      setActiveTab("tourists");
    } else if (path.includes("guides")) {
      setActiveTab("guides");
    } else if (path.includes("documents")) {
      setActiveTab("documents");
    } else if (path.includes("communications")) {
      setActiveTab("communications");
    } else if (path.includes("settings")) {
      setActiveTab("settings");
    } else if (path.includes("itinerary")) {
      setActiveTab("itinerary");
    } else if (path.includes("reports")) {
      setActiveTab("reports");
    } else if (path.includes("messages")) {
      setActiveTab("messages");
    }
  }, [location.pathname]);

  // Tourist Nav Items
  const touristNavItems = [
    { id: "dashboard", label: "Acasă", icon: Home, path: "/" },
    { id: "itinerary", label: "Itinerariu", icon: Plane, path: "/itinerary" },
    { id: "documents", label: "Documente", icon: FileText, path: "/documents" },
    { id: "messages", label: "Mesaje", icon: MessageSquare, path: "/messages" },
  ];

  // Guide Nav Items (5 tabs)
  const guideNavItems = [
    { id: "dashboard", label: "Acasă", icon: Home, path: "/guide-dashboard" },
    { id: "itinerary", label: "Itinerariu", icon: Plane, path: "/guide-itinerary" },
    { id: "reports", label: "Rapoarte", icon: ClipboardList, path: "/guide-reports" },
    { id: "documents", label: "Documente", icon: FileText, path: "/guide-documents" },
    { id: "messages", label: "Mesaje", icon: MessageSquare, path: "/guide-messages" },
  ];

  // Admin Nav Items - DESKTOP (7 tabs)
  const adminNavItemsDesktop = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "trips", label: "Călătorii", icon: Plane, path: "/trips" },
    { id: "tourists", label: "Turiști", icon: Users, path: "/tourists" },
    { id: "guides", label: "Ghizi", icon: Compass, path: "/guides" },
    { id: "documents", label: "Documente", icon: FileText, path: "/admin-documents" },
    { id: "communications", label: "Comunicări", icon: MessageSquare, path: "/communications" },
    { id: "settings", label: "Setări", icon: Settings, path: "/settings" },
  ];

  // Admin Nav Items - MOBILE (4 tabs + More)
  const adminNavItemsMobile = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "trips", label: "Călătorii", icon: Plane, path: "/trips" },
    { id: "tourists", label: "Turiști", icon: Users, path: "/tourists" },
    { id: "more", label: "Mai mult", icon: MoreHorizontal, path: "#" },
  ];

  // Admin More Menu Items (mobile only)
  const adminMoreItems = [
    { id: "guides", label: "Ghizi", icon: Compass, path: "/guides" },
    { id: "documents", label: "Documente", icon: FileText, path: "/admin-documents" },
    { id: "communications", label: "Comunicări", icon: MessageSquare, path: "/communications" },
    { id: "settings", label: "Setări", icon: Settings, path: "/settings" },
  ];

  const handleNavigation = (path: string, id: string) => {
    if (id === "more") {
      setMoreMenuOpen(true);
      return;
    }

    setActiveTab(id);
    navigate(path);
  };

  const handleMoreItemClick = (path: string, id: string) => {
    setActiveTab(id);
    setMoreMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Top Bar - Minimal */}
      <div className="bg-gradient-ocean border-b shadow-soft fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            {/* Logo */}
            <button
              onClick={() => handleNavigation(
                userRole === "guide" ? "/guide/dashboard" : "/",
                "dashboard"
              )}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
                <Plane className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary-foreground">TravelPro</h1>
              </div>
            </button>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <InstallPWAButton />

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <span className="hidden sm:inline mr-1 font-semibold">
                      {profile?.nume ? `${profile.nume} ${profile.prenume}` : "User"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    {profile?.nume ? `${profile.nume} ${profile.prenume}` : "Utilizator"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    Profil
                  </DropdownMenuItem>
                  {userRole !== "admin" && (
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      Setări
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Deconectare
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-7xl mx-auto">
          {/* DESKTOP - Admin 7 tabs / Guide 5 / Tourist 4 */}
          <div className="hidden md:block">
            <div className={`grid ${userRole === "admin" ? "grid-cols-7" :
                userRole === "guide" ? "grid-cols-5" :
                  "grid-cols-4"
              } gap-1 px-2 py-2`}>
              {(userRole === "admin" ? adminNavItemsDesktop :
                userRole === "guide" ? guideNavItems : touristNavItems).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isMessagesTab = item.id === "messages" || (userRole === "admin" && item.id === "communications");

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path, item.id)}
                      className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                      )}
                      <div className="relative">
                        <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                        {isMessagesTab && unreadMessages > 0 && (
                          <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold shadow-lg animate-pulse">
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"} leading-tight text-center`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* MOBILE - Admin 4+More / Guide 5 / Tourist 4 */}
          <div className="md:hidden">
            <div className={`grid ${userRole === "guide" ? "grid-cols-5" : "grid-cols-4"
              } gap-1 px-2 py-2`}>
              {(userRole === "admin" ? adminNavItemsMobile :
                userRole === "guide" ? guideNavItems : touristNavItems).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isMessagesTab = item.id === "messages";

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path, item.id)}
                      className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                        }`}
                    >
                      {isActive && item.id !== "more" && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                      )}
                      <div className="relative">
                        <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                        {isMessagesTab && unreadMessages > 0 && (
                          <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold shadow-lg animate-pulse">
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"} leading-tight text-center`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Admin More Menu - Bottom Sheet (Mobile Only) */}
      {userRole === "admin" && (
        <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Mai multe opțiuni</SheetTitle>
              <SheetDescription>
                Selectează o opțiune din lista de mai jos
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-4 mt-6 pb-4">
              {adminMoreItems.map((item) => {
                const Icon = item.icon;
                const isCommunications = item.id === "communications";
                return (
                  <Button
                    key={item.id}
                    variant="outline"
                    className="h-20 flex flex-col gap-2 relative"
                    onClick={() => handleMoreItemClick(item.path, item.id)}
                  >
                    <div className="relative">
                      <Icon className="w-6 h-6" />
                      {isCommunications && unreadMessages > 0 && (
                        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold shadow-lg animate-pulse">
                          {unreadMessages > 9 ? '9+' : unreadMessages}
                        </div>
                      )}
                    </div>
                    <span className="text-sm">{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default Navigation;