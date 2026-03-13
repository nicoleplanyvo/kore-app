import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { inventoryCountCreateSchema, inventoryItemUpsertSchema } from '@shared/validators';

export const inventoryRouter: RouterType = Router();
inventoryRouter.use(authenticate, requireToolAccess('performance.inventory'));

// GET /stores
inventoryRouter.get('/stores', async (req, res) => {
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

// GET /counts — Inventur-Liste
inventoryRouter.get('/counts', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (toolStoreIds !== 'all') where['storeId'] = req.query.storeId || { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;

    const [data, total] = await Promise.all([
      prisma.inventoryCount.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.inventoryCount.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /counts — Neue Inventur starten
inventoryRouter.post('/counts', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = inventoryCountCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const count = await prisma.inventoryCount.create({
      data: { ...parsed.data, tenantId, conductedBy: userId },
      include: { store: { select: { id: true, name: true } } },
    });
    res.status(201).json(count);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /counts/:id — Detail mit Items
inventoryRouter.get('/counts/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        items: { orderBy: { sku: 'asc' } },
      },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden.' });
    res.json(count);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /counts/:id/items/:sku — Item upsert
inventoryRouter.put('/counts/:id/items', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = inventoryItemUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    // Verify count belongs to tenant and is IN_PROGRESS
    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId, status: 'IN_PROGRESS' },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden oder bereits abgeschlossen.' });

    const discrepancy = parsed.data.actualQty - parsed.data.expectedQty;
    const discrepancyValue = discrepancy * parsed.data.unitPrice;

    const item = await prisma.inventoryItem.upsert({
      where: { countId_sku: { countId: req.params.id, sku: parsed.data.sku } },
      create: {
        countId: req.params.id,
        ...parsed.data,
        discrepancy,
        discrepancyValue,
        countedAt: new Date(),
      },
      update: {
        productName: parsed.data.productName,
        category: parsed.data.category || null,
        expectedQty: parsed.data.expectedQty,
        actualQty: parsed.data.actualQty,
        unitPrice: parsed.data.unitPrice,
        discrepancy,
        discrepancyValue,
        notes: parsed.data.notes || null,
        countedAt: new Date(),
      },
    });

    // Update count stats
    const stats = await prisma.inventoryItem.aggregate({
      where: { countId: req.params.id },
      _count: true,
      _sum: { discrepancyValue: true },
    });
    const discrepancies = await prisma.inventoryItem.count({
      where: { countId: req.params.id, discrepancy: { not: 0 } },
    });

    await prisma.inventoryCount.update({
      where: { id: req.params.id },
      data: {
        countedItems: stats._count,
        discrepancies,
        totalValue: Math.abs(stats._sum.discrepancyValue ?? 0),
      },
    });

    res.json(item);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /counts/:id/complete — Inventur abschließen
inventoryRouter.post('/counts/:id/complete', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId, status: 'IN_PROGRESS' },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden oder bereits abgeschlossen.' });

    const updated = await prisma.inventoryCount.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: {
        store: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /summary — Inventur-Übersicht
inventoryRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [total, completed, inProgress, valueAgg] = await Promise.all([
      prisma.inventoryCount.count({ where }),
      prisma.inventoryCount.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.inventoryCount.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.inventoryCount.aggregate({ where: { ...where, status: 'COMPLETED' }, _sum: { totalValue: true, discrepancies: true } }),
    ]);

    res.json({
      totalCounts: total,
      completedCounts: completed,
      inProgressCounts: inProgress,
      totalDiscrepancyValue: valueAgg._sum.totalValue ?? 0,
      totalDiscrepancies: valueAgg._sum.discrepancies ?? 0,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
