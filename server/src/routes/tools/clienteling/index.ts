import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  clientProfileCreateSchema,
  clientProfileUpdateSchema,
  clientInteractionSchema,
  clientTaskSchema,
  clientAppointmentCreateSchema,
  clientAppointmentUpdateSchema,
} from '@shared/validators';

export const clientelingRouter: RouterType = Router();
clientelingRouter.use(authenticate, requireToolAccess('customer.clienteling_crm'));

// ── Helper ───────────────────────────────────────
function storeWhere(req: any, filter?: string) {
  const toolStoreIds = req.toolStoreIds as string[] | 'all';
  const w: Record<string, unknown> = {};
  if (filter) w['storeId'] = filter;
  else if (toolStoreIds !== 'all') w['storeId'] = { in: toolStoreIds };
  return w;
}

// ── GET /stores ──────────────────────────────────
clientelingRouter.get('/stores', async (req, res) => {
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

// ── GET /users ───────────────────────────────────
clientelingRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (tenantId) where['tenantId'] = tenantId;
    const users = await prisma.user.findMany({ where, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /clients — Alias for /customers ──────────
clientelingRouter.get('/clients', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = storeWhere(req, req.query.storeId as string);

    if (req.query.search) {
      const s = req.query.search as string;
      where['OR'] = [
        { firstName: { contains: s } },
        { lastName: { contains: s } },
        { email: { contains: s } },
        { phone: { contains: s } },
      ];
    }
    if (req.query.vip === 'true') where['vipLevel'] = { not: null };
    if (req.query.vipLevel) where['vipLevel'] = req.query.vipLevel;

    const [data, total] = await Promise.all([
      prisma.clientProfile.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { interactions: true, tasks: true, appointments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clientProfile.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /customers ───────────────────────────────
clientelingRouter.get('/customers', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = storeWhere(req, req.query.storeId as string);

    if (req.query.search) {
      const s = req.query.search as string;
      where['OR'] = [
        { firstName: { contains: s } },
        { lastName: { contains: s } },
        { email: { contains: s } },
        { phone: { contains: s } },
      ];
    }
    if (req.query.vip === 'true') where['vipLevel'] = { not: null };
    if (req.query.vipLevel) where['vipLevel'] = req.query.vipLevel;

    const [data, total] = await Promise.all([
      prisma.clientProfile.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { interactions: true, tasks: true, appointments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clientProfile.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /customers ──────────────────────────────
clientelingRouter.post('/customers', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;
    const parsed = clientProfileCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const data: Record<string, unknown> = { ...parsed.data, storeId, createdBy: userId };
    if (parsed.data.birthday) data['birthday'] = new Date(parsed.data.birthday);
    if (parsed.data.email === '') delete data['email'];

    const client = await prisma.clientProfile.create({
      data: data as any,
      include: { store: { select: { id: true, name: true } } },
    });
    res.status(201).json(client);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /customers/:id ───────────────────────────
clientelingRouter.get('/customers/:id', async (req, res) => {
  try {
    const client = await prisma.clientProfile.findUnique({
      where: { id: req.params['id'] },
      include: {
        store: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        interactions: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { date: 'desc' },
        },
        tasks: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          include: { advisor: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
          orderBy: { startsAt: 'desc' },
        },
      },
    });
    if (!client) return res.status(404).json({ error: 'Kunde nicht gefunden.' });
    res.json(client);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /customers/:id ───────────────────────────
clientelingRouter.put('/customers/:id', async (req, res) => {
  try {
    const parsed = clientProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.lastVisit) data['lastVisit'] = new Date(parsed.data.lastVisit);
    if (parsed.data.birthday) data['birthday'] = new Date(parsed.data.birthday);
    if (parsed.data.email === '') data['email'] = null;

    const client = await prisma.clientProfile.update({
      where: { id: req.params['id'] },
      data,
    });
    res.json(client);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── DELETE /customers/:id — DSGVO Loeschung ──────
clientelingRouter.delete('/customers/:id', async (req, res) => {
  try {
    // Cascade: interactions, tasks are cascade-deleted by schema
    // Appointments: clientId set to null
    await prisma.clientProfile.delete({ where: { id: req.params['id'] } });
    res.json({ success: true, message: 'Kundendaten wurden DSGVO-konform geloescht.' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Kunde nicht gefunden.' });
    console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /customers/:id/interactions ─────────────
clientelingRouter.post('/customers/:id/interactions', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = clientInteractionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const data: Record<string, unknown> = {
      clientId: req.params['id']!,
      userId,
      ...parsed.data,
    };
    if (parsed.data.date) data['date'] = new Date(parsed.data.date);

    const interaction = await prisma.clientInteraction.create({ data: data as any });

    // Update lastVisit + totalPurchases
    const updateData: Record<string, unknown> = { lastVisit: new Date() };
    if (parsed.data.purchaseAmount && parsed.data.purchaseAmount > 0) {
      updateData['totalPurchases'] = { increment: 1 };
      updateData['totalSpent'] = { increment: parsed.data.purchaseAmount };
    }
    await prisma.clientProfile.update({ where: { id: req.params['id'] }, data: updateData });

    res.status(201).json(interaction);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /appointments ────────────────────────────
clientelingRouter.get('/appointments', async (req, res) => {
  try {
    const where: Record<string, unknown> = storeWhere(req, req.query.storeId as string);
    if (req.query.from || req.query.to) {
      const range: Record<string, unknown> = {};
      if (req.query.from) range['gte'] = new Date(req.query.from as string);
      if (req.query.to) range['lte'] = new Date(req.query.to as string);
      where['startsAt'] = range;
    }
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.advisorId) where['advisorId'] = req.query.advisorId;

    const appointments = await prisma.clientAppointment.findMany({
      where,
      include: {
        store: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true, vipLevel: true } },
        advisor: { select: { id: true, name: true } },
      },
      orderBy: { startsAt: 'asc' },
    });
    res.json(appointments);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /appointments ───────────────────────────
clientelingRouter.post('/appointments', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = clientAppointmentCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const appointment = await prisma.clientAppointment.create({
      data: {
        ...parsed.data,
        advisorId: (req.body.advisorId as string) || userId,
        startsAt: new Date(parsed.data.startsAt),
        endsAt: new Date(parsed.data.endsAt),
        clientId: parsed.data.clientId || null,
      },
      include: {
        store: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
        advisor: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(appointment);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /appointments/:id ────────────────────────
clientelingRouter.put('/appointments/:id', async (req, res) => {
  try {
    const parsed = clientAppointmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.startsAt) data['startsAt'] = new Date(parsed.data.startsAt);
    if (parsed.data.endsAt) data['endsAt'] = new Date(parsed.data.endsAt);

    const appointment = await prisma.clientAppointment.update({
      where: { id: req.params['id'] },
      data,
    });
    res.json(appointment);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Termin nicht gefunden.' });
    console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DELETE /appointments/:id ─────────────────────
clientelingRouter.delete('/appointments/:id', async (req, res) => {
  try {
    await prisma.clientAppointment.delete({ where: { id: req.params['id'] } });
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Termin nicht gefunden.' });
    console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /dashboard ───────────────────────────────
clientelingRouter.get('/dashboard', async (req, res) => {
  try {
    const where = storeWhere(req, req.query.storeId as string);

    const [clients, recentInteractions, upcomingAppointments] = await Promise.all([
      prisma.clientProfile.findMany({
        where,
        include: { _count: { select: { interactions: true, appointments: true } } },
      }),
      prisma.clientInteraction.findMany({
        where: {
          client: where,
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: { client: { select: { firstName: true, lastName: true } }, user: { select: { name: true } } },
        orderBy: { date: 'desc' },
        take: 20,
      }),
      prisma.clientAppointment.findMany({
        where: {
          ...storeWhere(req, req.query.storeId as string),
          startsAt: { gte: new Date() },
          status: { not: 'ABGESAGT' },
        },
        include: { client: { select: { firstName: true, lastName: true } }, advisor: { select: { name: true } } },
        orderBy: { startsAt: 'asc' },
        take: 10,
      }),
    ]);

    const totalCustomers = clients.length;
    const vipCount = clients.filter(c => c.vipLevel).length;
    const totalLoyaltyPoints = clients.reduce((s, c) => s + c.loyaltyPoints, 0);
    const totalSpent = clients.reduce((s, c) => s + c.totalSpent, 0);
    const avgSpent = totalCustomers > 0 ? Math.round(totalSpent / totalCustomers * 100) / 100 : 0;

    // New customers last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newCustomers = clients.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;

    // Top customers by totalSpent
    const topCustomers = [...clients]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, vipLevel: c.vipLevel, totalSpent: c.totalSpent, totalPurchases: c.totalPurchases, loyaltyPoints: c.loyaltyPoints, interactions: c._count.interactions }));

    res.json({
      totalCustomers,
      vipCount,
      newCustomers,
      totalLoyaltyPoints,
      totalSpent,
      avgSpent,
      upcomingAppointments: upcomingAppointments.length,
      recentInteractions,
      upcomingAppointmentsList: upcomingAppointments,
      topCustomers,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
