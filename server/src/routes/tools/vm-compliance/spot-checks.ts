import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { hasMinRole, type UserRole } from '@shared/types';
import {
  photoRequestCreateSchema,
  photoRequestRespondSchema,
  photoRequestReviewSchema,
} from '@shared/validators';
import { makeImageUpload } from '../../../lib/upload.js';

const upload = makeImageUpload('spot-checks');

export const vmSpotChecksRouter: RouterType = Router();

/** Anfragen erstellen/reviewen dürfen nur Multisite-Manager und höher */
function canManage(role: string): boolean {
  return hasMinRole(role as UserRole, 'multisite_manager');
}

/** Berechneter Status: PENDING nach Deadline = OVERDUE (nicht persistiert) */
function effectiveStatus(target: { status: string }, deadline: Date): string {
  if (target.status === 'PENDING' && deadline.getTime() < Date.now()) return 'OVERDUE';
  return target.status;
}

// POST /  — Neue Spot-Check-Anfrage (optional mit Referenzfoto)
vmSpotChecksRouter.post('/', upload.single('referencePhoto'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    if (!canManage(req.user!.role)) {
      return res.status(403).json({ error: 'Keine Berechtigung, Spot-Checks zu erstellen.' });
    }

    // storeIds kommt bei multipart/form-data als JSON-String
    const body = { ...req.body };
    if (typeof body.storeIds === 'string') {
      try { body.storeIds = JSON.parse(body.storeIds); } catch { body.storeIds = []; }
    }
    const parsed = photoRequestCreateSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const deadline = new Date(parsed.data.deadline);
    if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Deadline muss in der Zukunft liegen.' });
    }

    if (toolStoreIds !== 'all') {
      const outside = parsed.data.storeIds.filter((id) => !toolStoreIds.includes(id));
      if (outside.length > 0) return res.status(403).json({ error: 'Kein Zugriff auf alle gewählten Stores.' });
    }
    const stores = await prisma.store.findMany({
      where: { id: { in: parsed.data.storeIds }, tenantId, isActive: true },
      select: { id: true },
    });
    if (stores.length !== parsed.data.storeIds.length) {
      return res.status(404).json({ error: 'Mindestens ein Store wurde nicht gefunden.' });
    }

    const request = await prisma.photoRequest.create({
      data: {
        tenantId,
        title: parsed.data.title,
        instructions: parsed.data.instructions ?? null,
        category: parsed.data.category ?? null,
        referencePhoto: req.file ? `/uploads/spot-checks/${req.file.filename}` : null,
        deadline,
        createdBy: userId,
        targets: { create: parsed.data.storeIds.map((storeId) => ({ storeId })) },
      },
      include: {
        targets: { include: { store: { select: { id: true, name: true, city: true } } } },
        creator: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(request);
  } catch (err) {
    console.error('Spot-check create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /  — Liste aller Anfragen (Manager-Sicht), Filter: status
vmSpotChecksRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.status) where['status'] = req.query.status;
    if (toolStoreIds !== 'all') where['targets'] = { some: { storeId: { in: toolStoreIds } } };

    const [data, total] = await Promise.all([
      prisma.photoRequest.findMany({
        where,
        include: {
          targets: {
            where: toolStoreIds !== 'all' ? { storeId: { in: toolStoreIds } } : undefined,
            include: { store: { select: { id: true, name: true, city: true } } },
          },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.photoRequest.count({ where }),
    ]);

    const enriched = data.map((r) => ({
      ...r,
      targets: r.targets.map((t) => ({ ...t, status: effectiveStatus(t, r.deadline) })),
    }));
    res.json({ data: enriched, total, page, pageSize });
  } catch (err) {
    console.error('Spot-check list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /inbox  — Offene Anfragen für die eigenen Stores (Store-Sicht)
vmSpotChecksRouter.get('/inbox', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const targets = await prisma.photoRequestTarget.findMany({
      where: {
        status: { in: ['PENDING', 'REJECTED'] },
        ...(toolStoreIds !== 'all' ? { storeId: { in: toolStoreIds } } : {}),
        request: { tenantId, status: 'ACTIVE' },
      },
      include: {
        request: {
          select: {
            id: true, title: true, instructions: true, category: true,
            referencePhoto: true, deadline: true, createdAt: true,
            creator: { select: { id: true, name: true } },
          },
        },
        store: { select: { id: true, name: true, city: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const enriched = targets
      .map((t) => ({ ...t, status: effectiveStatus(t, t.request.deadline) }))
      .sort((a, b) => a.request.deadline.getTime() - b.request.deadline.getTime());
    res.json(enriched);
  } catch (err) {
    console.error('Spot-check inbox error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /metrics/summary  — Kennzahlen je Store (nur Store-Ebene, keine Personenauswertung)
vmSpotChecksRouter.get('/metrics/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const targets = await prisma.photoRequestTarget.findMany({
      where: {
        ...(toolStoreIds !== 'all' ? { storeId: { in: toolStoreIds } } : {}),
        request: { tenantId },
      },
      include: {
        request: { select: { deadline: true, createdAt: true } },
        store: { select: { id: true, name: true } },
      },
    });

    const byStore = new Map<string, {
      storeId: string; storeName: string;
      total: number; submitted: number; approved: number; onTime: number;
      responseMinutes: number[];
    }>();

    for (const t of targets) {
      const entry = byStore.get(t.storeId) ?? {
        storeId: t.storeId, storeName: t.store.name,
        total: 0, submitted: 0, approved: 0, onTime: 0, responseMinutes: [],
      };
      entry.total += 1;
      if (t.submittedAt) {
        entry.submitted += 1;
        if (t.submittedAt.getTime() <= t.request.deadline.getTime()) entry.onTime += 1;
        entry.responseMinutes.push((t.submittedAt.getTime() - t.request.createdAt.getTime()) / 60000);
      }
      if (t.status === 'APPROVED') entry.approved += 1;
      byStore.set(t.storeId, entry);
    }

    const summary = [...byStore.values()].map((e) => ({
      storeId: e.storeId,
      storeName: e.storeName,
      total: e.total,
      submitted: e.submitted,
      approved: e.approved,
      onTimeRate: e.submitted > 0 ? Math.round((e.onTime / e.submitted) * 100) : null,
      approvalRate: e.submitted > 0 ? Math.round((e.approved / e.submitted) * 100) : null,
      avgResponseMinutes: e.responseMinutes.length > 0
        ? Math.round(e.responseMinutes.reduce((a, b) => a + b, 0) / e.responseMinutes.length)
        : null,
    }));
    res.json(summary);
  } catch (err) {
    console.error('Spot-check metrics error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /:id  — Detail mit Live-Status aller Ziel-Stores
vmSpotChecksRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const request = await prisma.photoRequest.findFirst({
      where: { id: req.params['id'], tenantId },
      include: {
        targets: {
          where: toolStoreIds !== 'all' ? { storeId: { in: toolStoreIds } } : undefined,
          include: {
            store: { select: { id: true, name: true, city: true } },
            submitter: { select: { id: true, name: true } },
            reviewer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        creator: { select: { id: true, name: true } },
      },
    });
    if (!request) return res.status(404).json({ error: 'Anfrage nicht gefunden.' });

    res.json({
      ...request,
      targets: request.targets.map((t) => ({ ...t, status: effectiveStatus(t, request.deadline) })),
    });
  } catch (err) {
    console.error('Spot-check detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/respond  — Store reicht Foto ein (auch nach Ablehnung erneut möglich)
vmSpotChecksRouter.post('/:id/respond', upload.single('photo'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;

    const parsed = photoRequestRespondSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    if (!req.file) return res.status(400).json({ error: 'Foto ist erforderlich.' });
    if (toolStoreIds !== 'all' && !toolStoreIds.includes(parsed.data.storeId)) {
      return res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
    }

    const target = await prisma.photoRequestTarget.findFirst({
      where: {
        requestId: String(req.params['id']),
        storeId: parsed.data.storeId,
        status: { in: ['PENDING', 'REJECTED'] },
        request: { tenantId, status: 'ACTIVE' },
      },
    });
    if (!target) return res.status(404).json({ error: 'Anfrage nicht gefunden oder bereits beantwortet.' });

    const updated = await prisma.photoRequestTarget.update({
      where: { id: target.id },
      data: {
        status: 'SUBMITTED',
        photoPath: `/uploads/spot-checks/${req.file.filename}`,
        comment: parsed.data.comment ?? null,
        submittedBy: userId,
        submittedAt: new Date(),
        reviewedBy: null,
        reviewNote: null,
        reviewedAt: null,
      },
      include: { store: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (err) {
    console.error('Spot-check respond error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id/targets/:targetId/review  — Einreichung genehmigen/ablehnen
vmSpotChecksRouter.put('/:id/targets/:targetId/review', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;

    if (!canManage(req.user!.role)) {
      return res.status(403).json({ error: 'Keine Berechtigung für Reviews.' });
    }
    const parsed = photoRequestReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const target = await prisma.photoRequestTarget.findFirst({
      where: { id: req.params['targetId'], requestId: req.params['id'], status: 'SUBMITTED', request: { tenantId } },
    });
    if (!target) return res.status(404).json({ error: 'Einreichung nicht gefunden oder nicht im Status SUBMITTED.' });

    const updated = await prisma.photoRequestTarget.update({
      where: { id: target.id },
      data: {
        status: parsed.data.status,
        reviewNote: parsed.data.reviewNote ?? null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: { store: { select: { id: true, name: true } } },
    });
    res.json(updated);
  } catch (err) {
    console.error('Spot-check review error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id/close  — Anfrage schließen
vmSpotChecksRouter.put('/:id/close', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    if (!canManage(req.user!.role)) {
      return res.status(403).json({ error: 'Keine Berechtigung.' });
    }
    const request = await prisma.photoRequest.findFirst({
      where: { id: req.params['id'], tenantId, status: 'ACTIVE' },
    });
    if (!request) return res.status(404).json({ error: 'Anfrage nicht gefunden oder bereits geschlossen.' });

    const updated = await prisma.photoRequest.update({
      where: { id: request.id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    console.error('Spot-check close error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
