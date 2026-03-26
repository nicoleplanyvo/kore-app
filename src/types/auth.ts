// Inline-Types aus @kore/types — Auth

export type UserRole =
  | 'kore_admin'
  | 'tenant_admin'
  | 'regional_manager'
  | 'multisite_manager'
  | 'store_manager'
  | 'learner';

export const ROLE_HIERARCHY: UserRole[] = [
  'kore_admin',
  'tenant_admin',
  'regional_manager',
  'multisite_manager',
  'store_manager',
  'learner',
];

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) <= ROLE_HIERARCHY.indexOf(requiredRole);
}

export interface JWTPayload {
  sub: string;
  tenantId: string | null;
  role: UserRole;
  impersonatedBy?: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  impersonatedBy?: string;
  storeAssignments?: string[];
}
