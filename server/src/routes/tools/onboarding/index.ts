import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  onboardingTemplateCreateSchema,
  onboardingJourneyCreateSchema,
  onboardingStepUpdateSchema,
} from '@shared/validators';

export const onboardingRouter: RouterType = Router();
onboardingRouter.use(authenticate, requireToolAccess('training.onboarding'));

// ── STORES ────────────────────────────────────────────

onboardingRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where = toolStoreIds === 'all' ? {} : { id: { in: toolStoreIds } };
    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── USERS ─────────────────────────────────────────────

onboardingRouter.get('/users', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── TEMPLATES ─────────────────────────────────────────

// GET /templates
onboardingRouter.get('/templates', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const templates = await prisma.onboardingTemplate.findMany({
      where: { tenantId },
      include: { _count: { select: { steps: true, journeys: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /templates
onboardingRouter.post('/templates', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const parsed = onboardingTemplateCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const { steps, ...templateData } = parsed.data;
    const template = await prisma.onboardingTemplate.create({
      data: {
        ...templateData,
        tenantId,
        steps: steps ? { create: steps } : undefined,
      },
      include: { steps: { orderBy: { sortOrder: 'asc' } }, _count: { select: { journeys: true } } },
    });
    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /templates/:id
onboardingRouter.get('/templates/:id', async (req, res) => {
  try {
    const template = await prisma.onboardingTemplate.findUnique({
      where: { id: req.params['id'] },
      include: { steps: { orderBy: { sortOrder: 'asc' } }, _count: { select: { journeys: true } } },
    });
    if (!template) return res.status(404).json({ error: 'Template nicht gefunden.' });
    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /templates/:id
onboardingRouter.put('/templates/:id', async (req, res) => {
  try {
    const parsed = onboardingTemplateCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const { steps, ...templateData } = parsed.data;
    const template = await prisma.onboardingTemplate.update({
      where: { id: req.params['id'] },
      data: {
        ...templateData,
      },
      include: { steps: { orderBy: { sortOrder: 'asc' } }, _count: { select: { journeys: true } } },
    });
    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /templates/:id (soft deactivate)
onboardingRouter.delete('/templates/:id', async (req, res) => {
  try {
    const template = await prisma.onboardingTemplate.update({
      where: { id: req.params['id'] },
      data: { isActive: false },
    });
    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── JOURNEYS ──────────────────────────────────────────

// GET /journeys
onboardingRouter.get('/journeys', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.userId) where['userId'] = req.query.userId;
    if (req.query.mentorId) where['mentorId'] = req.query.mentorId;

    const [data, total] = await Promise.all([
      prisma.onboardingJourney.findMany({
        where,
        include: {
          template: { select: { id: true, name: true, durationDays: true } },
          user: { select: { id: true, name: true } },
          mentor: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          _count: { select: { progress: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.onboardingJourney.count({ where }),
    ]);

    // Enrich with progress percentage
    const enriched = await Promise.all(
      data.map(async (j) => {
        const progress = await prisma.onboardingProgress.findMany({
          where: { journeyId: j.id },
          include: { step: { select: { isRequired: true } } },
        });
        const totalSteps = progress.length;
        const completedSteps = progress.filter((p) => p.status === 'COMPLETED' || p.status === 'SKIPPED').length;
        const requiredSteps = progress.filter((p) => p.step.isRequired).length;
        const requiredDone = progress.filter((p) => p.step.isRequired && (p.status === 'COMPLETED' || p.status === 'SKIPPED')).length;
        const pct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        return { ...j, progressPct: pct, totalSteps, completedSteps, requiredSteps, requiredDone };
      }),
    );

    res.json({ data: enriched, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /journeys
onboardingRouter.post('/journeys', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const parsed = onboardingJourneyCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const template = await prisma.onboardingTemplate.findUnique({
      where: { id: parsed.data.templateId },
      include: { steps: true },
    });
    if (!template) return res.status(404).json({ error: 'Template nicht gefunden.' });

    const journey = await prisma.onboardingJourney.create({
      data: {
        ...parsed.data,
        tenantId,
        progress: {
          create: template.steps.map((step) => ({ stepId: step.id, status: 'PENDING' })),
        },
      },
      include: {
        template: { select: { id: true, name: true, durationDays: true } },
        user: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        progress: { include: { step: true }, orderBy: { step: { sortOrder: 'asc' } } },
      },
    });
    res.status(201).json(journey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /journeys/:id
onboardingRouter.get('/journeys/:id', async (req, res) => {
  try {
    const journey = await prisma.onboardingJourney.findUnique({
      where: { id: req.params['id'] },
      include: {
        template: { select: { id: true, name: true, durationDays: true } },
        user: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        progress: { include: { step: true }, orderBy: { step: { sortOrder: 'asc' } } },
      },
    });
    if (!journey) return res.status(404).json({ error: 'Journey nicht gefunden.' });
    res.json(journey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /journeys/:id/status — Change journey status (COMPLETE / CANCEL)
onboardingRouter.put('/journeys/:id/status', async (req, res) => {
  try {
    const { status } = req.body as { status: string };
    if (!['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Ungueltiger Status.' });
    }
    const data: Record<string, unknown> = { status };
    if (status === 'COMPLETED') data['completedAt'] = new Date();
    if (status === 'IN_PROGRESS') data['completedAt'] = null;

    const journey = await prisma.onboardingJourney.update({
      where: { id: req.params['id'] },
      data,
      include: {
        template: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    res.json(journey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /journeys/:id/mentor — Assign/change mentor
onboardingRouter.put('/journeys/:id/mentor', async (req, res) => {
  try {
    const { mentorId } = req.body as { mentorId: string | null };
    const journey = await prisma.onboardingJourney.update({
      where: { id: req.params['id'] },
      data: { mentorId: mentorId || null },
      include: {
        user: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } },
      },
    });
    res.json(journey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /journeys/:id/steps/:sid — Update step progress
onboardingRouter.put('/journeys/:id/steps/:sid', async (req, res) => {
  try {
    const parsed = onboardingStepUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'COMPLETED') data['completedAt'] = new Date();
    if (parsed.data.verifiedBy === undefined && parsed.data.status === 'COMPLETED') {
      data['verifiedBy'] = req.user!.sub;
    }

    const progress = await prisma.onboardingProgress.update({
      where: { journeyId_stepId: { journeyId: req.params['id']!, stepId: req.params['sid']! } },
      data,
      include: { step: true },
    });

    // Check if all required steps are completed -> auto-complete journey
    const allProgress = await prisma.onboardingProgress.findMany({
      where: { journeyId: req.params['id'] },
      include: { step: true },
    });
    const allRequiredDone = allProgress
      .filter((p) => p.step.isRequired)
      .every((p) => p.status === 'COMPLETED' || p.status === 'SKIPPED');
    if (allRequiredDone) {
      await prisma.onboardingJourney.update({
        where: { id: req.params['id'] },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    res.json(progress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DASHBOARD ─────────────────────────────────────────

onboardingRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const journeys = await prisma.onboardingJourney.findMany({
      where,
      include: {
        template: { select: { id: true, name: true, durationDays: true } },
        user: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        progress: { include: { step: { select: { isRequired: true } } } },
      },
    });

    const total = journeys.length;
    const active = journeys.filter((j) => j.status === 'IN_PROGRESS').length;
    const completed = journeys.filter((j) => j.status === 'COMPLETED').length;
    const cancelled = journeys.filter((j) => j.status === 'CANCELLED').length;

    // Average progress for active journeys
    const activeJourneys = journeys.filter((j) => j.status === 'IN_PROGRESS');
    const avgProgress =
      activeJourneys.length > 0
        ? Math.round(
            activeJourneys.reduce((sum, j) => {
              const totalSteps = j.progress.length;
              const done = j.progress.filter((p) => p.status === 'COMPLETED' || p.status === 'SKIPPED').length;
              return sum + (totalSteps > 0 ? (done / totalSteps) * 100 : 0);
            }, 0) / activeJourneys.length,
          )
        : 0;

    // Average completion time (in days)
    const completedJourneys = journeys.filter((j) => j.status === 'COMPLETED' && j.completedAt);
    const avgCompletionDays =
      completedJourneys.length > 0
        ? Math.round(
            completedJourneys.reduce((sum, j) => {
              const start = new Date(j.startDate).getTime();
              const end = new Date(j.completedAt!).getTime();
              return sum + (end - start) / (1000 * 60 * 60 * 24);
            }, 0) / completedJourneys.length,
          )
        : 0;

    // By store breakdown
    const storeMap = new Map<string, { storeName: string; total: number; active: number; completed: number; avgProgress: number }>();
    journeys.forEach((j) => {
      const key = j.storeId;
      const existing = storeMap.get(key) || {
        storeName: j.store?.name ?? key,
        total: 0,
        active: 0,
        completed: 0,
        avgProgress: 0,
      };
      existing.total++;
      if (j.status === 'IN_PROGRESS') existing.active++;
      if (j.status === 'COMPLETED') existing.completed++;
      storeMap.set(key, existing);
    });
    const byStore = Array.from(storeMap.entries()).map(([storeId, d]) => ({ storeId, ...d }));

    // By template breakdown
    const templateMap = new Map<string, { templateName: string; total: number; active: number; completed: number }>();
    journeys.forEach((j) => {
      const key = j.templateId;
      const existing = templateMap.get(key) || {
        templateName: j.template?.name ?? key,
        total: 0,
        active: 0,
        completed: 0,
      };
      existing.total++;
      if (j.status === 'IN_PROGRESS') existing.active++;
      if (j.status === 'COMPLETED') existing.completed++;
      templateMap.set(key, existing);
    });
    const byTemplate = Array.from(templateMap.entries()).map(([templateId, d]) => ({ templateId, ...d }));

    // Mentor overview
    const mentorMap = new Map<string, { mentorName: string; assigned: number; completed: number }>();
    journeys.forEach((j) => {
      if (!j.mentorId || !j.mentor) return;
      const existing = mentorMap.get(j.mentorId) || { mentorName: j.mentor.name, assigned: 0, completed: 0 };
      existing.assigned++;
      if (j.status === 'COMPLETED') existing.completed++;
      mentorMap.set(j.mentorId, existing);
    });
    const byMentor = Array.from(mentorMap.entries()).map(([mentorId, d]) => ({ mentorId, ...d }));

    // Recent completions
    const recentCompletions = completedJourneys
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 5)
      .map((j) => ({
        id: j.id,
        userName: j.user?.name ?? 'Unbekannt',
        templateName: j.template?.name ?? '—',
        storeName: j.store?.name ?? '—',
        completedAt: j.completedAt,
      }));

    res.json({
      kpis: { total, active, completed, cancelled, avgProgress, avgCompletionDays },
      byStore,
      byTemplate,
      byMentor,
      recentCompletions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
