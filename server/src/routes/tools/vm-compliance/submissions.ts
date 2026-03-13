import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { vmSubmissionCreateSchema } from '@shared/validators';
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

export const vmSubmissionsRouter: RouterType = Router();

// GET /  — Paginierte Liste (Filter: status, storeId, guidelineId)
vmSubmissionsRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (req.query.guidelineId) where['guidelineId'] = req.query.guidelineId;
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.vmSubmission.findMany({
        where,
        include: {
          guideline: { select: { id: true, name: true, category: true, referencePhoto: true } },
          store: { select: { id: true, name: true, city: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vmSubmission.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error('VM submissions list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /  — Neue Submission einreichen
vmSubmissionsRouter.post('/', upload.single('photo'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = vmSubmissionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    if (!req.file) return res.status(400).json({ error: 'Foto ist erforderlich.' });

    // Verify guideline exists and belongs to tenant
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
  } catch (err) {
    console.error('VM submission create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /:id  — Detail
vmSubmissionsRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const submission = await prisma.vmSubmission.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        guideline: true,
        store: { select: { id: true, name: true, city: true } },
      },
    });
    if (!submission) return res.status(404).json({ error: 'Submission nicht gefunden.' });
    res.json(submission);
  } catch (err) {
    console.error('VM submission detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
