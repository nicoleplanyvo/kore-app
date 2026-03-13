import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma.js';
import { getAccessibleStoreIds } from './auth.js';

/**
 * Middleware-Factory: Prüft ob der User Zugriff auf mindestens einen Store hat,
 * der das angegebene Tool (per ToolDefinition.key) freigeschaltet hat.
 *
 * Setzt req.tenantId und req.toolStoreIds für nachfolgende Handler.
 * kore_admin bypassed den Tool-Check nicht — auch Admins brauchen zugewiesene Stores.
 *
 * Verwendung: router.use(authenticate, requireToolAccess('standards.excellence_tracker'))
 */
export function requireToolAccess(toolKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Nicht authentifiziert.' });
      return;
    }

    const tenantId = req.user.tenantId;
    if (!tenantId) {
      // kore_admin ohne tenantId darf trotzdem zugreifen
      if (req.user.role === 'kore_admin') {
        (req as any).tenantId = null;
        (req as any).toolStoreIds = 'all';
        next();
        return;
      }
      res.status(403).json({ error: 'Kein Tenant zugewiesen.' });
      return;
    }

    try {
      // Finde das Tool
      const tool = await prisma.toolDefinition.findUnique({
        where: { key: toolKey },
        select: { id: true, learnerAccessible: true },
      });

      if (!tool) {
        res.status(404).json({ error: 'Tool nicht gefunden.' });
        return;
      }

      // Learner darf nur auf learnerAccessible Tools zugreifen
      if (req.user.role === 'learner' && !tool.learnerAccessible) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses Tool.' });
        return;
      }

      // Ermittle zugängliche Stores
      const accessibleStoreIds = await getAccessibleStoreIds(
        req.user.sub,
        tenantId,
        req.user.role,
      );

      // Finde Stores, die das Tool freigeschaltet haben
      const storeFilter = accessibleStoreIds === 'all'
        ? { store: { tenantId } }
        : { storeId: { in: accessibleStoreIds } };

      const assignments = await prisma.storeToolAssignment.findMany({
        where: {
          toolId: tool.id,
          isActive: true,
          ...storeFilter,
        },
        select: { storeId: true },
      });

      if (assignments.length === 0) {
        res.status(403).json({ error: 'Tool nicht freigeschaltet.' });
        return;
      }

      const toolStoreIds = assignments.map((a) => a.storeId);

      (req as any).tenantId = tenantId;
      (req as any).toolStoreIds = toolStoreIds;
      next();
    } catch (error) {
      console.error('requireToolAccess error:', error);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  };
}
