import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type JWTPayload } from '../lib/jwt.js';
import { ROLE_HIERARCHY, hasMinRole, type UserRole } from '@shared/types';
import prisma from '../lib/prisma.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht authentifiziert.' });
    return;
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token ungültig oder abgelaufen.' });
  }
}

/** Prüft ob User exakt eine der angegebenen Rollen hat */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Nicht authentifiziert.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Keine Berechtigung.' });
      return;
    }
    next();
  };
}

/** Prüft ob User mindestens die angegebene Rolle hat (hierarchisch) */
export function requireMinRole(minRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Nicht authentifiziert.' });
      return;
    }
    if (!hasMinRole(req.user.role as UserRole, minRole)) {
      res.status(403).json({ error: 'Keine Berechtigung für diese Aktion.' });
      return;
    }
    next();
  };
}

/**
 * Prüft Tenant-Zugriff:
 * - kore_admin: Zugriff auf alle Tenants
 * - Andere: Nur eigener Tenant (tenantId aus JWT muss req.params.tenantId/id matchen)
 *
 * Sucht den Tenant-Bezug in: req.params.tenantId, req.params.id (für Tenant-Routen), req.body.tenantId
 */
export function requireTenantAccess() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Nicht authentifiziert.' });
      return;
    }

    // kore_admin hat Zugriff auf alles
    if (req.user.role === 'kore_admin') {
      next();
      return;
    }

    // Finde die Tenant-ID aus dem Request
    const rawTenantId = req.params['tenantId'] || req.params['id'] || req.body?.tenantId;
    const requestedTenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId;

    if (requestedTenantId && req.user.tenantId !== requestedTenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Mandanten.' });
      return;
    }

    next();
  };
}

/**
 * Prüft Store-Zugriff:
 * - kore_admin: alle Stores
 * - tenant_admin: alle Stores des eigenen Tenants
 * - Andere: nur zugewiesene Stores (UserStoreAssignment)
 *
 * Erwartet Store-ID in req.params.id oder req.params.storeId
 */
export function requireStoreAccess() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Nicht authentifiziert.' });
      return;
    }

    // kore_admin hat Zugriff auf alles
    if (req.user.role === 'kore_admin') {
      next();
      return;
    }

    const rawStoreId = req.params['id'] || req.params['storeId'];
    const storeId = Array.isArray(rawStoreId) ? rawStoreId[0] : rawStoreId;
    if (!storeId) {
      next();
      return;
    }

    // Prüfe ob Store zum Tenant gehört
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { tenantId: true },
    });

    if (!store) {
      res.status(404).json({ error: 'Store nicht gefunden.' });
      return;
    }

    if (store.tenantId !== req.user.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
      return;
    }

    // tenant_admin hat Zugriff auf alle Stores des eigenen Tenants
    if (req.user.role === 'tenant_admin') {
      next();
      return;
    }

    // regional_manager: Prüfe Region-Zuweisung ODER direkte Store-Zuweisung
    if (req.user.role === 'regional_manager') {
      const storeDetail = await prisma.store.findUnique({
        where: { id: storeId },
        select: { regionId: true },
      });

      // Prüfe ob Store in einer zugewiesenen Region liegt
      if (storeDetail?.regionId) {
        const regionAssignment = await prisma.userRegionAssignment.findUnique({
          where: { userId_regionId: { userId: req.user.sub, regionId: storeDetail.regionId } },
        });
        if (regionAssignment) {
          next();
          return;
        }
      }
      // Falls nicht über Region → prüfe direkte Store-Zuweisung (Fallthrough)
    }

    // Andere Rollen: Prüfe direkte Store-Zuweisung
    const assignment = await prisma.userStoreAssignment.findUnique({
      where: { userId_storeId: { userId: req.user.sub, storeId } },
    });

    if (!assignment) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
      return;
    }

    next();
  };
}

/**
 * Helper: Gibt alle Store-IDs zurück, auf die ein User Zugriff hat
 */
export async function getAccessibleStoreIds(
  userId: string,
  tenantId: string | null,
  role: string,
): Promise<string[] | 'all'> {
  // kore_admin: alle Stores
  if (role === 'kore_admin') return 'all';

  // tenant_admin: alle Stores des Tenants
  if (role === 'tenant_admin' && tenantId) {
    const stores = await prisma.store.findMany({
      where: { tenantId },
      select: { id: true },
    });
    return stores.map((s: { id: string }) => s.id);
  }

  // regional_manager: Stores aus zugewiesenen Regionen + direkt zugewiesene Stores
  if (role === 'regional_manager') {
    const [regionAssignments, storeAssignments] = await Promise.all([
      prisma.userRegionAssignment.findMany({
        where: { userId },
        select: { regionId: true },
      }),
      prisma.userStoreAssignment.findMany({
        where: { userId },
        select: { storeId: true },
      }),
    ]);

    const regionIds = regionAssignments.map((a: { regionId: string }) => a.regionId);
    const directStoreIds = storeAssignments.map((a: { storeId: string }) => a.storeId);

    // Alle Stores in zugewiesenen Regionen holen
    const regionStores = regionIds.length > 0
      ? await prisma.store.findMany({
          where: { regionId: { in: regionIds } },
          select: { id: true },
        })
      : [];

    const regionStoreIds = regionStores.map((s: { id: string }) => s.id);

    // Deduplizieren
    return [...new Set([...directStoreIds, ...regionStoreIds])];
  }

  // multisite_manager, store_manager, learner: nur direkt zugewiesene Stores
  const assignments = await prisma.userStoreAssignment.findMany({
    where: { userId },
    select: { storeId: true },
  });
  return assignments.map((a: { storeId: string }) => a.storeId);
}
