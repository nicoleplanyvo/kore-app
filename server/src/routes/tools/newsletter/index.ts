import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { newsletterCreateSchema, newsletterUpdateSchema, newsletterSectionSchema } from '@shared/validators';

export const newsletterRouter: RouterType = Router();
newsletterRouter.use(authenticate, requireToolAccess('komm.team_newsletter'));

// GET / — List newsletters for tenant
newsletterRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };

    const [data, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { sections: true, views: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.newsletter.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST / — Create newsletter
newsletterRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = newsletterCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const newsletter = await prisma.newsletter.create({
      data: { ...parsed.data, tenantId, createdBy: userId },
    });
    res.status(201).json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/engagement — View stats
newsletterRouter.get('/reports/engagement', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const newsletters = await prisma.newsletter.findMany({
      where: { tenantId },
      include: { _count: { select: { views: true } } },
    });
    const total = newsletters.length;
    const published = newsletters.filter((n) => n.status === 'PUBLISHED').length;
    const totalViews = newsletters.reduce((sum, n) => sum + n._count.views, 0);
    res.json({ totalNewsletters: total, publishedCount: published, totalViews, avgViews: total > 0 ? Math.round((totalViews / total) * 100) / 100 : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /:id — Get newsletter with sections & views count
newsletterRouter.get('/:id', async (req, res) => {
  try {
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: req.params['id'] },
      include: {
        creator: { select: { id: true, name: true } },
        sections: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { views: true } },
      },
    });
    if (!newsletter) return res.status(404).json({ error: 'Newsletter nicht gefunden.' });
    res.json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id — Update newsletter
newsletterRouter.put('/:id', async (req, res) => {
  try {
    const parsed = newsletterUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const newsletter = await prisma.newsletter.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/publish — Publish newsletter
newsletterRouter.post('/:id/publish', async (req, res) => {
  try {
    const newsletter = await prisma.newsletter.update({
      where: { id: req.params['id'] },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    res.json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/sections — Add section to newsletter
newsletterRouter.post('/:id/sections', async (req, res) => {
  try {
    const parsed = newsletterSectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const section = await prisma.newsletterSection.create({
      data: { ...parsed.data, newsletterId: req.params['id']! },
    });
    res.status(201).json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/view — Record view
newsletterRouter.post('/:id/view', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const view = await prisma.newsletterView.upsert({
      where: { newsletterId_userId: { newsletterId: req.params['id']!, userId } },
      create: { newsletterId: req.params['id']!, userId },
      update: { viewedAt: new Date() },
    });
    res.status(201).json(view);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
