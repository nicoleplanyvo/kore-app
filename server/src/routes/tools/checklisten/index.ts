import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { checklistenTemplatesRouter } from './templates.js';
import { checklistenSessionsRouter } from './sessions.js';
import { checklistenEntriesRouter } from './entries.js';
import { checklistenReportsRouter } from './reports.js';

export const checklistenRouter: RouterType = Router();

// Alle Checklisten-Routes erfordern Auth + Tool-Zugriff
checklistenRouter.use(authenticate, requireToolAccess('standards.checklisten'));

// GET /api/tools/checklisten/stores — Zugängliche Stores für dieses Tool
checklistenRouter.get('/stores', async (req, res) => {
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
    console.error('Checklisten stores list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// Sub-Router mounten
checklistenRouter.use('/templates', checklistenTemplatesRouter);
checklistenRouter.use('/sessions', checklistenSessionsRouter);
checklistenRouter.use('/', checklistenEntriesRouter);
checklistenRouter.use('/reports', checklistenReportsRouter);
