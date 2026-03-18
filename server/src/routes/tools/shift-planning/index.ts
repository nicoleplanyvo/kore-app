import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  shiftEntryCreateSchema,
  shiftEntryUpdateSchema,
  shiftSwapRequestSchema,
  shiftAvailabilitySchema,
  shiftClockSchema,
} from '@shared/validators';

export const shiftPlanningRouter: RouterType = Router();
shiftPlanningRouter.use(authenticate, requireToolAccess('coaching.shift_planning'));

// ── GET /templates ───────────────────────────────────
shiftPlanningRouter.get('/templates', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    const templates = await prisma.shiftTemplate.findMany({
      where,
      include: { store: { select: { id: true, name: true } } },
      orderBy: [{ storeId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json(templates);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /templates ──────────────────────────────────
shiftPlanningRouter.post('/templates', async (req, res) => {
  try {
    const { storeId, name, dayOfWeek, startTime, endTime, minStaff, role } = req.body;
    if (!storeId || !name || dayOfWeek == null || !startTime || !endTime) {
      return res.status(400).json({ error: 'storeId, name, dayOfWeek, startTime und endTime sind erforderlich.' });
    }
    const template = await prisma.shiftTemplate.create({
      data: { storeId, name, dayOfWeek, startTime, endTime, minStaff: minStaff ?? 1, role },
      include: { store: { select: { id: true, name: true } } },
    });
    res.status(201).json(template);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── DELETE /templates/:id ────────────────────────────
shiftPlanningRouter.delete('/templates/:id', async (req, res) => {
  try {
    await prisma.shiftTemplate.delete({ where: { id: req.params['id'] } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /stores ──────────────────────────────────────
shiftPlanningRouter.get('/stores', async (req, res) => {
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

// ── GET /users ───────────────────────────────────────
shiftPlanningRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const storeId = req.query.storeId as string | undefined;
    let userIds: string[] | undefined;
    if (storeId) {
      const assignments = await prisma.userStoreAssignment.findMany({ where: { storeId }, select: { userId: true } });
      userIds = assignments.map((a) => a.userId);
    }
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (userIds) where['id'] = { in: userIds };
    const users = await prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true }, orderBy: { name: 'asc' } });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /shifts ──────────────────────────────────────
shiftPlanningRouter.get('/shifts', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.weekStart && req.query.weekEnd) {
      where['date'] = { gte: new Date(req.query.weekStart as string), lte: new Date(req.query.weekEnd as string) };
    }
    if (req.query.userId) where['userId'] = req.query.userId;
    const shifts = await prisma.shiftEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        store: { select: { id: true, name: true } },
        swaps: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    res.json(shifts);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /shifts ─────────────────────────────────────
shiftPlanningRouter.post('/shifts', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = shiftEntryCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const shift = await prisma.shiftEntry.create({
      data: { ...parsed.data, date: new Date(parsed.data.date), createdBy: userId },
      include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
    });
    res.status(201).json(shift);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /shifts/:id ──────────────────────────────────
shiftPlanningRouter.put('/shifts/:id', async (req, res) => {
  try {
    const parsed = shiftEntryUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.' });
    const shift = await prisma.shiftEntry.update({
      where: { id: req.params['id'] },
      data: parsed.data,
      include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
    });
    res.json(shift);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── DELETE /shifts/:id ───────────────────────────────
shiftPlanningRouter.delete('/shifts/:id', async (req, res) => {
  try {
    await prisma.shiftSwapRequest.deleteMany({ where: { shiftEntryId: req.params['id'] } });
    await prisma.shiftEntry.delete({ where: { id: req.params['id'] } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /shifts/publish ─────────────────────────────
shiftPlanningRouter.post('/shifts/publish', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { storeId, weekStart } = req.body;
    if (!storeId || !weekStart) return res.status(400).json({ error: 'storeId und weekStart erforderlich.' });
    const ws = new Date(weekStart);
    const result = await prisma.shiftWeekStatus.upsert({
      where: { storeId_weekStart: { storeId, weekStart: ws } },
      update: { status: 'PUBLISHED', publishedBy: userId, publishedAt: new Date() },
      create: { storeId, weekStart: ws, status: 'PUBLISHED', publishedBy: userId, publishedAt: new Date() },
    });
    // Mark all PLANNED shifts in that week as CONFIRMED
    const weekEnd = new Date(ws);
    weekEnd.setDate(weekEnd.getDate() + 6);
    await prisma.shiftEntry.updateMany({
      where: { storeId, date: { gte: ws, lte: weekEnd }, status: 'PLANNED' },
      data: { status: 'CONFIRMED' },
    });
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /availability ────────────────────────────────
shiftPlanningRouter.get('/availability', async (req, res) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (req.query.userId) where['userId'] = req.query.userId;
    if (req.query.from && req.query.to) {
      where['date'] = { gte: new Date(req.query.from as string), lte: new Date(req.query.to as string) };
    }
    const avail = await prisma.shiftAvailability.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ date: 'asc' }],
    });
    res.json(avail);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /availability ────────────────────────────────
shiftPlanningRouter.put('/availability', async (req, res) => {
  try {
    const parsed = shiftAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const d = new Date(parsed.data.date);
    const result = await prisma.shiftAvailability.upsert({
      where: { storeId_userId_date: { storeId: parsed.data.storeId, userId: parsed.data.userId, date: d } },
      update: { type: parsed.data.type, wishStart: parsed.data.wishStart, wishEnd: parsed.data.wishEnd, note: parsed.data.note },
      create: { ...parsed.data, date: d },
    });
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /swap-requests ──────────────────────────────
shiftPlanningRouter.post('/swap-requests', async (req, res) => {
  try {
    const requestedBy = req.user!.sub;
    const { shiftEntryId, swapWithUserId, reason } = req.body;
    if (!shiftEntryId) return res.status(400).json({ error: 'shiftEntryId erforderlich.' });
    const swap = await prisma.shiftSwapRequest.create({
      data: { shiftEntryId, requestedBy, swapWithUserId, },
      include: { shiftEntry: { include: { user: { select: { id: true, name: true } } } }, requester: { select: { id: true, name: true } } },
    });
    res.status(201).json(swap);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /swap-requests/:id ───────────────────────────
shiftPlanningRouter.put('/swap-requests/:id', async (req, res) => {
  try {
    const approvedBy = req.user!.sub;
    const status = req.body.status as string;
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Status muss APPROVED oder REJECTED sein.' });
    const swap = await prisma.shiftSwapRequest.update({
      where: { id: req.params['id'] },
      data: { status, approvedBy },
      include: { shiftEntry: true },
    });
    if (status === 'APPROVED' && swap.swapWithUserId) {
      await prisma.shiftEntry.update({ where: { id: swap.shiftEntryId }, data: { userId: swap.swapWithUserId, status: 'SWAPPED' } });
    } else if (status === 'APPROVED') {
      await prisma.shiftEntry.update({ where: { id: swap.shiftEntryId }, data: { status: 'SWAPPED' } });
    }
    res.json(swap);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /clock ──────────────────────────────────────
shiftPlanningRouter.post('/clock', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = shiftClockSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const { storeId, action, note } = parsed.data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Get or create today's time entry
    let entry = await prisma.shiftTimeEntry.findUnique({
      where: { storeId_userId_date: { storeId, userId, date: today } },
    });

    if (action === 'CLOCK_IN') {
      if (entry && entry.status === 'CLOCKED_IN') return res.status(400).json({ error: 'Bereits eingestempelt.' });
      if (!entry) {
        entry = await prisma.shiftTimeEntry.create({ data: { storeId, userId, date: today, clockIn: now, status: 'CLOCKED_IN', note } });
      } else {
        entry = await prisma.shiftTimeEntry.update({ where: { id: entry.id }, data: { clockIn: now, status: 'CLOCKED_IN', note } });
      }
    } else if (action === 'CLOCK_OUT') {
      if (!entry || entry.status === 'DONE') return res.status(400).json({ error: 'Nicht eingestempelt.' });
      entry = await prisma.shiftTimeEntry.update({ where: { id: entry.id }, data: { clockOut: now, status: 'DONE', note } });
    } else if (action === 'PAUSE_START') {
      if (!entry || entry.status !== 'CLOCKED_IN') return res.status(400).json({ error: 'Nicht eingestempelt.' });
      entry = await prisma.shiftTimeEntry.update({ where: { id: entry.id }, data: { status: 'PAUSED' } });
    } else if (action === 'PAUSE_END') {
      if (!entry || entry.status !== 'PAUSED') return res.status(400).json({ error: 'Keine aktive Pause.' });
      // Add pause duration (simplified: add 15 min per pause end)
      entry = await prisma.shiftTimeEntry.update({ where: { id: entry.id }, data: { pauseMin: entry.pauseMin + 15, status: 'CLOCKED_IN' } });
    }

    res.json(entry);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /time-entries ────────────────────────────────
shiftPlanningRouter.get('/time-entries', async (req, res) => {
  try {
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (req.query.userId) where['userId'] = req.query.userId;
    if (req.query.from && req.query.to) {
      where['date'] = { gte: new Date(req.query.from as string), lte: new Date(req.query.to as string) };
    }
    const entries = await prisma.shiftTimeEntry.findMany({
      where,
      include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
      orderBy: [{ date: 'desc' }],
    });

    // Calculate worked hours and saldo per entry
    const enriched = entries.map((e) => {
      let workedMin = 0;
      if (e.clockIn && e.clockOut) {
        workedMin = Math.round((e.clockOut.getTime() - e.clockIn.getTime()) / 60000) - e.pauseMin;
      } else if (e.clockIn && e.status === 'CLOCKED_IN') {
        workedMin = Math.round((Date.now() - e.clockIn.getTime()) / 60000) - e.pauseMin;
      }
      return { ...e, workedMin: Math.max(0, workedMin), workedHours: +(Math.max(0, workedMin) / 60).toFixed(2) };
    });

    // Saldo: sum of worked hours per user
    const userSaldo: Record<string, { userId: string; userName: string; totalMin: number; entries: number }> = {};
    for (const e of enriched) {
      if (!userSaldo[e.userId]) userSaldo[e.userId] = { userId: e.userId, userName: e.user?.name ?? '', totalMin: 0, entries: 0 };
      userSaldo[e.userId]!.totalMin += e.workedMin;
      userSaldo[e.userId]!.entries += 1;
    }

    res.json({ entries: enriched, saldo: Object.values(userSaldo) });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /dashboard ───────────────────────────────────
shiftPlanningRouter.get('/dashboard', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (req.query.storeId) storeWhere['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') storeWhere['storeId'] = { in: toolStoreIds };

    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // This week's shifts
    const shifts = await prisma.shiftEntry.findMany({
      where: { ...storeWhere, date: { gte: weekStart, lte: weekEnd } },
      include: { user: { select: { id: true, name: true } } },
    });

    // Time entries this week
    const timeEntries = await prisma.shiftTimeEntry.findMany({
      where: { ...storeWhere, date: { gte: weekStart, lte: weekEnd } },
      include: { user: { select: { id: true, name: true } } },
    });

    // Pending swaps
    const pendingSwaps = await prisma.shiftSwapRequest.count({
      where: { shiftEntry: { ...storeWhere }, status: 'PENDING' },
    });

    // Hours per employee this week
    const employeeHours: Record<string, { name: string; plannedMin: number; workedMin: number }> = {};
    for (const s of shifts) {
      const uid = s.userId;
      if (!employeeHours[uid]) employeeHours[uid] = { name: s.user?.name ?? '', plannedMin: 0, workedMin: 0 };
      const parts = s.startTime.split(':').map(Number);
      const eParts = s.endTime.split(':').map(Number);
      const sh = parts[0] ?? 0; const sm = parts[1] ?? 0;
      const eh = eParts[0] ?? 0; const em = eParts[1] ?? 0;
      employeeHours[uid]!.plannedMin += (eh * 60 + em) - (sh * 60 + sm);
    }
    for (const te of timeEntries) {
      const uid = te.userId;
      if (!employeeHours[uid]) employeeHours[uid] = { name: te.user?.name ?? '', plannedMin: 0, workedMin: 0 };
      if (te.clockIn && te.clockOut) {
        employeeHours[uid]!.workedMin += Math.round((te.clockOut.getTime() - te.clockIn.getTime()) / 60000) - te.pauseMin;
      }
    }

    // Coverage: shifts per day
    const shiftsByDay: Record<string, number> = {};
    for (const s of shifts) {
      const d = s.date.toISOString().split('T')[0]!;
      shiftsByDay[d] = (shiftsByDay[d] ?? 0) + 1;
    }

    res.json({
      totalShiftsThisWeek: shifts.length,
      pendingSwaps,
      employeeHours: Object.entries(employeeHours).map(([userId, data]) => ({
        userId,
        ...data,
        plannedHours: +(data.plannedMin / 60).toFixed(1),
        workedHours: +(Math.max(0, data.workedMin) / 60).toFixed(1),
        overtimeMin: Math.max(0, data.workedMin - data.plannedMin),
      })),
      shiftsByDay,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
