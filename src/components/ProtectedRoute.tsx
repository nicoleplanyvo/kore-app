import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from './LoadingSpinner';
import type { UserRole } from '../types';
import { hasMinRole } from '../types';

interface ProtectedRouteProps {
  minRole?: UserRole;
}

export function ProtectedRoute({ minRole = 'learner' }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasMinRole(user.role, minRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
