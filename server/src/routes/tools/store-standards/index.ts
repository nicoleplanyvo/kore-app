import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { stdCategoriesRouter } from './categories.js';
import { stdDefinitionsRouter } from './definitions.js';
import { stdEvaluationsRouter } from './evaluations.js';
import { stdReportsRouter } from './reports.js';

export const storeStandardsRouter: RouterType = Router();
storeStandardsRouter.use(authenticate, requireToolAccess('standards.store_standards'));

// GET /stores — Stores mit Tool-Zugang
storeStandardsRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
    else if (tenantId) where['tenantId'] = tenantId;
    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (err) {
    console.error('Standards stores error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

storeStandardsRouter.use('/categories', stdCategoriesRouter);
storeStandardsRouter.use('/definitions', stdDefinitionsRouter);
storeStandardsRouter.use('/evaluations', stdEvaluationsRouter);
storeStandardsRouter.use('/reports', stdReportsRouter);
