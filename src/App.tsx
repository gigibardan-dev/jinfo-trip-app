import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TouristsPage from "./pages/admin/TouristsPage";
import TripsPage from "./pages/admin/TripsPage";
import DocumentsPage from "./pages/admin/DocumentsPage";
import CommunicationsPage from "./pages/admin/CommunicationsPage";
import GuidesPage from "./pages/admin/GuidesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import MessagesPage from "./pages/tourist/MessagesPage";
import ItineraryPage from "./pages/tourist/ItineraryPage";
import TouristDocumentsPage from "./pages/tourist/DocumentsPage";
import GuideDashboardPage from "./pages/guide/GuideDashboardPage";
import GuideItineraryPage from "./pages/guide/GuideItineraryPage";
import GuideReportsPage from "./pages/guide/GuideReportsPage";
import GuideDocumentsPage from "./pages/guide/GuideDocumentsPage";
import GuideMessagesPage from "./pages/guide/GuideMessagesPage";
import ProfilePage from "./pages/ProfilePage";
import Footer from "./components/shared/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/documents" element={<TouristDocumentsPage />} />
                <Route path="/tourists" element={<TouristsPage />} />
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/admin-documents" element={<DocumentsPage />} />
                <Route path="/communications" element={<CommunicationsPage />} />
                <Route path="/guides" element={<GuidesPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/itinerary" element={<ItineraryPage />} />
                <Route path="/guide-dashboard" element={<GuideDashboardPage />} />
                <Route path="/guide-itinerary" element={<GuideItineraryPage />} />
                <Route path="/guide-reports" element={<GuideReportsPage />} />
          <Route path="/guide-documents" element={<GuideDocumentsPage />} />
          <Route path="/guide-messages" element={<GuideMessagesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
