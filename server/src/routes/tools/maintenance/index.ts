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

// ── STORES ──────────────────────────────────────────

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── USERS ───────────────────────────────────────────

// GET /users — List users for assignment
maintenanceRouter.get('/users', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── REQUESTS ────────────────────────────────────────

// GET /requests — Paginated with filters
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
    if (req.query.from) where['createdAt'] = { ...(where['createdAt'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['createdAt'] = { ...(where['createdAt'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const [data, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
          reporter: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /requests/:id — Single request detail
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /requests — Create new request
maintenanceRouter.post('/requests', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = maintenanceRequestCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const request = await prisma.maintenanceRequest.create({
      data: { ...parsed.data, tenantId, reportedBy: userId },
      include: {
        store: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /requests/:id — Update request
maintenanceRouter.put('/requests/:id', async (req, res) => {
  try {
    const parsed = maintenanceRequestUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'RESOLVED' || parsed.data.status === 'CLOSED') {
      data['resolvedAt'] = new Date();
    }

    const request = await prisma.maintenanceRequest.update({
      where: { id: req.params['id'] },
      data,
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DASHBOARD / SUMMARY ─────────────────────────────

// GET /dashboard?storeId=&from=&to= — KPIs + breakdowns
maintenanceRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from) where['createdAt'] = { ...(where['createdAt'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['createdAt'] = { ...(where['createdAt'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        store: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = requests.length;
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byStore: Record<string, { name: string; count: number; open: number; resolved: number }> = {};
    let totalEstimatedCost = 0;
    let totalActualCost = 0;
    let overdueCount = 0;

    // SLA limits in hours by priority
    const slaHours: Record<string, number> = { URGENT: 4, HIGH: 24, MEDIUM: 72, LOW: 168 };

    for (const r of requests) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;
      byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
      totalEstimatedCost += r.estimatedCost ?? 0;
      totalActualCost += r.actualCost ?? 0;

      // Store breakdown
      if (r.storeId && r.store) {
        if (!byStore[r.storeId]) {
          byStore[r.storeId] = { name: r.store.name, count: 0, open: 0, resolved: 0 };
        }
        const storeStat = byStore[r.storeId]!;
        storeStat.count++;
        if (r.status === 'OPEN' || r.status === 'IN_PROGRESS') storeStat.open++;
        if (r.status === 'RESOLVED' || r.status === 'CLOSED') storeStat.resolved++;
      }

      // Overdue check
      if (r.status === 'OPEN' || r.status === 'IN_PROGRESS') {
        const limitHours = slaHours[r.priority] ?? 168;
        const hoursElapsed = (Date.now() - new Date(r.createdAt).getTime()) / 3600000;
        if (hoursElapsed > limitHours) overdueCount++;
      }
    }

    // Average resolution time (for resolved/closed)
    const resolvedRequests = requests.filter(r => r.resolvedAt && (r.status === 'RESOLVED' || r.status === 'CLOSED'));
    const avgResolutionHours = resolvedRequests.length > 0
      ? Math.round(resolvedRequests.reduce((sum, r) => {
          return sum + (new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime()) / 3600000;
        }, 0) / resolvedRequests.length)
      : 0;

    // Trend data (group by date)
    const dateMap = new Map<string, { created: number; resolved: number }>();
    requests.forEach(r => {
      const dateStr = new Date(r.createdAt).toISOString().split('T')[0] as string;
      const existing = dateMap.get(dateStr) ?? { created: 0, resolved: 0 };
      existing.created++;
      dateMap.set(dateStr, existing);
    });
    resolvedRequests.forEach(r => {
      const dateStr = new Date(r.resolvedAt!).toISOString().split('T')[0] as string;
      const existing = dateMap.get(dateStr) ?? { created: 0, resolved: 0 };
      existing.resolved++;
      dateMap.set(dateStr, existing);
    });

    const trends = Array.from(dateMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Recent urgent/high priority open requests
    const urgentOpen = requests
      .filter(r => (r.status === 'OPEN' || r.status === 'IN_PROGRESS') && (r.priority === 'URGENT' || r.priority === 'HIGH'))
      .slice(0, 10);

    res.json({
      kpis: {
        total,
        open: (byStatus['OPEN'] ?? 0) + (byStatus['IN_PROGRESS'] ?? 0),
        resolved: (byStatus['RESOLVED'] ?? 0) + (byStatus['CLOSED'] ?? 0),
        overdueCount,
        avgResolutionHours,
        totalEstimatedCost,
        totalActualCost,
      },
      byStatus,
      byPriority,
      byCategory,
      byStore: Object.entries(byStore).map(([storeId, data]) => ({ storeId, ...data })),
      trends,
      urgentOpen,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /summary?storeId= — Quick summary (for overview)
maintenanceRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      select: { status: true, priority: true, category: true, estimatedCost: true, actualCost: true, createdAt: true },
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── EXPORT ──────────────────────────────────────────

// GET /export?storeId=&from=&to= — CSV data
maintenanceRouter.get('/export', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from) where['createdAt'] = { ...(where['createdAt'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['createdAt'] = { ...(where['createdAt'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        store: { select: { name: true } },
        reporter: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
