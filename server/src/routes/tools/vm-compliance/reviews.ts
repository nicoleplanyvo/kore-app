import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { vmReviewSchema } from '@shared/validators';

export const vmReviewsRouter: RouterType = Router();

// PUT /submissions/:id/review  — Genehmigen / Ablehnen
vmReviewsRouter.put('/submissions/:id/review', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = vmReviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    // Only review PENDING submissions
    const submission = await prisma.vmSubmission.findFirst({
      where: { id: req.params.id, tenantId, status: 'PENDING' },
    });
    if (!submission) return res.status(404).json({ error: 'Submission nicht gefunden oder bereits bearbeitet.' });

    const updated = await prisma.vmSubmission.update({
      where: { id: req.params.id },
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
  } catch (err) {
    console.error('VM review error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /pending  — Offene Reviews
vmReviewsRouter.get('/pending', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId, status: 'PENDING' };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.vmSubmission.findMany({
        where,
        include: {
          guideline: { select: { id: true, name: true, category: true, referencePhoto: true } },
          store: { select: { id: true, name: true, city: true } },
        },
        orderBy: { submittedAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vmSubmission.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error('VM pending reviews error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
