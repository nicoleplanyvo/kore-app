import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { lossIncidentCreateSchema, lossIncidentUpdateSchema } from '@shared/validators';

export const lossPreventionRouter: RouterType = Router();
lossPreventionRouter.use(authenticate, requireToolAccess('performance.loss_prevention'));

// GET /stores
lossPreventionRouter.get('/stores', async (req, res) => {
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

// GET /incidents — Paginierte Liste
lossPreventionRouter.get('/incidents', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (toolStoreIds !== 'all') where['storeId'] = req.query.storeId || { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.category) where['category'] = req.query.category;
    if (req.query.severity) where['severity'] = req.query.severity;

    const [data, total] = await Promise.all([
      prisma.lossIncident.findMany({
        where,
        include: { store: { select: { id: true, name: true, city: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lossIncident.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /incidents — Neuen Vorfall melden
lossPreventionRouter.post('/incidents', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = lossIncidentCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const incident = await prisma.lossIncident.create({
      data: { ...parsed.data, tenantId, reportedBy: userId },
      include: { store: { select: { id: true, name: true } } },
    });
    res.status(201).json(incident);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /incidents/:id — Detail
lossPreventionRouter.get('/incidents/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const incident = await prisma.lossIncident.findFirst({
      where: { id: req.params.id, tenantId },
      include: { store: { select: { id: true, name: true, city: true } } },
    });
    if (!incident) return res.status(404).json({ error: 'Vorfall nicht gefunden.' });
    res.json(incident);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /incidents/:id — Status/Details aktualisieren
lossPreventionRouter.put('/incidents/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = lossIncidentUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.' });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'RESOLVED' || parsed.data.status === 'CLOSED') {
      data['resolvedAt'] = new Date();
    }

    const result = await prisma.lossIncident.updateMany({
      where: { id: req.params.id, tenantId },
      data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Vorfall nicht gefunden.' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /summary — Loss Prevention Übersicht
lossPreventionRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [total, open, resolved, totalAmount] = await Promise.all([
      prisma.lossIncident.count({ where }),
      prisma.lossIncident.count({ where: { ...where, status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      prisma.lossIncident.count({ where: { ...where, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.lossIncident.aggregate({ where, _sum: { amount: true } }),
    ]);

    // By category
    const byCategory = await prisma.lossIncident.groupBy({
      by: ['category'],
      where,
      _count: true,
      _sum: { amount: true },
    });

    res.json({
      totalIncidents: total,
      openIncidents: open,
      resolvedIncidents: resolved,
      totalLoss: totalAmount._sum.amount ?? 0,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        count: c._count,
        amount: c._sum.amount ?? 0,
      })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
