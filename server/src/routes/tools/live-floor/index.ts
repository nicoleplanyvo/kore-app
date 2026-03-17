import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  floorZoneCreateSchema,
  floorZoneUpdateSchema,
  floorPositionCreateSchema,
  floorPositionUpdateSchema,
  floorFrequencyUpdateSchema,
  floorBulkAssignSchema,
} from '@shared/validators';

export const liveFloorRouter: RouterType = Router();
liveFloorRouter.use(authenticate, requireToolAccess('floor.live_floor'));

// ── GET /stores ──────────────────────────────────────
liveFloorRouter.get('/stores', async (req, res) => {
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

// ── GET /users — Mitarbeiter fuer Zuweisung ──────────
liveFloorRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (req.query.storeId) {
      where['storeAssignments'] = { some: { storeId: req.query.storeId } };
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /zones — Alle Zonen eines Stores ─────────────
liveFloorRouter.get('/zones', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (tenantId) where['tenantId'] = tenantId;
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.active !== 'all') where['isActive'] = true;

    const zones = await prisma.floorZone.findMany({
      where,
      include: {
        store: { select: { id: true, name: true } },
        _count: { select: { positions: { where: { endedAt: null } } } },
      },
      orderBy: [{ storeId: 'asc' }, { sortOrder: 'asc' }],
    });
    res.json(zones);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /zones — Neue Zone erstellen ────────────────
liveFloorRouter.post('/zones', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = floorZoneCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const zone = await prisma.floorZone.create({ data: { ...parsed.data, tenantId } });
    res.status(201).json(zone);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /zones/:id — Zone aktualisieren ──────────────
liveFloorRouter.put('/zones/:id', async (req, res) => {
  try {
    const parsed = floorZoneUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const zone = await prisma.floorZone.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(zone);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── DELETE /zones/:id — Zone loeschen ────────────────
liveFloorRouter.delete('/zones/:id', async (req, res) => {
  try {
    // Soft delete — deactivate instead of hard delete
    const zone = await prisma.floorZone.update({
      where: { id: req.params['id'] },
      data: { isActive: false },
    });
    res.json(zone);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /assignments — Aktuelle Zuweisungen (aktive Positionen) ──
liveFloorRouter.get('/assignments', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { endedAt: null };
    if (tenantId) where['tenantId'] = tenantId;
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const positions = await prisma.floorStaffPosition.findMany({
      where,
      include: {
        zone: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
    res.json(positions);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /assignments — Bulk-Zuweisung: MA zu Zonen ───
liveFloorRouter.put('/assignments', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string ?? req.user!.sub;
    const parsed = floorBulkAssignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const { assignments, storeId } = parsed.data;
    const results = [];

    for (const a of assignments) {
      // Beende vorherige offene Position
      await prisma.floorStaffPosition.updateMany({
        where: { userId: a.userId, storeId, endedAt: null },
        data: { endedAt: new Date() },
      });

      // Erstelle neue Position
      const pos = await prisma.floorStaffPosition.create({
        data: {
          tenantId,
          storeId,
          zoneId: a.zoneId,
          userId: a.userId,
          userName: a.userName,
          status: a.status,
          updatedBy: userId,
        },
        include: { zone: { select: { id: true, name: true } } },
      });
      results.push(pos);
    }
    res.json(results);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /zones/:id/frequency — Kundenfrequenz aktualisieren ──
liveFloorRouter.post('/zones/:id/frequency', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string ?? req.user!.sub;
    const parsed = floorFrequencyUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.' });

    const zone = await prisma.floorZone.update({
      where: { id: req.params['id'] },
      data: { customerCount: parsed.data.customerCount },
    });

    // Aktive Mitarbeiter in dieser Zone zaehlen
    const staffCount = await prisma.floorStaffPosition.count({
      where: { zoneId: req.params['id'], endedAt: null, status: 'ON_FLOOR' },
    });

    // Frequenz-Log speichern
    const now = new Date();
    await prisma.floorFrequencyLog.create({
      data: {
        tenantId,
        storeId: zone.storeId,
        zoneId: zone.id,
        customerCount: parsed.data.customerCount,
        staffCount,
        hour: now.getHours(),
        date: now.toISOString().slice(0, 10),
        recordedBy: userId,
      },
    });

    res.json({ ...zone, staffCount });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /recommendations — Empfehlungen bei Unterbesetzung ──
liveFloorRouter.get('/recommendations', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const zoneWhere: Record<string, unknown> = { tenantId, isActive: true };
    if (req.query.storeId) zoneWhere['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') zoneWhere['storeId'] = { in: toolStoreIds };

    const zones = await prisma.floorZone.findMany({
      where: zoneWhere,
      include: {
        store: { select: { id: true, name: true } },
        positions: { where: { endedAt: null, status: 'ON_FLOOR' }, select: { id: true } },
      },
    });

    const recommendations = zones
      .map((z) => {
        const staffCount = z.positions.length;
        const customerCount = z.customerCount;
        const ratio = staffCount > 0 ? customerCount / staffCount : customerCount > 0 ? Infinity : 0;
        const idealStaff = Math.max(z.minStaff, Math.ceil(customerCount / 5)); // 1 MA pro 5 Kunden als Richtwert
        const deficit = idealStaff - staffCount;

        let status: 'OK' | 'ACHTUNG' | 'UNTERBESETZT' = 'OK';
        if (staffCount < z.minStaff || deficit >= 2) status = 'UNTERBESETZT';
        else if (deficit >= 1) status = 'ACHTUNG';

        return {
          zoneId: z.id,
          zoneName: z.name,
          storeId: z.storeId,
          storeName: z.store?.name,
          staffCount,
          customerCount,
          minStaff: z.minStaff,
          maxStaff: z.maxStaff,
          idealStaff,
          deficit: Math.max(0, deficit),
          ratio: Math.round(ratio * 10) / 10,
          status,
        };
      })
      .filter((r) => r.status !== 'OK')
      .sort((a, b) => b.deficit - a.deficit);

    res.json(recommendations);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /dashboard — Auslastung, Trends, Peaks ──────
liveFloorRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = req.query.storeId as string | undefined;
    const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffDate = cutoff.toISOString().slice(0, 10);

    const logWhere: Record<string, unknown> = { tenantId, date: { gte: cutoffDate } };
    if (storeId) logWhere['storeId'] = storeId;
    else if (toolStoreIds !== 'all') logWhere['storeId'] = { in: toolStoreIds };

    const logs = await prisma.floorFrequencyLog.findMany({
      where: logWhere,
      include: { zone: { select: { id: true, name: true } } },
      orderBy: [{ date: 'asc' }, { hour: 'asc' }],
    });

    // Aktuelle Live-Statistik
    const zoneWhere: Record<string, unknown> = { tenantId, isActive: true };
    if (storeId) zoneWhere['storeId'] = storeId;
    else if (toolStoreIds !== 'all') zoneWhere['storeId'] = { in: toolStoreIds };

    const zones = await prisma.floorZone.findMany({
      where: zoneWhere,
      include: { positions: { where: { endedAt: null }, select: { id: true, status: true } } },
    });

    const totalStaff = zones.reduce((s, z) => s + z.positions.length, 0);
    const totalCustomers = zones.reduce((s, z) => s + z.customerCount, 0);
    const activeZones = zones.filter((z) => z.positions.length > 0).length;

    // Stundenaggregation fuer Peak-Analyse
    const hourlyMap: Record<number, { customers: number; staff: number; count: number }> = {};
    for (const l of logs) {
      if (!hourlyMap[l.hour]) hourlyMap[l.hour] = { customers: 0, staff: 0, count: 0 };
      const hEntry = hourlyMap[l.hour]!;
      hEntry.customers += l.customerCount;
      hEntry.staff += l.staffCount;
      hEntry.count += 1;
    }

    const peakHours = Object.entries(hourlyMap)
      .map(([h, v]) => ({
        hour: Number(h),
        avgCustomers: Math.round(v.customers / v.count),
        avgStaff: Math.round((v.staff / v.count) * 10) / 10,
        entries: v.count,
      }))
      .sort((a, b) => b.avgCustomers - a.avgCustomers);

    // Tagesaggregation fuer Trend
    const dailyMap: Record<string, { customers: number; staff: number; count: number }> = {};
    for (const l of logs) {
      if (!dailyMap[l.date]) dailyMap[l.date] = { customers: 0, staff: 0, count: 0 };
      const dEntry = dailyMap[l.date]!;
      dEntry.customers += l.customerCount;
      dEntry.staff += l.staffCount;
      dEntry.count += 1;
    }

    const dailyTrend = Object.entries(dailyMap)
      .map(([date, v]) => ({
        date,
        avgCustomers: Math.round(v.customers / v.count),
        avgStaff: Math.round((v.staff / v.count) * 10) / 10,
        entries: v.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Zone-Auslastung
    const zoneUtilization = zones.map((z) => {
      const staffCount = z.positions.filter((p) => p.status === 'ON_FLOOR').length;
      const utilization = z.maxStaff > 0 ? Math.round((staffCount / z.maxStaff) * 100) : 0;
      return {
        zoneId: z.id,
        zoneName: z.name,
        staffCount,
        customerCount: z.customerCount,
        minStaff: z.minStaff,
        maxStaff: z.maxStaff,
        utilization,
      };
    });

    res.json({
      live: { totalStaff, totalCustomers, activeZones, totalZones: zones.length },
      peakHours,
      dailyTrend,
      zoneUtilization,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── Legacy: GET /positions ───────────────────────────
liveFloorRouter.get('/positions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { endedAt: null };
    if (tenantId) where['tenantId'] = tenantId;
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;

    const positions = await prisma.floorStaffPosition.findMany({
      where,
      include: { zone: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
      orderBy: { startedAt: 'desc' },
    });
    res.json(positions);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /positions ──────────────────────────────────
liveFloorRouter.post('/positions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string ?? req.user!.sub;
    const parsed = floorPositionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    await prisma.floorStaffPosition.updateMany({
      where: { userId: parsed.data.userId, storeId: parsed.data.storeId, endedAt: null },
      data: { endedAt: new Date() },
    });

    const position = await prisma.floorStaffPosition.create({
      data: {
        tenantId,
        storeId: parsed.data.storeId,
        zoneId: parsed.data.zoneId ?? null,
        userId: parsed.data.userId,
        userName: parsed.data.userName,
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        updatedBy: userId,
      },
      include: { zone: { select: { id: true, name: true } } },
    });
    res.status(201).json(position);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /positions/:id ───────────────────────────────
liveFloorRouter.put('/positions/:id', async (req, res) => {
  try {
    const userId = (req as any).userId as string ?? req.user!.sub;
    const parsed = floorPositionUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const data: Record<string, unknown> = { ...parsed.data, updatedBy: userId };
    if (parsed.data.endedAt) data['endedAt'] = new Date(parsed.data.endedAt);
    const position = await prisma.floorStaffPosition.update({
      where: { id: req.params['id'] },
      data,
      include: { zone: { select: { id: true, name: true } } },
    });
    res.json(position);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /snapshot — Zusammenfassung pro Store ────────
liveFloorRouter.get('/snapshot', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (tenantId) storeWhere['tenantId'] = tenantId;
    if (req.query.storeId) storeWhere['id'] = req.query.storeId;
    else if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: { ...storeWhere, isActive: true },
      select: { id: true, name: true, city: true },
    });

    const snapshots = await Promise.all(stores.map(async (store) => {
      const [zones, positions] = await Promise.all([
        prisma.floorZone.findMany({ where: { storeId: store.id, isActive: true }, orderBy: { sortOrder: 'asc' } }),
        prisma.floorStaffPosition.findMany({ where: { storeId: store.id, endedAt: null } }),
      ]);
      const statusCounts: Record<string, number> = {};
      for (const p of positions) {
        statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
      }
      const totalCustomers = zones.reduce((s, z) => s + z.customerCount, 0);
      return { store, zones: zones.length, activePositions: positions.length, statusCounts, totalCustomers };
    }));

    res.json(snapshots);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
