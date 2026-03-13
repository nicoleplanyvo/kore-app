import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { stockCalloutCreateSchema, stockCalloutUpdateSchema } from '@shared/validators';

export const stockCalloutsRouter: RouterType = Router();
stockCalloutsRouter.use(authenticate, requireToolAccess('customer.stock_callouts'));

// GET /callouts — List with filters (status, urgency, storeId)
stockCalloutsRouter.get('/callouts', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.urgency) where['urgency'] = req.query.urgency;

    const [data, total] = await Promise.all([
      prisma.stockCallout.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
          reporter: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.stockCallout.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /callouts — Create
stockCalloutsRouter.post('/callouts', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;
    const parsed = stockCalloutCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const callout = await prisma.stockCallout.create({
      data: { ...parsed.data, storeId, reportedBy: userId },
    });
    res.status(201).json(callout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /summary — Status counts
stockCalloutsRouter.get('/summary', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const callouts = await prisma.stockCallout.findMany({ where });

    const statusCounts: Record<string, number> = {};
    const urgencyCounts: Record<string, number> = {};
    for (const c of callouts) {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      urgencyCounts[c.urgency] = (urgencyCounts[c.urgency] || 0) + 1;
    }

    res.json({
      total: callouts.length,
      byStatus: statusCounts,
      byUrgency: urgencyCounts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /callouts/:id — Get single
stockCalloutsRouter.get('/callouts/:id', async (req, res) => {
  try {
    const callout = await prisma.stockCallout.findUnique({
      where: { id: req.params['id'] },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
    if (!callout) return res.status(404).json({ error: 'Stock Callout nicht gefunden.' });
    res.json(callout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /callouts/:id — Update
stockCalloutsRouter.put('/callouts/:id', async (req, res) => {
  try {
    const parsed = stockCalloutUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const callout = await prisma.stockCallout.update({
      where: { id: req.params['id'] },
      data: parsed.data,
    });
    res.json(callout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
