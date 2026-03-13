import { Router, type Router as RouterType } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { getAccessibleStoreIds } from '../../middleware/auth.js';
import prisma from '../../lib/prisma.js';

export const toolsRouter: RouterType = Router();

/**
 * GET /api/tools
 * Gibt alle Tools zurück, die den Stores des aktuellen Users zugewiesen sind.
 * Dedupliziert nach toolId (ein User kann mehrere Stores mit demselben Tool haben).
 */
toolsRouter.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user!;
    const storeIds = await getAccessibleStoreIds(user.sub, user.tenantId ?? null, user.role);

    const whereClause =
      storeIds === 'all'
        ? { isActive: true }
        : { storeId: { in: storeIds }, isActive: true };

    const assignments = await prisma.storeToolAssignment.findMany({
      where: whereClause,
      include: {
        tool: true,
      },
      orderBy: [{ tool: { category: 'asc' } }, { tool: { sortOrder: 'asc' } }],
    });

    // Learner: nur learnerAccessible Tools anzeigen
    const filteredAssignments = user.role === 'learner'
      ? assignments.filter((a) => a.tool.learnerAccessible)
      : assignments;

    // Deduplizieren nach toolId (User kann mehrere Stores mit demselben Tool haben)
    const seen = new Set<string>();
    const deduplicated = filteredAssignments.filter((a) => {
      if (seen.has(a.tool.id)) return false;
      seen.add(a.tool.id);
      return true;
    });

    res.json(deduplicated);
  } catch (error) {
    console.error('Fehler beim Laden der Tools:', error);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
