import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  clientProfileCreateSchema,
  clientProfileUpdateSchema,
  clientInteractionSchema,
  clientTaskSchema,
} from '@shared/validators';

export const clientelingRouter: RouterType = Router();
clientelingRouter.use(authenticate, requireToolAccess('customer.clienteling_crm'));

// GET /clients — List with search, pagination
clientelingRouter.get('/clients', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    if (req.query.search) {
      const search = req.query.search as string;
      where['OR'] = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (req.query.vipLevel) where['vipLevel'] = req.query.vipLevel;

    const [data, total] = await Promise.all([
      prisma.clientProfile.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { interactions: true, tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.clientProfile.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /clients — Create
clientelingRouter.post('/clients', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;
    const parsed = clientProfileCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const client = await prisma.clientProfile.create({
      data: { ...parsed.data, storeId, createdBy: userId },
    });
    res.status(201).json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/summary — Client stats
clientelingRouter.get('/reports/summary', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const clients = await prisma.clientProfile.findMany({
      where,
      include: { _count: { select: { interactions: true, tasks: true } } },
    });

    const totalClients = clients.length;
    const vipClients = clients.filter((c) => c.vipLevel).length;
    const totalPurchases = clients.reduce((s, c) => s + c.totalPurchases, 0);
    const totalInteractions = clients.reduce((s, c) => s + c._count.interactions, 0);
    const totalTasks = clients.reduce((s, c) => s + c._count.tasks, 0);
    const avgPurchases = totalClients > 0 ? Math.round((totalPurchases / totalClients) * 100) / 100 : 0;

    res.json({ totalClients, vipClients, totalPurchases, avgPurchases, totalInteractions, totalTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /clients/:id — Get with interactions, tasks
clientelingRouter.get('/clients/:id', async (req, res) => {
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
      },
    });
    if (!client) return res.status(404).json({ error: 'Client nicht gefunden.' });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /clients/:id — Update
clientelingRouter.put('/clients/:id', async (req, res) => {
  try {
    const parsed = clientProfileUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.lastVisit) data['lastVisit'] = new Date(parsed.data.lastVisit);

    const client = await prisma.clientProfile.update({
      where: { id: req.params['id'] },
      data,
    });
    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /clients/:id/interactions — Add interaction
clientelingRouter.post('/clients/:id/interactions', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = clientInteractionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const interaction = await prisma.clientInteraction.create({
      data: {
        clientId: req.params['id']!,
        userId,
        ...parsed.data,
      },
    });

    // Update lastVisit on client
    await prisma.clientProfile.update({
      where: { id: req.params['id'] },
      data: { lastVisit: new Date() },
    });

    res.status(201).json(interaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /clients/:id/tasks — Add task
clientelingRouter.post('/clients/:id/tasks', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = clientTaskSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const task = await prisma.clientTask.create({
      data: {
        clientId: req.params['id']!,
        userId,
        title: parsed.data.title,
        ...(parsed.data.dueDate ? { dueDate: new Date(parsed.data.dueDate) } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
    });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
