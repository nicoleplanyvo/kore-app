import { Router, type Router as RouterType } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';
import { tenantCreateSchema, tenantUpdateSchema } from '@shared/validators';

export const adminTenantsRouter: RouterType = Router();
adminTenantsRouter.use(authenticate, requireMinRole('kore_admin'));

// GET /api/admin/tenants/stats — Dashboard-Statistiken
adminTenantsRouter.get('/stats', async (_req, res) => {
  try {
    const [totalTenants, activeTenants, totalStores, activeStores, activeAssignments] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),
      prisma.storeToolAssignment.findMany({
        where: { isActive: true },
        include: { tool: { select: { priceMonthly: true } } },
      }),
    ]);

    let mrr = 0;
    for (const a of activeAssignments) {
      mrr += a.tool.priceMonthly;
    }

    res.json({
      totalTenants,
      activeTenants,
      totalStores,
      activeStores,
      totalToolBookings: activeAssignments.length,
      mrr,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/tenants — Liste mit Pagination, Suche, Filter
adminTenantsRouter.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize'] as string) || 20));
    const search = (req.query['search'] as string) || '';
    const status = req.query['status'] as string | undefined;

    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { contactEmail: { contains: search } },
        { contactName: { contains: search } },
      ];
    }
    if (status) where['status'] = status;

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: { select: { users: true, stores: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({ data: tenants, total, page, pageSize });
  } catch (err) {
    console.error('Admin tenants list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/tenants/:id — Tenant Detail mit Stores
adminTenantsRouter.get('/:id', async (req, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params['id'] },
      include: {
        stores: {
          include: { _count: { select: { tools: true } } },
          orderBy: { name: 'asc' },
        },
        _count: { select: { users: true, stores: true } },
      },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant nicht gefunden.' });
      return;
    }

    res.json(tenant);
  } catch (err) {
    console.error('Admin tenant detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/admin/tenants — Neuen Tenant erstellen
adminTenantsRouter.post('/', async (req, res) => {
  try {
    const result = tenantCreateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validierungsfehler', details: result.error.flatten().fieldErrors });
      return;
    }

    const data = result.data;

    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) {
      res.status(409).json({ error: 'Ein Tenant mit diesem Slug existiert bereits.' });
      return;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        contactEmail: data.contactEmail || null,
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
        maxUsers: data.maxUsers ?? 15,
      },
      include: {
        stores: { include: { _count: { select: { tools: true } } } },
        _count: { select: { users: true, stores: true } },
      },
    });

    res.status(201).json(tenant);
  } catch (err) {
    console.error('Admin tenant create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /api/admin/tenants/:id — Tenant aktualisieren
adminTenantsRouter.put('/:id', async (req, res) => {
  try {
    const result = tenantUpdateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validierungsfehler', details: result.error.flatten().fieldErrors });
      return;
    }

    const data = result.data;

    if (data.slug) {
      const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
      if (existing && existing.id !== req.params['id']) {
        res.status(409).json({ error: 'Ein anderer Tenant verwendet bereits diesen Slug.' });
        return;
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.params['id'] },
      data: {
        ...data,
        contactEmail: data.contactEmail || null,
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
      },
      include: {
        stores: { include: { _count: { select: { tools: true } } } },
        _count: { select: { users: true, stores: true } },
      },
    });

    res.json(tenant);
  } catch (err) {
    console.error('Admin tenant update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /api/admin/tenants/:id — Tenant deaktivieren
adminTenantsRouter.delete('/:id', async (req, res) => {
  try {
    const tenant = await prisma.tenant.update({
      where: { id: req.params['id'] },
      data: { status: 'CANCELED' },
    });

    res.json({ success: true, tenant });
  } catch (err) {
    console.error('Admin tenant delete error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
