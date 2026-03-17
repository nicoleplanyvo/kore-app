import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { hasMinRole, type UserRole } from '@shared/types';

interface ProtectedRouteProps {
  /** Erlaubte Rollen (exakt) */
  allowedRoles?: UserRole[];
  /** Mindestrolle (hierarchisch) */
  minRole?: UserRole;
}

export function ProtectedRoute({ allowedRoles, minRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, viewAsRole } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-kore-bg">
        <p className="font-body text-kore-mid">Laden...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Effektive Rolle: viewAsRole (falls gesetzt) oder echte Rolle
  const effectiveRole = viewAsRole || user.role;

  // Rollenprueefung
  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    return <Navigate to="/" replace />;
  }

  if (minRole && !hasMinRole(effectiveRole, minRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
