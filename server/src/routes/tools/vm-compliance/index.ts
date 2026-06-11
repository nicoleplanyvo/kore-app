import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { vmSubmissionCreateSchema, vmReviewSchema } from '@shared/validators';
import { vmSpotChecksRouter } from './spot-checks.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve('data/uploads/vm-submissions');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_r, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const vmComplianceRouter: RouterType = Router();
vmComplianceRouter.use(authenticate, requireToolAccess('standards.vm_foto_compliance'));

// Spot-Checks: unangekündigte Ad-hoc-Foto-Anfragen
vmComplianceRouter.use('/spot-checks', vmSpotChecksRouter);

// GET /stores
vmComplianceRouter.get('/stores', async (req, res) => {
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

// GET /users
vmComplianceRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /checks — Compliance-Checks Liste
vmComplianceRouter.get('/checks', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.from || req.query.to) {
      where['submittedAt'] = {};
      if (req.query.from) (where['submittedAt'] as Record<string, unknown>)['gte'] = new Date(req.query.from as string);
      if (req.query.to) (where['submittedAt'] as Record<string, unknown>)['lte'] = new Date(req.query.to as string);
    }

    const [data, total] = await Promise.all([
      prisma.vmSubmission.findMany({
        where,
        include: {
          guideline: { select: { id: true, name: true, category: true, referencePhoto: true } },
          store: { select: { id: true, name: true, city: true } },
          submitter: { select: { id: true, name: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vmSubmission.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /checks — Neuen Check einreichen
vmComplianceRouter.post('/checks', upload.single('photo'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = vmSubmissionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    if (!req.file) return res.status(400).json({ error: 'Foto ist erforderlich.' });

    const guideline = await prisma.vmGuideline.findFirst({
      where: { id: parsed.data.guidelineId, tenantId, isActive: true },
    });
    if (!guideline) return res.status(404).json({ error: 'Guideline nicht gefunden.' });

    const submission = await prisma.vmSubmission.create({
      data: {
        tenantId,
        guidelineId: parsed.data.guidelineId,
        storeId: parsed.data.storeId,
        submittedBy: userId,
        photoPath: `/uploads/vm-submissions/${req.file.filename}`,
      },
      include: {
        guideline: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(submission);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /checks/:id — Check Detail
vmComplianceRouter.get('/checks/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const submission = await prisma.vmSubmission.findFirst({
      where: { id: req.params['id'], tenantId },
      include: {
        guideline: true,
        store: { select: { id: true, name: true, city: true } },
        submitter: { select: { id: true, name: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });
    if (!submission) return res.status(404).json({ error: 'Check nicht gefunden.' });
    res.json(submission);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /checks/:id — Review / Bewertung
vmComplianceRouter.put('/checks/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = vmReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const submission = await prisma.vmSubmission.findFirst({
      where: { id: req.params['id'], tenantId },
    });
    if (!submission) return res.status(404).json({ error: 'Check nicht gefunden.' });

    const updated = await prisma.vmSubmission.update({
      where: { id: req.params['id'] },
      data: {
        status: parsed.data.status,
        reviewNote: parsed.data.reviewNote || null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        guideline: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /dashboard — Dashboard-Daten
vmComplianceRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const storeFilter: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') storeFilter['storeId'] = { in: toolStoreIds };

    const [totalSubmissions, approved, rejected, pending] = await Promise.all([
      prisma.vmSubmission.count({ where: storeFilter }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'APPROVED' } }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'REJECTED' } }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'PENDING' } }),
    ]);

    const complianceRate = (approved + rejected) > 0
      ? Math.round((approved / (approved + rejected)) * 100)
      : 0;

    // Store ranking
    const storeWhere: Record<string, unknown> = { tenantId, isActive: true };
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: {
        id: true, name: true, city: true,
        vmSubmissions: { select: { status: true } },
      },
      orderBy: { name: 'asc' },
    });

    const storeRanking = stores.map((store) => {
      const storeApproved = store.vmSubmissions.filter((s) => s.status === 'APPROVED').length;
      const storeRejected = store.vmSubmissions.filter((s) => s.status === 'REJECTED').length;
      const reviewed = storeApproved + storeRejected;
      return {
        storeId: store.id,
        storeName: store.name,
        city: store.city,
        total: store.vmSubmissions.length,
        approved: storeApproved,
        rejected: storeRejected,
        complianceRate: reviewed > 0 ? Math.round((storeApproved / reviewed) * 100) : 0,
      };
    }).sort((a, b) => b.complianceRate - a.complianceRate);

    // Recent submissions for trend
    const recentSubs = await prisma.vmSubmission.findMany({
      where: { ...storeFilter, submittedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      select: { submittedAt: true, status: true },
      orderBy: { submittedAt: 'asc' },
    });

    const byWeek: Record<string, { approved: number; rejected: number; pending: number }> = {};
    for (const sub of recentSubs) {
      const weekKey = sub.submittedAt.toISOString().slice(0, 10);
      if (!byWeek[weekKey]) byWeek[weekKey] = { approved: 0, rejected: 0, pending: 0 };
      if (sub.status === 'APPROVED') byWeek[weekKey]!.approved++;
      else if (sub.status === 'REJECTED') byWeek[weekKey]!.rejected++;
      else byWeek[weekKey]!.pending++;
    }

    const trend = Object.entries(byWeek).map(([date, counts]) => ({ date, ...counts }));

    // Worst areas (by guideline category)
    const guidelines = await prisma.vmGuideline.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true, name: true, category: true,
        submissions: { select: { status: true } },
      },
    });

    const worstAreas = guidelines.map((g) => {
      const gApproved = g.submissions.filter((s) => s.status === 'APPROVED').length;
      const gRejected = g.submissions.filter((s) => s.status === 'REJECTED').length;
      const reviewed = gApproved + gRejected;
      return {
        guidelineId: g.id,
        guidelineName: g.name,
        category: g.category,
        total: g.submissions.length,
        complianceRate: reviewed > 0 ? Math.round((gApproved / reviewed) * 100) : 0,
      };
    }).sort((a, b) => a.complianceRate - b.complianceRate).slice(0, 10);

    res.json({
      totalSubmissions,
      approved,
      rejected,
      pending,
      complianceRate,
      storeRanking,
      trend,
      worstAreas,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /guidelines — VM Guidelines (for the submit form)
vmComplianceRouter.get('/guidelines', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const guidelines = await prisma.vmGuideline.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { submissions: true } } },
    });
    res.json(guidelines);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /reports/summary — Compliance-Rate Overview (legacy compat)
vmComplianceRouter.get('/reports/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeFilter: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') storeFilter['storeId'] = { in: toolStoreIds };

    const [totalSubmissions, approved, rejected, pending] = await Promise.all([
      prisma.vmSubmission.count({ where: storeFilter }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'APPROVED' } }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'REJECTED' } }),
      prisma.vmSubmission.count({ where: { ...storeFilter, status: 'PENDING' } }),
    ]);
    const complianceRate = (approved + rejected) > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0;
    res.json({ totalSubmissions, approved, rejected, pending, complianceRate });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /submissions — legacy compat
vmComplianceRouter.get('/submissions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (req.query.guidelineId) where['guidelineId'] = req.query.guidelineId;
    if (toolStoreIds !== 'all' && !req.query.storeId) where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.vmSubmission.findMany({
        where,
        include: {
          guideline: { select: { id: true, name: true, category: true, referencePhoto: true } },
          store: { select: { id: true, name: true, city: true } },
          submitter: { select: { id: true, name: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vmSubmission.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /submissions — legacy compat
vmComplianceRouter.post('/submissions', upload.single('photo'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = vmSubmissionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    if (!req.file) return res.status(400).json({ error: 'Foto ist erforderlich.' });

    const guideline = await prisma.vmGuideline.findFirst({
      where: { id: parsed.data.guidelineId, tenantId, isActive: true },
    });
    if (!guideline) return res.status(404).json({ error: 'Guideline nicht gefunden.' });

    const submission = await prisma.vmSubmission.create({
      data: {
        tenantId,
        guidelineId: parsed.data.guidelineId,
        storeId: parsed.data.storeId,
        submittedBy: userId,
        photoPath: `/uploads/vm-submissions/${req.file.filename}`,
      },
      include: {
        guideline: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(submission);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /reviews/submissions/:id/review — legacy compat
vmComplianceRouter.put('/reviews/submissions/:id/review', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = vmReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const submission = await prisma.vmSubmission.findFirst({
      where: { id: req.params['id'], tenantId },
    });
    if (!submission) return res.status(404).json({ error: 'Submission nicht gefunden.' });

    const updated = await prisma.vmSubmission.update({
      where: { id: req.params['id'] },
      data: {
        status: parsed.data.status,
        reviewNote: parsed.data.reviewNote || null,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: {
        guideline: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
