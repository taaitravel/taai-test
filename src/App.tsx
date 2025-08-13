
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Terms from "./pages/Terms";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import CreateItinerary from "./pages/CreateItinerary";
import CreateManualItinerary from "./pages/CreateManualItinerary";
import Itinerary from "./pages/Itinerary";
import EditItinerary from "./pages/EditItinerary";
import WhatWeDo from "./pages/WhatWeDo";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminRoles from "./pages/AdminRoles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/profile-setup" element={
              <ProtectedRoute>
                <ProfileSetup />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/create-itinerary" element={
              <ProtectedRoute>
                <CreateItinerary />
              </ProtectedRoute>
            } />
            <Route path="/create-manual-itinerary" element={
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
            <Route path="/admin/roles" element={
              <ProtectedRoute>
                <AdminRoles />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
