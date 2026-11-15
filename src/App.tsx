import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChromeStateProvider } from "@/contexts/ChromeStateContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { PlanLimitProvider } from "@/components/plans/PlanLimitProvider";
import { travelBookingCheckoutEnabled } from "@/lib/features";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

const ChatInterface = lazy(() =>
  import("@/components/chat/ChatInterface").then((module) => ({ default: module.ChatInterface })),
);
const Index = lazy(() => import("./pages/Index"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Terms = lazy(() => import("./pages/Terms"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CreateItinerary = lazy(() => import("./pages/CreateItinerary"));
const CreateManualItinerary = lazy(() => import("./pages/CreateManualItinerary"));
const Itinerary = lazy(() => import("./pages/Itinerary"));
const EditItinerary = lazy(() => import("./pages/EditItinerary"));
const WhatWeDo = lazy(() => import("./pages/WhatWeDo"));
const Contact = lazy(() => import("./pages/Contact"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const Search = lazy(() => import("./pages/Search"));
const MyItineraries = lazy(() => import("./pages/MyItineraries"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const InternalTOS = lazy(() => import("./pages/InternalTOS"));
const AgentOperations = lazy(() => import("./pages/AgentOperations"));
const Discover = lazy(() => import("./pages/Discover"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const PublicItinerary = lazy(() => import("./pages/PublicItinerary"));
const DashboardPreview = import.meta.env.DEV
  ? lazy(() => import("./dev/DashboardPreview"))
  : null;

const RouteFallback = () => (
  <div className="min-h-screen bg-background" role="status" aria-live="polite">
    <span className="sr-only">Loading</span>
  </div>
);

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
    <Suspense fallback={null}>
      <ChatInterface
        context="travel planning and general travel assistance"
        assistantName="Miles"
        assistantSubtitle="Your taai travel specialist"
        greeting="Hi, I'm Miles — your taai travel specialist. Tell me where you're going and I'll line up flights, stays, activities and the costs in one itinerary."
        placeholder="Where are you going?"
      />
    </Suspense>
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
            <AppErrorBoundary>
            <PlanLimitProvider>
            <Suspense fallback={<RouteFallback />}>
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
              {DashboardPreview ? (
                <Route path="/internal/dashboard-preview" element={<DashboardPreview />} />
              ) : null}
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
            </Suspense>
            <MobileBottomNav />
            <SignedInMiles />
            </PlanLimitProvider>
            </AppErrorBoundary>
          </BrowserRouter>
          </ChromeStateProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
