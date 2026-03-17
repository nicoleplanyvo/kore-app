import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  newsletterCreateSchema,
  newsletterUpdateSchema,
  newsletterSectionSchema,
} from '@shared/validators';

export const newsletterRouter: RouterType = Router();
newsletterRouter.use(authenticate, requireToolAccess('komm.team_newsletter'));

// ── LIST ────────────────────────────────────────────

// GET / — List newsletters for tenant (paginated, filterable)
newsletterRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };

    if (req.query.status) where['status'] = req.query.status;
    if (req.query.search) {
      where['title'] = { contains: req.query.search as string };
    }

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

// ── CREATE ──────────────────────────────────────────

// POST / — Create newsletter
newsletterRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = newsletterCreateSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const newsletter = await prisma.newsletter.create({
      data: { ...parsed.data, tenantId, createdBy: userId },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { sections: true, views: true } },
      },
    });
    res.status(201).json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DASHBOARD / REPORTS ─────────────────────────────

// GET /dashboard — Engagement analytics
newsletterRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { tenantId };

    if (req.query.from || req.query.to) {
      const createdAt: Record<string, unknown> = {};
      if (req.query.from) createdAt['gte'] = new Date(req.query.from as string);
      if (req.query.to) createdAt['lte'] = new Date((req.query.to as string) + 'T23:59:59');
      where['createdAt'] = createdAt;
    }

    const newsletters = await prisma.newsletter.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { sections: true, views: true } },
        views: { select: { viewedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = newsletters.length;
    const drafts = newsletters.filter((n) => n.status === 'DRAFT').length;
    const published = newsletters.filter((n) => n.status === 'PUBLISHED').length;
    const archived = newsletters.filter((n) => n.status === 'ARCHIVED').length;
    const totalViews = newsletters.reduce((s, n) => s + n._count.views, 0);
    const totalSections = newsletters.reduce((s, n) => s + n._count.sections, 0);
    const avgViewsPerNewsletter = published > 0
      ? Math.round((totalViews / published) * 10) / 10
      : 0;
    const avgSectionsPerNewsletter = total > 0
      ? Math.round((totalSections / total) * 10) / 10
      : 0;

    // Top newsletters by views
    const topByViews = newsletters
      .filter((n) => n.status === 'PUBLISHED')
      .sort((a, b) => b._count.views - a._count.views)
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        title: n.title,
        views: n._count.views,
        sections: n._count.sections,
        publishedAt: n.publishedAt,
        creator: n.creator,
      }));

    // Author performance
    const authorMap = new Map<string, { id: string; name: string; count: number; totalViews: number; published: number }>();
    newsletters.forEach((n) => {
      const existing = authorMap.get(n.createdBy) || {
        id: n.createdBy,
        name: n.creator?.name || 'Unbekannt',
        count: 0,
        totalViews: 0,
        published: 0,
      };
      existing.count++;
      existing.totalViews += n._count.views;
      if (n.status === 'PUBLISHED') existing.published++;
      authorMap.set(n.createdBy, existing);
    });
    const authorPerformance = Array.from(authorMap.values())
      .map((a) => ({ ...a, avgViews: a.published > 0 ? Math.round(a.totalViews / a.published) : 0 }))
      .sort((a, b) => b.totalViews - a.totalViews);

    // Trend data by month
    const monthMap = new Map<string, { created: number; published: number; views: number }>();
    newsletters.forEach((n) => {
      const d = new Date(n.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key) || { created: 0, published: 0, views: 0 };
      existing.created++;
      if (n.status === 'PUBLISHED') existing.published++;
      existing.views += n._count.views;
      monthMap.set(key, existing);
    });
    const trends = Array.from(monthMap.entries())
      .map(([month, d]) => ({ month, ...d }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Views over time (daily for last 30 days)
    const viewsByDay = new Map<string, number>();
    newsletters.forEach((n) => {
      n.views.forEach((v) => {
        const day = new Date(v.viewedAt).toISOString().split('T')[0] as string;
        viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1);
      });
    });
    const dailyViews = Array.from(viewsByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    res.json({
      kpis: {
        total,
        drafts,
        published,
        archived,
        totalViews,
        totalSections,
        avgViewsPerNewsletter,
        avgSectionsPerNewsletter,
      },
      topByViews,
      authorPerformance,
      trends,
      dailyViews,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/engagement — Legacy engagement endpoint
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
    res.json({
      totalNewsletters: total,
      publishedCount: published,
      totalViews,
      avgViews: total > 0 ? Math.round((totalViews / total) * 100) / 100 : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DETAIL ──────────────────────────────────────────

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

// ── UPDATE ──────────────────────────────────────────

// PUT /:id — Update newsletter
newsletterRouter.put('/:id', async (req, res) => {
  try {
    const parsed = newsletterUpdateSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const newsletter = await prisma.newsletter.update({
      where: { id: req.params['id'] },
      data: parsed.data,
      include: {
        creator: { select: { id: true, name: true } },
        sections: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { views: true } },
      },
    });
    res.json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── PUBLISH ─────────────────────────────────────────

// POST /:id/publish — Publish newsletter
newsletterRouter.post('/:id/publish', async (req, res) => {
  try {
    const newsletter = await prisma.newsletter.update({
      where: { id: req.params['id'] },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { views: true } },
      },
    });
    res.json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/archive — Archive newsletter
newsletterRouter.post('/:id/archive', async (req, res) => {
  try {
    const newsletter = await prisma.newsletter.update({
      where: { id: req.params['id'] },
      data: { status: 'ARCHIVED' },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { views: true } },
      },
    });
    res.json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/duplicate — Duplicate newsletter as draft
newsletterRouter.post('/:id/duplicate', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const original = await prisma.newsletter.findUnique({
      where: { id: req.params['id'] },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!original) return res.status(404).json({ error: 'Newsletter nicht gefunden.' });

    const copy = await prisma.newsletter.create({
      data: {
        tenantId,
        createdBy: userId,
        title: `${original.title} (Kopie)`,
        content: original.content,
        status: 'DRAFT',
        sections: {
          create: original.sections.map((s) => ({
            title: s.title,
            content: s.content,
            sortOrder: s.sortOrder,
          })),
        },
      },
      include: {
        creator: { select: { id: true, name: true } },
        sections: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { sections: true, views: true } },
      },
    });
    res.status(201).json(copy);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── SECTIONS ────────────────────────────────────────

// POST /:id/sections — Add section to newsletter
newsletterRouter.post('/:id/sections', async (req, res) => {
  try {
    const parsed = newsletterSectionSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    // Auto-assign sortOrder if not provided
    const maxOrder = await prisma.newsletterSection.findFirst({
      where: { newsletterId: req.params['id']! },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const sortOrder = parsed.data.sortOrder ?? ((maxOrder?.sortOrder ?? -1) + 1);

    const section = await prisma.newsletterSection.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        sortOrder,
        newsletterId: req.params['id']!,
      },
    });
    res.status(201).json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /sections/:sectionId — Update a section
newsletterRouter.put('/sections/:sectionId', async (req, res) => {
  try {
    const parsed = newsletterSectionSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const section = await prisma.newsletterSection.update({
      where: { id: req.params['sectionId'] },
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        sortOrder: parsed.data.sortOrder,
      },
    });
    res.json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /sections/:sectionId — Delete a section
newsletterRouter.delete('/sections/:sectionId', async (req, res) => {
  try {
    await prisma.newsletterSection.delete({ where: { id: req.params['sectionId'] } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id/sections/reorder — Reorder sections
newsletterRouter.put('/:id/sections/reorder', async (req, res) => {
  try {
    const { order } = req.body as { order: string[] };
    if (!Array.isArray(order)) return res.status(400).json({ error: 'order muss ein Array sein.' });

    await Promise.all(
      order.map((sectionId, idx) =>
        prisma.newsletterSection.update({
          where: { id: sectionId },
          data: { sortOrder: idx },
        }),
      ),
    );

    const sections = await prisma.newsletterSection.findMany({
      where: { newsletterId: req.params['id']! },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── VIEWS ───────────────────────────────────────────

// POST /:id/view — Record view
newsletterRouter.post('/:id/view', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const view = await prisma.newsletterView.upsert({
      where: {
        newsletterId_userId: { newsletterId: req.params['id']!, userId },
      },
      create: { newsletterId: req.params['id']!, userId },
      update: { viewedAt: new Date() },
    });
    res.status(201).json(view);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /:id — Delete newsletter (soft: archive)
newsletterRouter.delete('/:id', async (req, res) => {
  try {
    const newsletter = await prisma.newsletter.update({
      where: { id: req.params['id'] },
      data: { status: 'ARCHIVED' },
    });
    res.json(newsletter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
