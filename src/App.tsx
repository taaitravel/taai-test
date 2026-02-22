import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ExpediaSwipeProvider } from "@/components/swipe/ExpediaSwipeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import CreateItinerary from "./pages/CreateItinerary";
import CreateManualItinerary from "./pages/CreateManualItinerary";
import Itinerary from "./pages/Itinerary";
import EditItinerary from "./pages/EditItinerary";
import WhatWeDo from "./pages/WhatWeDo";
import Contact from "./pages/Contact";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import NotFound from "./pages/NotFound";
import AdminRoles from "./pages/AdminRoles";
import Search from "./pages/Search";
import MyItineraries from "./pages/MyItineraries";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="taai-theme">
          <ExpediaSwipeProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/profile-setup" element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } />
              <Route path="/home" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/new-itinerary" element={
                <ProtectedRoute>
                  <CreateItinerary />
                </ProtectedRoute>
              } />
              <Route path="/new-manual-itinerary" element={
                <ProtectedRoute>
                  <CreateManualItinerary />
                </ProtectedRoute>
              } />
              <Route path="/itinerary" element={
                <ProtectedRoute>
                  <Itinerary />
                </ProtectedRoute>
              } />
              <Route path="/edit-itinerary" element={
                <ProtectedRoute>
                  <EditItinerary />
                </ProtectedRoute>
              } />
              <Route path="/what-we-do" element={<WhatWeDo />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/admin/roles" element={
                <ProtectedRoute>
                  <AdminRoles />
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              } />
              <Route path="/itineraries" element={
                <ProtectedRoute>
                  <MyItineraries />
                </ProtectedRoute>
              } />
              <Route path="/my-itineraries" element={
                <ProtectedRoute>
                  <MyItineraries />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomNav />
          </BrowserRouter>
        </ExpediaSwipeProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
