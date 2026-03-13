import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { courseCreateSchema, courseUpdateSchema, courseModuleCreateSchema, enrollmentCreateSchema, enrollmentProgressSchema } from '@shared/validators';

export const trainingHubRouter: RouterType = Router();
trainingHubRouter.use(authenticate, requireToolAccess('training.training_hub_lms'));

// GET /courses
trainingHubRouter.get('/courses', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.category) where['category'] = req.query.category;

    const [data, total] = await Promise.all([
      prisma.course.findMany({
        where, include: { _count: { select: { modules: true, enrollments: true } } },
        orderBy: { updatedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.course.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /courses
trainingHubRouter.post('/courses', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = courseCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const course = await prisma.course.create({ data: { ...parsed.data, tenantId, createdBy: userId } });
    res.status(201).json(course);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /courses/:id
trainingHubRouter.get('/courses/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params['id'] },
      include: { modules: { orderBy: { sortOrder: 'asc' } }, _count: { select: { enrollments: true } } },
    });
    if (!course) return res.status(404).json({ error: 'Kurs nicht gefunden.' });
    res.json(course);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /courses/:id
trainingHubRouter.put('/courses/:id', async (req, res) => {
  try {
    const parsed = courseUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const course = await prisma.course.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(course);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /courses/:id/modules
trainingHubRouter.post('/courses/:id/modules', async (req, res) => {
  try {
    const parsed = courseModuleCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const mod = await prisma.courseModule.create({ data: { ...parsed.data, courseId: req.params['id']! } });
    res.status(201).json(mod);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /courses/:id/enroll
trainingHubRouter.post('/courses/:id/enroll', async (req, res) => {
  try {
    const parsed = enrollmentCreateSchema.safeParse({ ...req.body, courseId: req.params['id'] });
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const enrollment = await prisma.courseEnrollment.create({ data: parsed.data });
    res.status(201).json(enrollment);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /enrollments
trainingHubRouter.get('/enrollments', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { course: { tenantId } };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.courseId) where['courseId'] = req.query.courseId;
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.courseEnrollment.findMany({
        where,
        include: { course: { select: { id: true, title: true } }, user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.courseEnrollment.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /enrollments/:id/progress
trainingHubRouter.put('/enrollments/:id/progress', async (req, res) => {
  try {
    const parsed = enrollmentProgressSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const data: Record<string, unknown> = { progress: parsed.data.progress };
    if (parsed.data.status) data['status'] = parsed.data.status;
    if (parsed.data.progress >= 100) { data['status'] = 'COMPLETED'; data['completedAt'] = new Date(); }
    const enrollment = await prisma.courseEnrollment.update({ where: { id: req.params['id'] }, data });
    res.json(enrollment);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /reports/completion
trainingHubRouter.get('/reports/completion', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { course: { tenantId } },
      select: { status: true, progress: true, courseId: true },
    });
    const byStatus: Record<string, number> = {};
    for (const e of enrollments) { byStatus[e.status] = (byStatus[e.status] ?? 0) + 1; }
    const avgProgress = enrollments.length > 0 ? Math.round(enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length) : 0;
    res.json({ total: enrollments.length, byStatus, avgProgress });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
