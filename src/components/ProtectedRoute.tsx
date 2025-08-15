import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has accepted terms (skip check for terms page itself)
  if (userProfile && (!userProfile.terms_accepted_at || !userProfile.privacy_accepted_at)) {
    return <Navigate to="/terms" state={{ requireAcceptance: true }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return <>{children}</>;
}