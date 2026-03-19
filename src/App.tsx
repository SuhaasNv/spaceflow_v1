import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { setNavigateToLogin } from "@/lib/api";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import BookSpace from "./pages/BookSpace";
import MyBookings from "./pages/MyBookings";
import Utilization from "./pages/Utilization";
import Recommendations from "./pages/Recommendations";
import Admin from "./pages/Admin";
import BookingUsage from "./pages/BookingUsage";
import Patterns from "./pages/Patterns";
import Segments from "./pages/Segments";
import Spaces from "./pages/Spaces";
import AllBookings from "./pages/AllBookings";
import CheckIn from "./pages/CheckIn";
import Settings from "./pages/Settings";
import AdminConfig from "./pages/AdminConfig";
import AdminAudit from "./pages/AdminAudit";
import Pricing from "./pages/Pricing";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function TopLoadingBar() {
  const location = useLocation();
  const [barKey, setBarKey] = useState(0);

  useEffect(() => {
    setBarKey((k) => k + 1);
  }, [location.pathname]);

  return (
    <motion.div
      key={barKey}
      className="fixed top-0 left-0 h-[2px] z-[9999] pointer-events-none rounded-r-full"
      style={{
        background: "linear-gradient(90deg, hsl(172,66%,45%) 0%, hsl(172,66%,65%) 100%)",
        boxShadow: "0 0 8px hsl(172,66%,50%)",
      }}
      initial={{ width: "0%", opacity: 1 }}
      animate={{ width: ["0%", "65%", "85%", "100%"], opacity: [1, 1, 1, 0] }}
      transition={{
        width: { duration: 0.9, times: [0, 0.35, 0.65, 1], ease: "easeOut" },
        opacity: { duration: 0.25, delay: 0.85 },
      }}
    />
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigateToLogin(() => () => navigate("/login", { replace: true }));
  }, [navigate]);

  return (
    <>
      <TopLoadingBar />
      <AnimatePresence mode="sync">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/onboarding" element={
          <ProtectedRoute><Onboarding /></ProtectedRoute>
        } />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="book" element={<BookSpace />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="utilization" element={
            <ProtectedRoute adminOrFM><Utilization /></ProtectedRoute>
          } />
          <Route path="booking-usage" element={
            <ProtectedRoute adminOrFM><BookingUsage /></ProtectedRoute>
          } />
          <Route path="patterns" element={
            <ProtectedRoute adminOrFM><Patterns /></ProtectedRoute>
          } />
          <Route path="segments" element={
            <ProtectedRoute adminOrFM><Segments /></ProtectedRoute>
          } />
          <Route path="recommendations" element={
            <ProtectedRoute adminOrFM><Recommendations /></ProtectedRoute>
          } />
          <Route path="spaces" element={
            <ProtectedRoute adminOrFM><Spaces /></ProtectedRoute>
          } />
          <Route path="all-bookings" element={
            <ProtectedRoute adminOrFM><AllBookings /></ProtectedRoute>
          } />
          <Route path="admin" element={
            <ProtectedRoute requiredRole="ADMIN"><Admin /></ProtectedRoute>
          } />
          <Route path="admin/config" element={
            <ProtectedRoute requiredRole="ADMIN"><AdminConfig /></ProtectedRoute>
          } />
          <Route path="admin/audit" element={
            <ProtectedRoute requiredRole="ADMIN"><AdminAudit /></ProtectedRoute>
          } />
          <Route path="checkin/:id" element={<CheckIn />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
