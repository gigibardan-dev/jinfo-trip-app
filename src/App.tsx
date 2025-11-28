import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/shared/routing/ProtectedRoute";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import Footer from "./components/shared/Footer";

// Lazy load toate pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MapsPage = lazy(() => import("./pages/MapsPage"));

// Admin pages
const TouristsPage = lazy(() => import("./pages/admin/TouristsPage"));
const TripsPage = lazy(() => import("./pages/admin/TripsPage"));
const DocumentsPage = lazy(() => import("./pages/admin/DocumentsPage"));
const CommunicationsPage = lazy(() => import("./pages/admin/CommunicationsPage"));
const GuidesPage = lazy(() => import("./pages/admin/GuidesPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));

// Guide pages
const GuideDashboardPage = lazy(() => import("./pages/guide/GuideDashboardPage"));
const GuideDocumentsPage = lazy(() => import("./pages/guide/GuideDocumentsPage"));
const GuideItineraryPage = lazy(() => import("./pages/guide/GuideItineraryPage"));
const GuideMessagesPage = lazy(() => import("./pages/guide/GuideMessagesPage"));
const GuideReportsPage = lazy(() => import("./pages/guide/GuideReportsPage"));

// Tourist pages
const TouristDocumentsPage = lazy(() => import("./pages/tourist/DocumentsPage"));
const MessagesPage = lazy(() => import("./pages/tourist/MessagesPage"));
const ItineraryPage = lazy(() => import("./pages/tourist/ItineraryPage"));
const OfflineMapsPage = lazy(() => import("./pages/tourist/OfflineMapsPage"));
const MapViewerPage = lazy(() => import("./pages/tourist/MapViewerPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col">
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
            <div className="flex-1">
              <Suspense fallback={
                <div className="container mx-auto p-6 space-y-6">
                  <CardSkeleton count={3} />
                </div>
              }>
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
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
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
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
              </Suspense>
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
