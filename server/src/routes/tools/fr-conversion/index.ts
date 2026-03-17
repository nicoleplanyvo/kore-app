import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  frSettingsSchema,
  frRoomCreateSchema,
  frCheckInSchema,
  frCheckOutSchema,
  frAddItemsSchema,
} from '@shared/validators';

export const frConversionRouter: RouterType = Router();
frConversionRouter.use(authenticate, requireToolAccess('customer.fr_conversion'));

// ── SETTINGS ─────────────────────────────────────────

// GET /settings?storeId=
frConversionRouter.get('/settings', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = (req.query.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId erforderlich.' });

    let settings = await prisma.fRSettings.findUnique({ where: { storeId } });
    if (!settings) {
      settings = await prisma.fRSettings.create({ data: { storeId, maxItems: 8, warningMinutes: 15, alertMinutes: 20 } });
    }
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /settings
frConversionRouter.put('/settings', async (req, res) => {
  try {
    const parsed = frSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId erforderlich.' });

    const settings = await prisma.fRSettings.upsert({
      where: { storeId },
      create: { storeId, ...parsed.data },
      update: parsed.data,
    });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── ROOMS ────────────────────────────────────────────

// GET /rooms?storeId=
frConversionRouter.get('/rooms', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = (req.query.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId erforderlich.' });

    const rooms = await prisma.fRRoom.findMany({
      where: { storeId, status: 'active' },
      orderBy: { number: 'asc' },
    });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /rooms — Create room
frConversionRouter.post('/rooms', async (req, res) => {
  try {
    const parsed = frRoomCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId erforderlich.' });

    const room = await prisma.fRRoom.create({
      data: { storeId, number: parsed.data.number, name: parsed.data.name || null },
    });
    res.json(room);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Raum-Nummer existiert bereits.' });
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /rooms/:id — Soft-delete room
frConversionRouter.delete('/rooms/:id', async (req, res) => {
  try {
    const room = await prisma.fRRoom.update({
      where: { id: req.params.id },
      data: { status: 'deleted' },
    });
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── SESSIONS ─────────────────────────────────────────

// GET /sessions?storeId=&status=active|completed
frConversionRouter.get('/sessions', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = (req.query.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId erforderlich.' });

    const where: Record<string, unknown> = { storeId };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.from) where['checkInAt'] = { ...(where['checkInAt'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['checkInAt'] = { ...(where['checkInAt'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const sessions = await prisma.fRSession.findMany({
      where,
      include: {
        room: { select: { id: true, number: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
      orderBy: { checkInAt: 'desc' },
      take: req.query.limit ? parseInt(req.query.limit as string) : 1000,
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /sessions/active?storeId= — Only active sessions
frConversionRouter.get('/sessions/active', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = (req.query.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId erforderlich.' });

    const sessions = await prisma.fRSession.findMany({
      where: { storeId, status: 'active' },
      include: {
        room: { select: { id: true, number: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
      orderBy: { checkInAt: 'asc' },
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /sessions/check-in — Check-In
frConversionRouter.post('/sessions/check-in', async (req, res) => {
  try {
    const parsed = frCheckInSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId erforderlich.' });

    // Check room isn't already occupied
    const existing = await prisma.fRSession.findFirst({
      where: { roomId: parsed.data.roomId, status: 'active' },
    });
    if (existing) return res.status(409).json({ error: 'Raum ist bereits belegt.' });

    const session = await prisma.fRSession.create({
      data: {
        storeId,
        roomId: parsed.data.roomId,
        staffId: parsed.data.staffId || null,
        itemsIn: parsed.data.itemsIn,
        notes: parsed.data.notes || null,
        checkedInBy: req.user!.sub,
        status: 'active',
      },
      include: {
        room: { select: { id: true, number: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /sessions/:id/check-out — Check-Out
frConversionRouter.put('/sessions/:id/check-out', async (req, res) => {
  try {
    const parsed = frCheckOutSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const session = await prisma.fRSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ error: 'Session nicht gefunden.' });
    if (session.status !== 'active') return res.status(400).json({ error: 'Session ist nicht aktiv.' });

    const shrinkage = session.itemsIn - parsed.data.itemsReturned - parsed.data.itemsPurchased;
    const conversionRate = session.itemsIn > 0 ? Math.round((parsed.data.itemsPurchased / session.itemsIn) * 100) : 0;

    const updated = await prisma.fRSession.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        checkOutAt: new Date(),
        itemsReturned: parsed.data.itemsReturned,
        itemsPurchased: parsed.data.itemsPurchased,
        itemsShrinkage: shrinkage,
        conversionRate,
      },
      include: {
        room: { select: { id: true, number: true, name: true } },
        staff: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /sessions/:id/add-items — Add items to active session
frConversionRouter.put('/sessions/:id/add-items', async (req, res) => {
  try {
    const parsed = frAddItemsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const session = await prisma.fRSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ error: 'Session nicht gefunden.' });
    if (session.status !== 'active') return res.status(400).json({ error: 'Session ist nicht aktiv.' });

    const updated = await prisma.fRSession.update({
      where: { id: req.params.id },
      data: { itemsIn: session.itemsIn + parsed.data.additionalItems },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /sessions/:id/change-staff — Change staff assignment
frConversionRouter.put('/sessions/:id/change-staff', async (req, res) => {
  try {
    const session = await prisma.fRSession.update({
      where: { id: req.params.id },
      data: { staffId: req.body.staffId || null },
    });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /sessions/:id/cancel — Cancel session
frConversionRouter.put('/sessions/:id/cancel', async (req, res) => {
  try {
    const session = await prisma.fRSession.update({
      where: { id: req.params.id },
      data: { status: 'canceled' },
    });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DASHBOARD / REPORTS ──────────────────────────────

// GET /dashboard?storeId=&from=&to= — KPIs + stats
frConversionRouter.get('/dashboard', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = (req.query.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId erforderlich.' });

    const where: Record<string, unknown> = { storeId, status: 'completed' };
    if (req.query.from) where['checkInAt'] = { ...(where['checkInAt'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['checkInAt'] = { ...(where['checkInAt'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const sessions = await prisma.fRSession.findMany({
      where,
      include: { staff: { select: { id: true, name: true } } },
      orderBy: { checkInAt: 'asc' },
    });

    const total = sessions.length;
    const avgConversion = total > 0 ? Math.round(sessions.reduce((s, x) => s + (x.conversionRate || 0), 0) / total) : 0;
    const avgDuration = total > 0 ? Math.round(sessions.reduce((s, x) => {
      if (!x.checkOutAt) return s;
      return s + (new Date(x.checkOutAt).getTime() - new Date(x.checkInAt).getTime()) / 60000;
    }, 0) / total) : 0;
    const totalSold = sessions.reduce((s, x) => s + (x.itemsPurchased || 0), 0);
    const totalShrinkage = sessions.reduce((s, x) => s + (x.itemsShrinkage || 0), 0);
    const noSales = sessions.filter(x => (x.itemsPurchased || 0) === 0).length;
    const avgSoldPerSession = total > 0 ? Math.round((totalSold / total) * 10) / 10 : 0;

    // Peak hours (group by hour)
    const hourCounts: number[] = new Array(24).fill(0) as number[];
    sessions.forEach(s => {
      const hr = new Date(s.checkInAt).getHours();
      hourCounts[hr] = (hourCounts[hr] ?? 0) + 1;
    });

    // Staff performance
    const staffMap = new Map<string, { id: string; name: string; sessions: number; totalConv: number; totalPurchased: number; totalShrinkage: number }>();
    sessions.forEach(s => {
      if (!s.staffId || !s.staff) return;
      const existing = staffMap.get(s.staffId) || { id: s.staffId, name: s.staff.name, sessions: 0, totalConv: 0, totalPurchased: 0, totalShrinkage: 0 };
      existing.sessions++;
      existing.totalConv += s.conversionRate || 0;
      existing.totalPurchased += s.itemsPurchased || 0;
      existing.totalShrinkage += s.itemsShrinkage || 0;
      staffMap.set(s.staffId, existing);
    });

    const staffPerformance = Array.from(staffMap.values())
      .map(st => ({ ...st, avgConversion: st.sessions > 0 ? Math.round(st.totalConv / st.sessions) : 0 }))
      .sort((a, b) => b.avgConversion - a.avgConversion);

    // Trend data (group by date)
    const dateMap = new Map<string, { sessions: number; totalConv: number }>();
    sessions.forEach(s => {
      const dateStr = new Date(s.checkInAt).toISOString().split('T')[0] as string;
      const existing = dateMap.get(dateStr) ?? { sessions: 0, totalConv: 0 };
      existing.sessions++;
      existing.totalConv += s.conversionRate || 0;
      dateMap.set(dateStr, existing);
    });

    const trends = Array.from(dateMap.entries())
      .map(([date, d]) => ({ date, sessions: d.sessions, avgConversion: d.sessions > 0 ? Math.round(d.totalConv / d.sessions) : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      kpis: { total, avgConversion, avgDuration, totalSold, avgSoldPerSession, noSales, totalShrinkage },
      peakHours: hourCounts,
      staffPerformance,
      trends,
      sessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /stores — List stores for selector
frConversionRouter.get('/stores', async (req, res) => {
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

// GET /users — List users for staff selector
frConversionRouter.get('/users', async (req, res) => {
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
