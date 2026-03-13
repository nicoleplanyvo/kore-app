import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  customerOrderCreateSchema,
  customerOrderUpdateSchema,
  orderStatusUpdateSchema,
} from '@shared/validators';

export const trackTraceRouter: RouterType = Router();
trackTraceRouter.use(authenticate, requireToolAccess('customer.track_trace'));

// GET /orders — List with search, pagination
trackTraceRouter.get('/orders', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;

    if (req.query.search) {
      const search = req.query.search as string;
      where['OR'] = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { trackingNumber: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.customerOrder.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { statusUpdates: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customerOrder.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /orders — Create
trackTraceRouter.post('/orders', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;
    const parsed = customerOrderCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const order = await prisma.customerOrder.create({
      data: {
        orderNumber: parsed.data.orderNumber,
        customerName: parsed.data.customerName,
        storeId,
        createdBy: userId,
        ...(parsed.data.customerEmail ? { customerEmail: parsed.data.customerEmail } : {}),
        ...(parsed.data.trackingNumber ? { trackingNumber: parsed.data.trackingNumber } : {}),
        ...(parsed.data.carrier ? { carrier: parsed.data.carrier } : {}),
        ...(parsed.data.estimatedDelivery ? { estimatedDelivery: new Date(parsed.data.estimatedDelivery) } : {}),
      },
    });
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /summary — Order stats
trackTraceRouter.get('/summary', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const orders = await prisma.customerOrder.findMany({ where });

    const statusCounts: Record<string, number> = {};
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    }

    res.json({
      total: orders.length,
      byStatus: statusCounts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /orders/:id — Get with statusUpdates
trackTraceRouter.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.customerOrder.findUnique({
      where: { id: req.params['id'] },
      include: {
        store: { select: { id: true, name: true, city: true } },
        creator: { select: { id: true, name: true } },
        statusUpdates: {
          include: { updater: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!order) return res.status(404).json({ error: 'Bestellung nicht gefunden.' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /orders/:id — Update
trackTraceRouter.put('/orders/:id', async (req, res) => {
  try {
    const parsed = customerOrderUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.estimatedDelivery) data['estimatedDelivery'] = new Date(parsed.data.estimatedDelivery);

    const order = await prisma.customerOrder.update({
      where: { id: req.params['id'] },
      data,
    });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /orders/:id/status — Add status update
trackTraceRouter.post('/orders/:id/status', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = orderStatusUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const statusUpdate = await prisma.orderStatusUpdate.create({
      data: {
        orderId: req.params['id']!,
        updatedBy: userId,
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    // Also update the order's status
    await prisma.customerOrder.update({
      where: { id: req.params['id'] },
      data: { status: parsed.data.status },
    });

    res.status(201).json(statusUpdate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
