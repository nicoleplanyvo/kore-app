import { Router, type Router as RouterType } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';
import { regionCreateSchema, regionUpdateSchema, regionStoreAssignSchema } from '@shared/validators';
import { logAudit } from '../../lib/audit.js';
import type { UserRole } from '@shared/types';

export const adminRegionsRouter: RouterType = Router();
adminRegionsRouter.use(authenticate, requireMinRole('tenant_admin'));

// GET /api/admin/regions — Regionen mit Tenant-Scoping
adminRegionsRouter.get('/', async (req, res) => {
  try {
    const tenantId = req.query['tenantId'] as string | undefined;
    const where: Record<string, unknown> = {};
    const userRole = req.user!.role as UserRole;

    if (userRole === 'kore_admin') {
      if (tenantId) where['tenantId'] = tenantId;
    } else {
      where['tenantId'] = req.user!.tenantId;
    }

    const regions = await prisma.region.findMany({
      where,
      include: {
        _count: { select: { stores: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json(regions);
  } catch (err) {
    console.error('Regions list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/regions/:id — Region-Detail mit Stores
adminRegionsRouter.get('/:id', async (req, res) => {
  try {
    const region = await prisma.region.findUnique({
      where: { id: req.params['id'] },
      include: {
        stores: {
          where: { isActive: true },
          include: {
            _count: { select: { tools: true, userAssignments: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!region) {
      res.status(404).json({ error: 'Region nicht gefunden.' });
      return;
    }

    // Tenant-Zugriff prüfen
    if (req.user!.role !== 'kore_admin' && region.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diese Region.' });
      return;
    }

    res.json(region);
  } catch (err) {
    console.error('Region detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/admin/regions — Region erstellen
adminRegionsRouter.post('/', async (req, res) => {
  try {
    const result = regionCreateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validierungsfehler', details: result.error.flatten().fieldErrors });
      return;
    }

    const data = result.data;

    // Nicht-kore_admin muss eigenen Tenant verwenden
    if (req.user!.role !== 'kore_admin' && data.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Mandanten.' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant nicht gefunden.' });
      return;
    }

    const region = await prisma.region.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description || null,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        _count: { select: { stores: true } },
      },
    });

    await logAudit({
      tenantId: data.tenantId,
      userId: req.user!.sub,
      action: 'CREATE',
      entity: 'region',
      entityId: region.id,
      details: JSON.stringify({ regionName: region.name }),
      ipAddress: req.ip,
    });

    res.status(201).json(region);
  } catch (err) {
    console.error('Region create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /api/admin/regions/:id — Region aktualisieren
adminRegionsRouter.put('/:id', async (req, res) => {
  try {
    const result = regionUpdateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validierungsfehler', details: result.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.region.findUnique({ where: { id: req.params['id'] } });
    if (!existing) {
      res.status(404).json({ error: 'Region nicht gefunden.' });
      return;
    }

    if (req.user!.role !== 'kore_admin' && existing.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diese Region.' });
      return;
    }

    const region = await prisma.region.update({
      where: { id: req.params['id'] },
      data: {
        ...result.data,
        description: result.data.description || null,
      },
      include: {
        _count: { select: { stores: true } },
      },
    });

    await logAudit({
      tenantId: existing.tenantId,
      userId: req.user!.sub,
      action: 'UPDATE',
      entity: 'region',
      entityId: region.id,
      details: JSON.stringify({ regionName: region.name }),
      ipAddress: req.ip,
    });

    res.json(region);
  } catch (err) {
    console.error('Region update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /api/admin/regions/:id — Region deaktivieren
adminRegionsRouter.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.region.findUnique({ where: { id: req.params['id'] } });
    if (!existing) {
      res.status(404).json({ error: 'Region nicht gefunden.' });
      return;
    }

    if (req.user!.role !== 'kore_admin' && existing.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diese Region.' });
      return;
    }

    // Stores aus der Region entfernen (regionId → null)
    await prisma.store.updateMany({
      where: { regionId: existing.id },
      data: { regionId: null },
    });

    // Region deaktivieren
    const region = await prisma.region.update({
      where: { id: req.params['id'] },
      data: { isActive: false },
    });

    await logAudit({
      tenantId: existing.tenantId,
      userId: req.user!.sub,
      action: 'DELETE',
      entity: 'region',
      entityId: region.id,
      details: JSON.stringify({ regionName: region.name }),
      ipAddress: req.ip,
    });

    res.json({ success: true, region });
  } catch (err) {
    console.error('Region delete error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /api/admin/regions/:id/stores — Stores zur Region zuweisen
adminRegionsRouter.put('/:id/stores', async (req, res) => {
  try {
    const result = regionStoreAssignSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validierungsfehler', details: result.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.region.findUnique({ where: { id: req.params['id'] } });
    if (!existing) {
      res.status(404).json({ error: 'Region nicht gefunden.' });
      return;
    }

    if (req.user!.role !== 'kore_admin' && existing.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diese Region.' });
      return;
    }

    const { storeIds } = result.data;

    // Stores aus dieser Region entfernen, die nicht mehr drin sein sollen
    await prisma.store.updateMany({
      where: { regionId: existing.id, id: { notIn: storeIds } },
      data: { regionId: null },
    });

    // Stores dieser Region zuweisen
    if (storeIds.length > 0) {
      await prisma.store.updateMany({
        where: { id: { in: storeIds }, tenantId: existing.tenantId },
        data: { regionId: existing.id },
      });
    }

    await logAudit({
      tenantId: existing.tenantId,
      userId: req.user!.sub,
      action: 'UPDATE',
      entity: 'region_stores',
      entityId: existing.id,
      details: JSON.stringify({ regionName: existing.name, storeIds }),
      ipAddress: req.ip,
    });

    // Region mit aktualisierten Stores zurückgeben
    const region = await prisma.region.findUnique({
      where: { id: existing.id },
      include: {
        stores: {
          where: { isActive: true },
          include: {
            _count: { select: { tools: true, userAssignments: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    res.json(region);
  } catch (err) {
    console.error('Region stores assign error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
