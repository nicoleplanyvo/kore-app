import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { followUpCreateSchema, followUpUpdateSchema } from '@shared/validators';
import { makeImageUpload } from '../../../lib/upload.js';

const upload = makeImageUpload('follow-ups');

export const seaFollowUpsRouter: RouterType = Router();

// POST /  — Follow-up zu einem Visit-Punkt anlegen
seaFollowUpsRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;

    const parsed = followUpCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const session = await prisma.auditSession.findFirst({
      where: { id: parsed.data.sessionId, tenantId },
      select: { id: true, storeId: true },
    });
    if (!session) return res.status(404).json({ error: 'Visit-Session nicht gefunden.' });
    if (toolStoreIds !== 'all' && !toolStoreIds.includes(session.storeId)) {
      return res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
    }

    if (parsed.data.responseId) {
      const response = await prisma.auditResponse.findFirst({
        where: { id: parsed.data.responseId, sessionId: session.id },
        select: { id: true },
      });
      if (!response) return res.status(404).json({ error: 'Bewertungspunkt nicht gefunden.' });
    }

    let dueDate: Date | null = null;
    if (parsed.data.dueDate) {
      dueDate = new Date(parsed.data.dueDate);
      if (Number.isNaN(dueDate.getTime())) return res.status(400).json({ error: 'Ungültiges Fälligkeitsdatum.' });
    }

    const followUp = await prisma.followUpAction.create({
      data: {
        tenantId,
        storeId: session.storeId,
        sessionId: session.id,
        responseId: parsed.data.responseId ?? null,
        description: parsed.data.description,
        assignedTo: parsed.data.assignedTo ?? null,
        dueDate,
        createdBy: userId,
      },
      include: {
        store: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        response: { include: { criterion: { select: { id: true, name: true } } } },
      },
    });
    res.status(201).json(followUp);
  } catch (err) {
    console.error('Follow-up create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /  — Liste (Filter: storeId, status, sessionId, assignedTo)
seaFollowUpsRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 50));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.sessionId) where['sessionId'] = req.query.sessionId;
    if (req.query.assignedTo) where['assignedTo'] = req.query.assignedTo;
    if (toolStoreIds !== 'all') {
      where['storeId'] = req.query.storeId && toolStoreIds.includes(String(req.query.storeId))
        ? String(req.query.storeId)
        : { in: toolStoreIds };
    }

    const [data, total] = await Promise.all([
      prisma.followUpAction.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
          assignee: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          session: { select: { id: true, completedAt: true, template: { select: { id: true, name: true } } } },
          response: { include: { criterion: { select: { id: true, name: true } } } },
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.followUpAction.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error('Follow-up list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /open/:storeId  — Offene Follow-ups für Visit-Start („seit letztem Besuch")
seaFollowUpsRouter.get('/open/:storeId', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = req.params['storeId'] as string;

    if (toolStoreIds !== 'all' && !toolStoreIds.includes(storeId)) {
      return res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
    }

    const followUps = await prisma.followUpAction.findMany({
      where: { tenantId, storeId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: {
        assignee: { select: { id: true, name: true } },
        session: { select: { id: true, completedAt: true, template: { select: { id: true, name: true } } } },
        response: { include: { criterion: { select: { id: true, name: true } } } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(followUps);
  } catch (err) {
    console.error('Follow-up open list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /metrics  — Erledigungsquote & Durchlaufzeit je Store (nur Store-Ebene)
seaFollowUpsRouter.get('/metrics', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const followUps = await prisma.followUpAction.findMany({
      where: {
        tenantId,
        ...(toolStoreIds !== 'all' ? { storeId: { in: toolStoreIds } } : {}),
        status: { not: 'CANCELLED' },
      },
      select: {
        storeId: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        dueDate: true,
        store: { select: { name: true } },
      },
    });

    const byStore = new Map<string, {
      storeId: string; storeName: string;
      open: number; done: number; overdue: number; resolutionDays: number[];
    }>();
    const now = Date.now();

    for (const f of followUps) {
      const entry = byStore.get(f.storeId) ?? {
        storeId: f.storeId, storeName: f.store.name,
        open: 0, done: 0, overdue: 0, resolutionDays: [],
      };
      if (f.status === 'DONE') {
        entry.done += 1;
        if (f.resolvedAt) entry.resolutionDays.push((f.resolvedAt.getTime() - f.createdAt.getTime()) / 86400000);
      } else {
        entry.open += 1;
        if (f.dueDate && f.dueDate.getTime() < now) entry.overdue += 1;
      }
      byStore.set(f.storeId, entry);
    }

    const metrics = [...byStore.values()].map((e) => ({
      storeId: e.storeId,
      storeName: e.storeName,
      open: e.open,
      done: e.done,
      overdue: e.overdue,
      completionRate: e.open + e.done > 0 ? Math.round((e.done / (e.open + e.done)) * 100) : null,
      avgResolutionDays: e.resolutionDays.length > 0
        ? Math.round((e.resolutionDays.reduce((a, b) => a + b, 0) / e.resolutionDays.length) * 10) / 10
        : null,
    }));
    res.json(metrics);
  } catch (err) {
    console.error('Follow-up metrics error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id  — Aktualisieren (Status, Zuweisung, Erledigung — optional mit Nachweis-Foto)
seaFollowUpsRouter.put('/:id', upload.single('proofPhoto'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const parsed = followUpUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const existing = await prisma.followUpAction.findFirst({
      where: { id: String(req.params['id']), tenantId },
    });
    if (!existing) return res.status(404).json({ error: 'Follow-up nicht gefunden.' });
    if (toolStoreIds !== 'all' && !toolStoreIds.includes(existing.storeId)) {
      return res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.description !== undefined) data['description'] = parsed.data.description;
    if (parsed.data.resolution !== undefined) data['resolution'] = parsed.data.resolution;
    if (parsed.data.assignedTo !== undefined) data['assignedTo'] = parsed.data.assignedTo;
    if (parsed.data.dueDate !== undefined) {
      if (parsed.data.dueDate === null) data['dueDate'] = null;
      else {
        const due = new Date(parsed.data.dueDate);
        if (Number.isNaN(due.getTime())) return res.status(400).json({ error: 'Ungültiges Fälligkeitsdatum.' });
        data['dueDate'] = due;
      }
    }
    if (parsed.data.status !== undefined) {
      data['status'] = parsed.data.status;
      data['resolvedAt'] = parsed.data.status === 'DONE' ? new Date() : null;
    }
    if (req.file) data['proofPhotoPath'] = `/uploads/follow-ups/${req.file.filename}`;

    const updated = await prisma.followUpAction.update({
      where: { id: existing.id },
      data,
      include: {
        store: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        response: { include: { criterion: { select: { id: true, name: true } } } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('Follow-up update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
