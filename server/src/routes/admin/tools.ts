import { Router, type Router as RouterType } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';

export const adminToolsRouter: RouterType = Router();
adminToolsRouter.use(authenticate, requireMinRole('regional_manager'));

// GET /api/admin/tools — 34 Tools gruppiert nach Kategorie mit Assignment-Counts
adminToolsRouter.get('/', async (_req, res) => {
  try {
    const tools = await prisma.toolDefinition.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      include: { _count: { select: { assignments: true } } },
    });

    // Gruppiere nach Kategorie
    const grouped: Record<string, typeof tools> = {};
    for (const tool of tools) {
      if (!grouped[tool.category]) grouped[tool.category] = [];
      grouped[tool.category]!.push(tool);
    }

    res.json({ tools, grouped });
  } catch (err) {
    console.error('Tools list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/tools/stats — Statistiken: Kategorie-Stats + MRR
adminToolsRouter.get('/stats', async (_req, res) => {
  try {
    const totalTools = await prisma.toolDefinition.count({ where: { isActive: true } });
    const totalAssignments = await prisma.storeToolAssignment.count({ where: { isActive: true } });

    // MRR berechnen: Summe aller aktiven Zuweisungen * Preis
    const activeAssignments = await prisma.storeToolAssignment.findMany({
      where: { isActive: true },
      include: { tool: { select: { priceMonthly: true } } },
    });

    let mrr = 0;
    for (const a of activeAssignments) {
      mrr += a.tool.priceMonthly;
    }

    // Zuweisungen pro Kategorie
    const tools = await prisma.toolDefinition.findMany({
      where: { isActive: true },
      include: { _count: { select: { assignments: true } } },
    });

    const categoryStats: Record<string, { total: number; assigned: number }> = {};
    for (const tool of tools) {
      if (!categoryStats[tool.category]) {
        categoryStats[tool.category] = { total: 0, assigned: 0 };
      }
      categoryStats[tool.category]!.total++;
      categoryStats[tool.category]!.assigned += tool._count.assignments;
    }

    res.json({ totalTools, totalAssignments, mrr, categoryStats });
  } catch (err) {
    console.error('Tool stats error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
