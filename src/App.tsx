import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChromeStateProvider } from "@/contexts/ChromeStateContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PlanLimitProvider } from "@/components/plans/PlanLimitProvider";
import { travelBookingCheckoutEnabled } from "@/lib/features";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { ChatInterface } from "@/components/chat/ChatInterface";
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
import BookingSuccess from "./pages/BookingSuccess";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ResetPassword from "./pages/ResetPassword";
import InternalTOS from "./pages/InternalTOS";
import AgentOperations from "./pages/AgentOperations";
import Discover from "./pages/Discover";
import PublicProfile from "./pages/PublicProfile";
import PublicItinerary from "./pages/PublicItinerary";

const queryClient = new QueryClient();

const MILES_HIDDEN_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/new-itinerary",
  "/checkout",
  "/cart",
]);

/** Signed-in Miles launcher. Landing keeps its own button. Create Itinerary has an embedded composer. */
const SignedInMiles = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (!user || MILES_HIDDEN_ROUTES.has(pathname)) return null;
  return (
    <ChatInterface
      context="travel planning and general travel assistance"
      assistantName="Miles"
      assistantSubtitle="Your taai travel specialist"
      greeting="Hi, I'm Miles — your taai travel specialist. Tell me where you're going and I'll line up flights, stays, activities and the costs in one itinerary."
      placeholder="Where are you going?"
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="taai-theme">
          <ChromeStateProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <PlanLimitProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
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
              <Route path="/discover" element={<Discover />} />
              <Route path="/p/:slug" element={<PublicProfile />} />
              <Route path="/t/:slug" element={<PublicItinerary />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/admin/roles" element={
                <ProtectedRoute requireAdmin>
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
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              {travelBookingCheckoutEnabled && (
                <>
                  <Route path="/booking-success" element={
                    <ProtectedRoute>
                      <BookingSuccess />
                    </ProtectedRoute>
                  } />
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } />
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  } />
                </>
              )}
              <Route path="/internal/tos" element={
                <ProtectedRoute requireAdmin>
                  <InternalTOS />
                </ProtectedRoute>
              } />
              <Route path="/internal/agents" element={
                <ProtectedRoute requireAdmin>
                  <AgentOperations />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileBottomNav />
            <SignedInMiles />
            </PlanLimitProvider>
          </BrowserRouter>
          </ChromeStateProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
