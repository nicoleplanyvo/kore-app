import { useAuthStore } from '../stores/authStore';
import { hasMinRole, type UserRole } from '@shared/types';

/**
 * Gibt die effektive Rolle zurück (viewAsRole oder echte Rolle).
 * Zentrale Stelle für rollenbasierte UI-Entscheidungen.
 */
export function useEffectiveRole() {
  const { user, viewAsRole } = useAuthStore();
  const effectiveRole: UserRole = viewAsRole || user?.role || 'learner';
  const realRole = user?.role || 'learner';

  return {
    /** Effektive Rolle (viewAsRole falls gesetzt, sonst echte Rolle) */
    role: effectiveRole,
    /** Echte Rolle des Users (unabhängig von viewAs) */
    realRole,
    /** Ob viewAs aktiv ist */
    isViewingAs: !!viewAsRole,
    /** Ob die effektive Rolle mindestens minRole hat */
    hasRole: (minRole: UserRole) => hasMinRole(effectiveRole, minRole),
    /** Ob der User Daten eingeben soll (store_manager oder tiefer) */
    isOperator: !hasMinRole(effectiveRole, 'multisite_manager'),
    /** Ob der User konfigurieren kann (multisite_manager oder höher) */
    isConfigurator: hasMinRole(effectiveRole, 'multisite_manager'),
    /** Ob der User Tools und Stores verwalten kann */
    isAdmin: hasMinRole(effectiveRole, 'tenant_admin'),
    /** Ob der User die Plattform verwaltet */
    isSuperAdmin: hasMinRole(effectiveRole, 'kore_admin'),
  };
}
