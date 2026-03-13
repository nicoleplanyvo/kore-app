import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { seaTemplatesRouter } from './templates.js';
import { seaSessionsRouter } from './sessions.js';
import { seaResponsesRouter } from './responses.js';
import { seaReportsRouter } from './reports.js';

export const storeExcellenceAuditRouter: RouterType = Router();

// Alle SEA-Routes erfordern Auth + Tool-Zugriff
storeExcellenceAuditRouter.use(authenticate, requireToolAccess('standards.excellence_tracker'));

// GET /api/tools/sea/stores — Zugängliche Stores für dieses Tool
storeExcellenceAuditRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;

    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') {
      where['id'] = { in: toolStoreIds };
    } else if (tenantId) {
      where['tenantId'] = tenantId;
    }
    // kore_admin ohne tenantId: alle aktiven Stores (kein tenantId-Filter)

    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });

    res.json(stores);
  } catch (err) {
    console.error('SEA stores list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// Sub-Router mounten
storeExcellenceAuditRouter.use('/templates', seaTemplatesRouter);
storeExcellenceAuditRouter.use('/sessions', seaSessionsRouter);
storeExcellenceAuditRouter.use('/', seaResponsesRouter);
storeExcellenceAuditRouter.use('/reports', seaReportsRouter);
