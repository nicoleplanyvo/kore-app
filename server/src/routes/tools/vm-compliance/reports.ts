import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';

export const vmReportsRouter: RouterType = Router();

// GET /summary  — Compliance-Rate Overview
vmReportsRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const storeFilter: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') storeFilter['storeId'] = { in: toolStoreIds };

    const [totalSubmissions, approved, rejected, pending] = await Promise.all([
      prisma.vmSubmission.count({ where: storeFilter }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'APPROVED' } }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'REJECTED' } }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'PENDING' } }),
    ]);

    const complianceRate = totalSubmissions > 0
      ? Math.round((approved / (approved + rejected)) * 100) || 0
      : 0;

    res.json({
      totalSubmissions,
      approved,
      rejected,
      pending,
      complianceRate,
    });
  } catch (err) {
    console.error('VM summary error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /by-store  — Store-Vergleich
vmReportsRouter.get('/by-store', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const storeWhere: Record<string, unknown> = { tenantId, isActive: true };
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: {
        id: true,
        name: true,
        city: true,
        vmSubmissions: {
          select: { status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = stores.map((store) => {
      const approved = store.vmSubmissions.filter((s) => s.status === 'APPROVED').length;
      const rejected = store.vmSubmissions.filter((s) => s.status === 'REJECTED').length;
      const pending = store.vmSubmissions.filter((s) => s.status === 'PENDING').length;
      const reviewed = approved + rejected;
      return {
        storeId: store.id,
        storeName: store.name,
        city: store.city,
        total: store.vmSubmissions.length,
        approved,
        rejected,
        pending,
        complianceRate: reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('VM by-store error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
