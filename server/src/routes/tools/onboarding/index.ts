import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { onboardingTemplateCreateSchema, onboardingJourneyCreateSchema, onboardingStepUpdateSchema } from '@shared/validators';

export const onboardingRouter: RouterType = Router();
onboardingRouter.use(authenticate, requireToolAccess('training.onboarding'));

// GET /templates
onboardingRouter.get('/templates', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const templates = await prisma.onboardingTemplate.findMany({
      where: { tenantId },
      include: { _count: { select: { steps: true, journeys: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /templates
onboardingRouter.post('/templates', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = onboardingTemplateCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const { steps, ...templateData } = parsed.data;
    const template = await prisma.onboardingTemplate.create({
      data: {
        ...templateData,
        tenantId,
        steps: steps ? { create: steps } : undefined,
      },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });
    res.status(201).json(template);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
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
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /journeys
onboardingRouter.get('/journeys', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;

    const [data, total] = await Promise.all([
      prisma.onboardingJourney.findMany({
        where,
        include: {
          template: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          mentor: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.onboardingJourney.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /journeys
onboardingRouter.post('/journeys', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = onboardingJourneyCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    // Create journey and initialize progress for all steps
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
          create: template.steps.map(step => ({ stepId: step.id, status: 'PENDING' })),
        },
      },
      include: {
        template: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        progress: { include: { step: true }, orderBy: { step: { sortOrder: 'asc' } } },
      },
    });
    res.status(201).json(journey);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /journeys/:id
onboardingRouter.get('/journeys/:id', async (req, res) => {
  try {
    const journey = await prisma.onboardingJourney.findUnique({
      where: { id: req.params['id'] },
      include: {
        template: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        progress: { include: { step: true }, orderBy: { step: { sortOrder: 'asc' } } },
      },
    });
    if (!journey) return res.status(404).json({ error: 'Journey nicht gefunden.' });
    res.json(journey);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /journeys/:id/steps/:sid
onboardingRouter.put('/journeys/:id/steps/:sid', async (req, res) => {
  try {
    const parsed = onboardingStepUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'COMPLETED') data['completedAt'] = new Date();
    const progress = await prisma.onboardingProgress.update({
      where: { journeyId_stepId: { journeyId: req.params['id']!, stepId: req.params['sid']! } },
      data, include: { step: true },
    });

    // Check if all required steps are completed → complete journey
    const allProgress = await prisma.onboardingProgress.findMany({
      where: { journeyId: req.params['id'] },
      include: { step: true },
    });
    const allRequiredDone = allProgress.filter(p => p.step.isRequired).every(p => p.status === 'COMPLETED' || p.status === 'SKIPPED');
    if (allRequiredDone) {
      await prisma.onboardingJourney.update({ where: { id: req.params['id'] }, data: { status: 'COMPLETED', completedAt: new Date() } });
    }

    res.json(progress);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
