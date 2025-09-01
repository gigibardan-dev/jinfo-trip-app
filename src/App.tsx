import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import TouristDocuments from "./components/TouristDocuments";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TouristsPage from "./pages/admin/TouristsPage";
import TripsPage from "./pages/admin/TripsPage";
import DocumentsPage from "./pages/admin/DocumentsPage";
import CommunicationsPage from "./pages/admin/CommunicationsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import MessagesPage from "./pages/tourist/MessagesPage";
import Footer from "./components/shared/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
                <Route path="/documents" element={<TouristDocuments />} />
                <Route path="/tourists" element={<TouristsPage />} />
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/admin-documents" element={<DocumentsPage />} />
                <Route path="/communications" element={<CommunicationsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
