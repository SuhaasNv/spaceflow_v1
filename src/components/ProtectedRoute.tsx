import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "FACILITIES_MANAGER" | "EMPLOYEE";
  adminOrFM?: boolean;
}

export default function ProtectedRoute({ children, requiredRole, adminOrFM }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(200,25%,6%)] text-[hsl(200,10%,92%)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(172,66%,45%)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  if (adminOrFM && user.role !== "ADMIN" && user.role !== "FACILITIES_MANAGER") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
