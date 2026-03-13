import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  maintenanceRequestCreateSchema,
  maintenanceRequestUpdateSchema,
} from '@shared/validators';

export const maintenanceRouter: RouterType = Router();
maintenanceRouter.use(authenticate, requireToolAccess('floor.maintenance'));

// GET /stores
maintenanceRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
    else if (tenantId) where['tenantId'] = tenantId;
    const stores = await prisma.store.findMany({ where, select: { id: true, name: true, city: true }, orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /requests — Paginiert mit Filtern
maintenanceRouter.get('/requests', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.category) where['category'] = req.query.category;
    if (req.query.priority) where['priority'] = req.query.priority;

    const [data, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: { store: { select: { id: true, name: true, city: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /requests — Neuen Request erstellen
maintenanceRouter.post('/requests', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = maintenanceRequestCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const request = await prisma.maintenanceRequest.create({
      data: { ...parsed.data, tenantId, reportedBy: userId },
      include: { store: { select: { id: true, name: true } } },
    });
    res.status(201).json(request);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /requests/:id
maintenanceRouter.get('/requests/:id', async (req, res) => {
  try {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: req.params['id'] },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    if (!request) return res.status(404).json({ error: 'Request nicht gefunden.' });
    res.json(request);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /requests/:id
maintenanceRouter.put('/requests/:id', async (req, res) => {
  try {
    const parsed = maintenanceRequestUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'RESOLVED' || parsed.data.status === 'CLOSED') {
      data['resolvedAt'] = new Date();
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id: req.params['id'] },
      data,
      include: { store: { select: { id: true, name: true } } },
    });
    res.json(request);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /summary — Übersicht der Requests nach Status/Priorität
maintenanceRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      select: { status: true, priority: true, category: true, estimatedCost: true, actualCost: true },
    });

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalEstimatedCost = 0;
    let totalActualCost = 0;

    for (const r of requests) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
      totalEstimatedCost += r.estimatedCost ?? 0;
      totalActualCost += r.actualCost ?? 0;
    }

    res.json({ total: requests.length, byStatus, byPriority, byCategory, totalEstimatedCost, totalActualCost });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
