import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { inventoryCountCreateSchema, inventoryItemUpsertSchema } from '@shared/validators';

export const inventoryRouter: RouterType = Router();
inventoryRouter.use(authenticate, requireToolAccess('performance.inventory'));

// ── GET /stores ──────────────────────────────────────────
inventoryRouter.get('/stores', async (req, res) => {
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
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /users ───────────────────────────────────────────
inventoryRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const storeId = req.query.storeId as string | undefined;

    const where: Record<string, unknown> = { isActive: true };
    if (tenantId) where['tenantId'] = tenantId;

    if (storeId) {
      where['storeAssignments'] = { some: { storeId } };
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /counts ──────────────────────────────────────────
inventoryRouter.get('/counts', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (toolStoreIds !== 'all' && !req.query.storeId) where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.type) where['countType'] = req.query.type;
    if (req.query.from || req.query.to) {
      const dateFilter: Record<string, string> = {};
      if (req.query.from) dateFilter['gte'] = req.query.from as string;
      if (req.query.to) dateFilter['lte'] = req.query.to as string;
      where['countDate'] = dateFilter;
    }

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /counts ─────────────────────────────────────────
inventoryRouter.post('/counts', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = inventoryCountCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const count = await prisma.inventoryCount.create({
      data: {
        ...parsed.data,
        tenantId,
        conductedBy: userId,
        totalItems: req.body.totalItems ?? 0,
      },
      include: { store: { select: { id: true, name: true, city: true } } },
    });
    res.status(201).json(count);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /counts/:id ──────────────────────────────────────
inventoryRouter.get('/counts/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        items: { orderBy: { countedAt: 'desc' } },
      },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden.' });

    // Compute progress stats
    const totalItems = count.totalItems || count.items.length;
    const countedItems = count.items.filter((i) => i.countedAt !== null).length;
    const discrepancyItems = count.items.filter((i) => i.discrepancy !== 0);
    const recountItems = count.items.filter((i) => {
      if (i.expectedQty === 0) return Math.abs(i.discrepancy) > 0;
      return Math.abs(i.discrepancy / i.expectedQty) > 0.05;
    });
    const totalDiscrepancyValue = count.items.reduce((sum, i) => sum + Math.abs(i.discrepancyValue), 0);

    res.json({
      ...count,
      progress: {
        totalItems,
        countedItems,
        discrepancyCount: discrepancyItems.length,
        recountCount: recountItems.length,
        totalDiscrepancyValue,
        progressPercent: totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── PUT /counts/:id ──────────────────────────────────────
inventoryRouter.put('/counts/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden.' });

    const allowedFields: Record<string, unknown> = {};
    if (req.body.notes !== undefined) allowedFields['notes'] = req.body.notes;
    if (req.body.totalItems !== undefined) allowedFields['totalItems'] = Number(req.body.totalItems);
    if (req.body.countType !== undefined) allowedFields['countType'] = req.body.countType;

    const updated = await prisma.inventoryCount.update({
      where: { id: req.params.id },
      data: allowedFields,
      include: { store: { select: { id: true, name: true, city: true } } },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── PUT /counts/:id/items ────────────────────────────────
inventoryRouter.put('/counts/:id/items', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = inventoryItemUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId, status: 'IN_PROGRESS' },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden oder bereits abgeschlossen.' });

    const discrepancy = parsed.data.actualQty - parsed.data.expectedQty;
    const discrepancyValue = discrepancy * parsed.data.unitPrice;
    const needsRecount = parsed.data.expectedQty > 0
      ? Math.abs(discrepancy / parsed.data.expectedQty) > 0.05
      : Math.abs(discrepancy) > 0;

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

    res.json({ ...item, needsRecount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /counts/:id/items/batch ─────────────────────────
inventoryRouter.post('/counts/:id/items/batch', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId, status: 'IN_PROGRESS' },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden oder bereits abgeschlossen.' });

    const items = req.body.items as Array<{
      sku: string;
      productName: string;
      category?: string;
      expectedQty: number;
      actualQty: number;
      unitPrice: number;
      notes?: string;
    }>;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Keine Positionen übergeben.' });
    }

    const results: Array<{ sku: string; success: boolean; error?: string; needsRecount?: boolean }> = [];

    for (const raw of items) {
      const parsed = inventoryItemUpsertSchema.safeParse(raw);
      if (!parsed.success) {
        results.push({ sku: raw.sku || '?', success: false, error: 'Ungueltige Daten' });
        continue;
      }

      const discrepancy = parsed.data.actualQty - parsed.data.expectedQty;
      const discrepancyValue = discrepancy * parsed.data.unitPrice;
      const needsRecount = parsed.data.expectedQty > 0
        ? Math.abs(discrepancy / parsed.data.expectedQty) > 0.05
        : Math.abs(discrepancy) > 0;

      try {
        await prisma.inventoryItem.upsert({
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
        results.push({ sku: parsed.data.sku, success: true, needsRecount });
      } catch (e) {
        results.push({ sku: parsed.data.sku, success: false, error: 'Speicherfehler' });
      }
    }

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

    const successCount = results.filter((r) => r.success).length;
    res.json({ total: items.length, success: successCount, failed: items.length - successCount, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /counts/:id/complete ────────────────────────────
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
        store: { select: { id: true, name: true, city: true } },
        _count: { select: { items: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /counts/:id/approve ─────────────────────────────
inventoryRouter.post('/counts/:id/approve', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId, status: 'COMPLETED' },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden oder nicht abgeschlossen.' });

    // Mark as approved by setting a specific status - since schema has CANCELLED we repurpose completedAt
    // The CANCELLED status slot is available, but approval is conceptual here.
    // We store approval info in the notes and keep status COMPLETED since the Prisma enum only has
    // IN_PROGRESS, COMPLETED, CANCELLED. We add approvedBy info to notes.
    const approvedBy = req.user!.sub;
    const approvalNote = `[FREIGEGEBEN von ${approvedBy} am ${new Date().toISOString()}]`;
    const updatedNotes = count.notes ? `${count.notes}\n${approvalNote}` : approvalNote;

    const updated = await prisma.inventoryCount.update({
      where: { id: req.params.id },
      data: { notes: updatedNotes },
      include: {
        store: { select: { id: true, name: true, city: true } },
        items: { orderBy: { sku: 'asc' } },
      },
    });
    res.json({ ...updated, approved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DELETE /counts/:id ───────────────────────────────────
inventoryRouter.delete('/counts/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const count = await prisma.inventoryCount.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!count) return res.status(404).json({ error: 'Inventur nicht gefunden.' });

    await prisma.inventoryCount.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /dashboard ───────────────────────────────────────
inventoryRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    if (req.query.from || req.query.to) {
      const dateFilter: Record<string, string> = {};
      if (req.query.from) dateFilter['gte'] = req.query.from as string;
      if (req.query.to) dateFilter['lte'] = req.query.to as string;
      where['countDate'] = dateFilter;
    }

    // Total counts
    const [totalCounts, completedCounts, inProgressCounts] = await Promise.all([
      prisma.inventoryCount.count({ where }),
      prisma.inventoryCount.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.inventoryCount.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    ]);

    // Aggregate values from completed counts
    const completedWhere = { ...where, status: 'COMPLETED' as const };
    const valueAgg = await prisma.inventoryCount.aggregate({
      where: completedWhere,
      _sum: { totalValue: true, discrepancies: true, countedItems: true, totalItems: true },
      _avg: { totalValue: true },
    });

    // Average discrepancy rate: items with discrepancy / total items counted
    const totalItemsCounted = valueAgg._sum.countedItems ?? 0;
    const totalDiscrepancies = valueAgg._sum.discrepancies ?? 0;
    const avgDiscrepancyRate = totalItemsCounted > 0
      ? Math.round((totalDiscrepancies / totalItemsCounted) * 10000) / 100
      : 0;

    // Shrinkage value (total absolute discrepancy value)
    const shrinkageValue = valueAgg._sum.totalValue ?? 0;

    // Accuracy (inverse of discrepancy rate)
    const accuracy = totalItemsCounted > 0
      ? Math.round(((totalItemsCounted - totalDiscrepancies) / totalItemsCounted) * 10000) / 100
      : 100;

    // Trend: last 6 completed counts with discrepancy info
    const recentCounts = await prisma.inventoryCount.findMany({
      where: completedWhere,
      select: {
        id: true,
        countDate: true,
        countedItems: true,
        discrepancies: true,
        totalValue: true,
        store: { select: { id: true, name: true } },
      },
      orderBy: { countDate: 'desc' },
      take: 12,
    });

    // Top discrepancy items across all counts in range
    const countIds = recentCounts.map((c) => c.id);
    const topDiscrepancyItems = countIds.length > 0
      ? await prisma.inventoryItem.findMany({
          where: {
            countId: { in: countIds },
            discrepancy: { not: 0 },
          },
          orderBy: { discrepancyValue: 'asc' }, // most negative first (shrinkage)
          take: 10,
          select: {
            sku: true,
            productName: true,
            category: true,
            expectedQty: true,
            actualQty: true,
            discrepancy: true,
            discrepancyValue: true,
          },
        })
      : [];

    // Staff accuracy: group items by conductedBy in recent counts
    const staffCounts = await prisma.inventoryCount.findMany({
      where: completedWhere,
      select: {
        conductedBy: true,
        countedItems: true,
        discrepancies: true,
      },
    });

    const staffMap = new Map<string, { counted: number; discrepancies: number }>();
    for (const sc of staffCounts) {
      const existing = staffMap.get(sc.conductedBy) || { counted: 0, discrepancies: 0 };
      existing.counted += sc.countedItems;
      existing.discrepancies += sc.discrepancies;
      staffMap.set(sc.conductedBy, existing);
    }

    // Resolve staff names
    const staffIds = Array.from(staffMap.keys());
    const staffUsers = staffIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, name: true },
        })
      : [];

    const staffRanking = staffUsers.map((u) => {
      const s = staffMap.get(u.id)!;
      const accuracyPct = s.counted > 0 ? Math.round(((s.counted - s.discrepancies) / s.counted) * 10000) / 100 : 100;
      return { userId: u.id, name: u.name, counted: s.counted, discrepancies: s.discrepancies, accuracy: accuracyPct };
    }).sort((a, b) => b.accuracy - a.accuracy);

    // Store comparison
    const storeAgg = await prisma.inventoryCount.groupBy({
      by: ['storeId'],
      where: completedWhere,
      _count: true,
      _sum: { totalValue: true, discrepancies: true, countedItems: true },
    });

    const storeIds = storeAgg.map((s) => s.storeId);
    const stores = storeIds.length > 0
      ? await prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true, city: true },
        })
      : [];

    const storeMap = new Map(stores.map((s) => [s.id, s]));
    const storeComparison = storeAgg.map((s) => {
      const store = storeMap.get(s.storeId);
      const counted = s._sum.countedItems ?? 0;
      const disc = s._sum.discrepancies ?? 0;
      return {
        storeId: s.storeId,
        storeName: store?.name ?? s.storeId,
        city: store?.city ?? null,
        counts: s._count,
        shrinkageValue: s._sum.totalValue ?? 0,
        discrepancyRate: counted > 0 ? Math.round((disc / counted) * 10000) / 100 : 0,
      };
    });

    res.json({
      totalCounts,
      completedCounts,
      inProgressCounts,
      avgDiscrepancyRate,
      shrinkageValue,
      accuracy,
      trend: recentCounts.reverse(),
      topDiscrepancyItems,
      staffRanking,
      storeComparison,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /reports/comparison ──────────────────────────────
inventoryRouter.get('/reports/comparison', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId, status: 'COMPLETED' };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from || req.query.to) {
      const dateFilter: Record<string, string> = {};
      if (req.query.from) dateFilter['gte'] = req.query.from as string;
      if (req.query.to) dateFilter['lte'] = req.query.to as string;
      where['countDate'] = dateFilter;
    }

    const storeAgg = await prisma.inventoryCount.groupBy({
      by: ['storeId'],
      where,
      _count: true,
      _sum: { totalValue: true, discrepancies: true, countedItems: true },
      _avg: { totalValue: true },
    });

    const storeIds = storeAgg.map((s) => s.storeId);
    const stores = storeIds.length > 0
      ? await prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true, city: true },
        })
      : [];

    const storeMap = new Map(stores.map((s) => [s.id, s]));
    const comparison = storeAgg.map((s) => {
      const store = storeMap.get(s.storeId);
      const counted = s._sum.countedItems ?? 0;
      const disc = s._sum.discrepancies ?? 0;
      return {
        storeId: s.storeId,
        storeName: store?.name ?? s.storeId,
        city: store?.city ?? null,
        totalCounts: s._count,
        totalShrinkageValue: s._sum.totalValue ?? 0,
        avgShrinkageValue: s._avg.totalValue ?? 0,
        totalItemsCounted: counted,
        totalDiscrepancies: disc,
        discrepancyRate: counted > 0 ? Math.round((disc / counted) * 10000) / 100 : 0,
        accuracy: counted > 0 ? Math.round(((counted - disc) / counted) * 10000) / 100 : 100,
      };
    }).sort((a, b) => b.accuracy - a.accuracy);

    res.json(comparison);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
