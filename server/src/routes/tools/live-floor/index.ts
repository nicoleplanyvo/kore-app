import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  floorZoneCreateSchema,
  floorZoneUpdateSchema,
  floorPositionCreateSchema,
  floorPositionUpdateSchema,
} from '@shared/validators';

export const liveFloorRouter: RouterType = Router();
liveFloorRouter.use(authenticate, requireToolAccess('floor.live_floor'));

// GET /stores
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

// GET /zones — Alle Zonen eines Stores
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
      include: { store: { select: { id: true, name: true } }, _count: { select: { positions: true } } },
      orderBy: [{ storeId: 'asc' }, { sortOrder: 'asc' }],
    });
    res.json(zones);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /zones
liveFloorRouter.post('/zones', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = floorZoneCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const zone = await prisma.floorZone.create({ data: { ...parsed.data, tenantId } });
    res.status(201).json(zone);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /zones/:id
liveFloorRouter.put('/zones/:id', async (req, res) => {
  try {
    const parsed = floorZoneUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const zone = await prisma.floorZone.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(zone);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /positions — Aktuelle Positionen (nur ohne endedAt)
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

// POST /positions
liveFloorRouter.post('/positions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string ?? req.user!.sub;
    const parsed = floorPositionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    // Beende vorherige offene Position des Users
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

// PUT /positions/:id
liveFloorRouter.put('/positions/:id', async (req, res) => {
  try {
    const userId = (req as any).userId as string ?? req.user!.sub;
    const parsed = floorPositionUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
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

// GET /snapshot — Zusammenfassung pro Store (Zonen + aktive Positionen)
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
      return { store, zones: zones.length, activePositions: positions.length, statusCounts };
    }));

    res.json(snapshots);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
