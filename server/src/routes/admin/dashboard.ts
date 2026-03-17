import { Router, type Router as RouterType } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';

export const adminDashboardRouter: RouterType = Router();
adminDashboardRouter.use(authenticate, requireMinRole('kore_admin'));

// GET /api/admin/dashboard/stats — Dashboard-Statistiken
adminDashboardRouter.get('/stats', async (_req, res) => {
  try {
    const [totalTenants, activeTenants, totalStores, activeStores, activeAssignments, recentTenants] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),
      prisma.storeToolAssignment.findMany({
        where: { isActive: true },
        include: { tool: { select: { priceMonthly: true } } },
      }),
      prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { _count: { select: { stores: true } } },
      }),
    ]);

    let mrr = 0;
    for (const a of activeAssignments) {
      mrr += a.tool.priceMonthly;
    }

    res.json({
      totalTenants,
      activeTenants,
      totalStores,
      activeStores,
      totalToolBookings: activeAssignments.length,
      mrr,
      recentTenants,
    });
  } catch (err) {
    console.error('Admin dashboard stats error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
