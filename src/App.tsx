import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/react";
import { ProtectedRoute } from "@/components/shared/routing/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
import OfflineMapsPage from "./pages/tourist/OfflineMapsPage";
import MapViewerPage from "./pages/tourist/MapViewerPage";
import MapsPage from "./pages/MapsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import StampsPage from "./pages/tourist/StampsPage";
import Footer from "./components/shared/Footer";
import { CookieConsent } from "@/components/shared/gdpr/CookieConsent";
import { InstallPromoBanner } from "@/components/shared/pwa/InstallPromoBanner";
import PWAPrompt from 'react-ios-pwa-prompt';


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Toaster />
            {(() => {
              const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
              const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

              if (isSafari || isIOS) {
                return (
                  <PWAPrompt
                    timesToShow={3}
                    delay={10000}
                  />
                );
              }

              return <InstallPromoBanner />;
            })()}
            <Sonner />
            <BrowserRouter>
              <div className="flex-1">
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<Terms />} />

                  {/* ADMIN ONLY ROUTES */}
                  <Route
                    path="/trips"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <TripsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tourists"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <TouristsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/guides"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <GuidesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-documents"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <DocumentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/communications"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <CommunicationsPage />
                      </ProtectedRoute>
                    }
                  />
                  {/* SHARED ROUTES - All authenticated users */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'guide', 'tourist']}>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* GUIDE ONLY ROUTES */}
                  <Route path="/guide-dashboard" element={<Navigate to="/" replace />} />
                  <Route
                    path="/guide-itinerary"
                    element={
                      <ProtectedRoute allowedRoles={['guide']}>
                        <GuideItineraryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/guide-reports"
                    element={
                      <ProtectedRoute allowedRoles={['guide']}>
                        <GuideReportsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/guide-documents"
                    element={
                      <ProtectedRoute allowedRoles={['guide']}>
                        <GuideDocumentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/guide-messages"
                    element={
                      <ProtectedRoute allowedRoles={['guide']}>
                        <GuideMessagesPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* TOURIST ONLY ROUTES */}
                  <Route
                    path="/documents"
                    element={
                      <ProtectedRoute allowedRoles={['tourist']}>
                        <TouristDocumentsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/itinerary"
                    element={
                      <ProtectedRoute allowedRoles={['tourist']}>
                        <ItineraryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkin"
                    element={
                      <ProtectedRoute allowedRoles={['tourist']}>
                        <StampsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/messages"
                    element={
                      <ProtectedRoute allowedRoles={['tourist']}>
                        <MessagesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tourist/maps"
                    element={
                      <ProtectedRoute allowedRoles={['tourist']}>
                        <OfflineMapsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tourist/maps/:tripId"
                    element={
                      <ProtectedRoute allowedRoles={['tourist']}>
                        <MapViewerPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* SHARED ROUTES (all authenticated roles) */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'guide', 'tourist']}>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/maps"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'guide', 'tourist']}>
                        <MapsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 NOT FOUND */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <Footer />

              {/* GDPR Cookie Consent Banner */}
              <CookieConsent />
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
     <Analytics /> {/* ✅ Vercel Analytics */}
  </QueryClientProvider>
);

export default App;
