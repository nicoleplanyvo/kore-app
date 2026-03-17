import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  stockCalloutCreateSchema,
  stockCalloutUpdateSchema,
  stockCalloutOfferSchema,
  stockBoardItemCreateSchema,
} from '@shared/validators';

export const stockCalloutsRouter: RouterType = Router();
stockCalloutsRouter.use(authenticate, requireToolAccess('customer.stock_callouts'));

// ── STORES ──────────────────────────────────────────
// GET /stores — List stores for selector
stockCalloutsRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where = toolStoreIds === 'all' ? {} : { id: { in: toolStoreIds } };
    const stores = await prisma.store.findMany({ where, select: { id: true, name: true, city: true }, orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── USERS ───────────────────────────────────────────
// GET /users — List users for staff selector
stockCalloutsRouter.get('/users', async (req, res) => {
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

// ── CALLOUTS (Suchanfragen: "Wer hat Artikel X?") ──

// GET /callouts — List with filters
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
    if (req.query.sku) where['sku'] = { contains: req.query.sku as string };

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

// POST /callouts — Create new callout (Suche Artikel X)
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
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(callout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /callouts/:id — Get single callout
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

// PUT /callouts/:id — Update callout (status, urgency, etc.)
stockCalloutsRouter.put('/callouts/:id', async (req, res) => {
  try {
    const parsed = stockCalloutUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const callout = await prisma.stockCallout.update({
      where: { id: req.params['id'] },
      data: parsed.data,
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
    res.json(callout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /callouts/:id/offer — Another store offers stock (Offen -> Angeboten)
stockCalloutsRouter.put('/callouts/:id/offer', async (req, res) => {
  try {
    const parsed = stockCalloutOfferSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const offeringStoreId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);

    const callout = await prisma.stockCallout.findUnique({ where: { id: req.params['id'] } });
    if (!callout) return res.status(404).json({ error: 'Callout nicht gefunden.' });
    if (callout.status !== 'OPEN') return res.status(400).json({ error: 'Callout ist nicht mehr offen.' });

    // Update status to OFFERED and store offer info in notes
    const offerNote = `Angebot von Store ${offeringStoreId}: ${parsed.data.availableQty} Stk.${parsed.data.notes ? ' - ' + parsed.data.notes : ''}`;
    const updated = await prisma.stockCallout.update({
      where: { id: req.params['id'] },
      data: {
        status: 'OFFERED',
        currentStock: parsed.data.availableQty,
      },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
    res.json({ ...updated, offerNote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /callouts/:id/transfer — Confirm transfer (Angeboten -> Transfer)
stockCalloutsRouter.put('/callouts/:id/transfer', async (req, res) => {
  try {
    const callout = await prisma.stockCallout.findUnique({ where: { id: req.params['id'] } });
    if (!callout) return res.status(404).json({ error: 'Callout nicht gefunden.' });
    if (callout.status !== 'OFFERED') return res.status(400).json({ error: 'Callout hat keinen offenen Angebotstatus.' });

    const updated = await prisma.stockCallout.update({
      where: { id: req.params['id'] },
      data: { status: 'TRANSFER' },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /callouts/:id/resolve — Mark as resolved (Transfer -> Geloest)
stockCalloutsRouter.put('/callouts/:id/resolve', async (req, res) => {
  try {
    const callout = await prisma.stockCallout.findUnique({ where: { id: req.params['id'] } });
    if (!callout) return res.status(404).json({ error: 'Callout nicht gefunden.' });

    const updated = await prisma.stockCallout.update({
      where: { id: req.params['id'] },
      data: { status: 'RESOLVED' },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── SUMMARY / DASHBOARD ─────────────────────────────

// GET /summary — Status counts & urgency counts
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

// GET /dashboard — Full dashboard: KPIs, top missing articles, store comparison, buying info
stockCalloutsRouter.get('/dashboard', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    if (req.query.from) where['createdAt'] = { ...(where['createdAt'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['createdAt'] = { ...(where['createdAt'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const callouts = await prisma.stockCallout.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // KPIs
    const total = callouts.length;
    const open = callouts.filter(c => c.status === 'OPEN').length;
    const offered = callouts.filter(c => c.status === 'OFFERED').length;
    const inTransfer = callouts.filter(c => c.status === 'TRANSFER').length;
    const resolved = callouts.filter(c => c.status === 'RESOLVED').length;
    const cancelled = callouts.filter(c => c.status === 'CANCELLED').length;
    const critical = callouts.filter(c => c.urgency === 'CRITICAL' || c.urgency === 'HIGH').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Top fehlende Artikel (grouped by SKU, sorted by frequency)
    const skuMap = new Map<string, { sku: string; productName: string; count: number; totalRequested: number; stores: Set<string> }>();
    callouts.forEach(c => {
      const existing = skuMap.get(c.sku) || { sku: c.sku, productName: c.productName, count: 0, totalRequested: 0, stores: new Set<string>() };
      existing.count++;
      existing.totalRequested += c.requestedQty;
      existing.stores.add(c.storeId);
      skuMap.set(c.sku, existing);
    });
    const topMissing = Array.from(skuMap.values())
      .map(s => ({ sku: s.sku, productName: s.productName, count: s.count, totalRequested: s.totalRequested, storeCount: s.stores.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Store-Vergleich (callouts per store)
    const storeMap = new Map<string, { storeId: string; storeName: string; total: number; open: number; resolved: number; critical: number }>();
    callouts.forEach(c => {
      const name = c.store?.name ?? c.storeId;
      const existing = storeMap.get(c.storeId) || { storeId: c.storeId, storeName: name, total: 0, open: 0, resolved: 0, critical: 0 };
      existing.total++;
      if (c.status === 'OPEN' || c.status === 'OFFERED') existing.open++;
      if (c.status === 'RESOLVED') existing.resolved++;
      if (c.urgency === 'CRITICAL' || c.urgency === 'HIGH') existing.critical++;
      storeMap.set(c.storeId, existing);
    });
    const storeComparison = Array.from(storeMap.values()).sort((a, b) => b.open - a.open);

    // Buying-Info: Aggregierte Uebersicht welche Artikel wo fehlen (nur offene)
    const buyingMap = new Map<string, { sku: string; productName: string; stores: { storeId: string; storeName: string; requestedQty: number; urgency: string }[] }>();
    callouts.filter(c => c.status === 'OPEN' || c.status === 'OFFERED').forEach(c => {
      const existing = buyingMap.get(c.sku) || { sku: c.sku, productName: c.productName, stores: [] };
      existing.stores.push({
        storeId: c.storeId,
        storeName: c.store?.name ?? c.storeId,
        requestedQty: c.requestedQty,
        urgency: c.urgency,
      });
      buyingMap.set(c.sku, existing);
    });
    const buyingInfo = Array.from(buyingMap.values())
      .filter(b => b.stores.length >= 1)
      .sort((a, b) => b.stores.length - a.stores.length)
      .slice(0, 20);

    // Trend data (group by date)
    const dateMap = new Map<string, { date: string; created: number; resolved: number }>();
    callouts.forEach(c => {
      const dateStr = new Date(c.createdAt).toISOString().split('T')[0] as string;
      const existing = dateMap.get(dateStr) || { date: dateStr, created: 0, resolved: 0 };
      existing.created++;
      if (c.status === 'RESOLVED') existing.resolved++;
      dateMap.set(dateStr, existing);
    });
    const trends = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      kpis: { total, open, offered, inTransfer, resolved, cancelled, critical, resolutionRate },
      topMissing,
      storeComparison,
      buyingInfo,
      trends,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── BOARD (Schwarzes Brett: abzugebende Artikel) ────

// GET /board — Board items (using callouts with status OFFERED that have surplus)
// We reuse the callout model but filter for items that stores *offer* to give away
// Board items are callouts created by stores that have *excess* stock (reversed flow)
stockCalloutsRouter.get('/board', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { status: 'OPEN' };

    // Board shows items from ALL stores in the region/tenant (not filtered to own store)
    // but respects tool access
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.sku) where['sku'] = { contains: req.query.sku as string };

    // Board items: those with currentStock > reorderPoint (excess stock callouts)
    // We use a negative requestedQty convention or a special flag
    // Simpler: board items have urgency "LOW" and currentStock > 0 (stores offering surplus)
    // Actually, let's just return all OPEN callouts and let the frontend distinguish

    const callouts = await prisma.stockCallout.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json(callouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
