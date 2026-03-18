import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { z } from 'zod';

export const checklistenRouter: RouterType = Router();
checklistenRouter.use(authenticate, requireToolAccess('standards.checklisten'));

// ── Validators ────────────────────────────────────────────
const templateCreateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  recurrence: z.enum(['daily', 'weekly', 'monthly']).optional(),
  storeId: z.string().optional(),
  sections: z.array(z.object({
    name: z.string().min(1).max(100),
    sortOrder: z.number().int().min(0).default(0),
    items: z.array(z.object({
      text: z.string().min(1).max(500),
      sortOrder: z.number().int().min(0).default(0),
    })).min(1),
  })).min(1),
});

const templateUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  recurrence: z.enum(['daily', 'weekly', 'monthly']).nullish(),
  isActive: z.boolean().optional(),
  sections: z.array(z.object({
    name: z.string().min(1).max(100),
    sortOrder: z.number().int().min(0).default(0),
    items: z.array(z.object({
      text: z.string().min(1).max(500),
      sortOrder: z.number().int().min(0).default(0),
    })).min(1),
  })).optional(),
});

const checklistCreateSchema = z.object({
  storeId: z.string().min(1),
  templateId: z.string().optional(),
  title: z.string().min(2).max(120).optional(),
  dueDate: z.string().optional(),
  items: z.array(z.object({
    text: z.string().min(1).max(500),
  })).optional(),
});

// ── Helpers ───────────────────────────────────────────────
function buildStoreWhere(toolStoreIds: string[] | 'all', tenantId: string) {
  const where: Record<string, unknown> = { isActive: true };
  if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
  else if (tenantId) where['tenantId'] = tenantId;
  return where;
}

function buildSessionWhere(tenantId: string, toolStoreIds: string[] | 'all', query: Record<string, unknown>) {
  const where: Record<string, unknown> = { tenantId };
  if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
  if (query['storeId']) where['storeId'] = query['storeId'];
  if (query['status']) where['status'] = query['status'];
  if (query['date']) {
    const d = new Date(query['date'] as string);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);
    where['startedAt'] = { gte: d, lt: nextD };
  }
  return where;
}

// ── GET /stores ───────────────────────────────────────────
checklistenRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const stores = await prisma.store.findMany({
      where: buildStoreWhere(toolStoreIds, tenantId),
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /templates ────────────────────────────────────────
checklistenRouter.get('/templates', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const storeId = req.query['storeId'] as string | undefined;

    const orConditions: Record<string, unknown>[] = [
      { tenantId: null, isDefault: true },
      { tenantId },
    ];

    const templates = await prisma.checklistTemplate.findMany({
      where: { isActive: true, OR: orConditions },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: { items: { orderBy: { sortOrder: 'asc' } } },
        },
        _count: { select: { sessions: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    res.json(templates);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /templates ───────────────────────────────────────
checklistenRouter.post('/templates', async (req, res) => {
  try {
    const parsed = templateCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const data = parsed.data;
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const isKoreDefault = req.user!.role === 'kore_admin' && req.body.isDefault === true;

    const template = await prisma.checklistTemplate.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        tenantId: isKoreDefault ? null : tenantId,
        isDefault: isKoreDefault,
        createdBy: userId,
        sections: {
          create: data.sections.map((sec, si) => ({
            name: sec.name,
            sortOrder: sec.sortOrder ?? si,
            items: {
              create: sec.items.map((item, ii) => ({
                text: item.text,
                type: 'BOOLEAN',
                isRequired: false,
                sortOrder: item.sortOrder ?? ii,
              })),
            },
          })),
        },
      },
      include: {
        sections: { orderBy: { sortOrder: 'asc' }, include: { items: { orderBy: { sortOrder: 'asc' } } } },
      },
    });

    res.status(201).json(template);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /templates/:id ────────────────────────────────────
checklistenRouter.put('/templates/:id', async (req, res) => {
  try {
    const parsed = templateUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.' });

    const tenantId = (req as any).tenantId as string;
    const existing = await prisma.checklistTemplate.findUnique({ where: { id: req.params['id'] } });
    if (!existing) return res.status(404).json({ error: 'Vorlage nicht gefunden.' });
    if (existing.tenantId !== null && existing.tenantId !== tenantId) return res.status(403).json({ error: 'Kein Zugriff.' });
    if (existing.isDefault && req.user!.role !== 'kore_admin') return res.status(403).json({ error: 'Standard-Vorlagen nur von Admins bearbeitbar.' });

    const data = parsed.data;

    // If sections provided, delete old and recreate
    if (data.sections) {
      await prisma.checklistSection.deleteMany({ where: { templateId: existing.id } });
    }

    const template = await prisma.checklistTemplate.update({
      where: { id: existing.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        version: { increment: 1 },
        ...(data.sections && {
          sections: {
            create: data.sections.map((sec, si) => ({
              name: sec.name,
              sortOrder: sec.sortOrder ?? si,
              items: {
                create: sec.items.map((item, ii) => ({
                  text: item.text,
                  type: 'BOOLEAN',
                  isRequired: false,
                  sortOrder: item.sortOrder ?? ii,
                })),
              },
            })),
          },
        }),
      },
      include: {
        sections: { orderBy: { sortOrder: 'asc' }, include: { items: { orderBy: { sortOrder: 'asc' } } } },
      },
    });

    res.json(template);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── DELETE /templates/:id ─────────────────────────────────
checklistenRouter.delete('/templates/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const existing = await prisma.checklistTemplate.findUnique({ where: { id: req.params['id'] } });
    if (!existing) return res.status(404).json({ error: 'Vorlage nicht gefunden.' });
    if (existing.tenantId !== null && existing.tenantId !== tenantId) return res.status(403).json({ error: 'Kein Zugriff.' });
    if (existing.isDefault && req.user!.role !== 'kore_admin') return res.status(403).json({ error: 'Standard-Vorlagen nur von Admins loeschbar.' });

    await prisma.checklistTemplate.update({ where: { id: existing.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /checklists ───────────────────────────────────────
checklistenRouter.get('/checklists', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query['page']) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query['pageSize']) || 20));
    const where = buildSessionWhere(tenantId, toolStoreIds, req.query as Record<string, unknown>);

    const [data, total] = await Promise.all([
      prisma.checklistSession.findMany({
        where,
        include: {
          template: { select: { id: true, name: true } },
          store: { select: { id: true, name: true, city: true } },
          conductor: { select: { id: true, name: true } },
          _count: { select: { entries: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.checklistSession.count({ where }),
    ]);

    // Enrich with total items count from template
    const enriched = await Promise.all(data.map(async (session) => {
      const totalItems = await prisma.checklistItem.count({
        where: { section: { templateId: session.templateId } },
      });
      const checkedItems = await prisma.checklistEntry.count({
        where: { sessionId: session.id, valueBool: true },
      });
      return { ...session, totalItems, checkedItems };
    }));

    res.json({ data: enriched, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /checklists/:id ──────────────────────────────────
checklistenRouter.get('/checklists/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const session = await prisma.checklistSession.findUnique({
      where: { id: req.params['id'] },
      include: {
        template: {
          include: {
            sections: {
              orderBy: { sortOrder: 'asc' },
              include: { items: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
        store: { select: { id: true, name: true, city: true } },
        conductor: { select: { id: true, name: true } },
        entries: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!session) return res.status(404).json({ error: 'Checkliste nicht gefunden.' });
    if (session.tenantId !== tenantId) return res.status(403).json({ error: 'Kein Zugriff.' });

    // Enrich entries with who checked (conductor info stored in entry answeredAt)
    const totalItems = session.template.sections.reduce((s, sec) => s + sec.items.length, 0);
    const checkedItems = session.entries.filter(e => e.valueBool === true).length;

    res.json({ ...session, totalItems, checkedItems });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /checklists ─────────────────────────────────────
checklistenRouter.post('/checklists', async (req, res) => {
  try {
    const parsed = checklistCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const data = parsed.data;
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;

    if (toolStoreIds !== 'all' && !toolStoreIds.includes(data.storeId)) {
      return res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
    }

    let templateId = data.templateId;

    // If no template, create an ad-hoc one
    if (!templateId && data.items && data.items.length > 0) {
      const adHocTemplate = await prisma.checklistTemplate.create({
        data: {
          name: data.title || 'Ad-hoc Checkliste',
          description: 'Individuelle Checkliste',
          tenantId,
          isDefault: false,
          createdBy: userId,
          sections: {
            create: [{
              name: 'Aufgaben',
              sortOrder: 0,
              items: {
                create: data.items.map((item, i) => ({
                  text: item.text,
                  type: 'BOOLEAN',
                  isRequired: false,
                  sortOrder: i,
                })),
              },
            }],
          },
        },
      });
      templateId = adHocTemplate.id;
    }

    if (!templateId) return res.status(400).json({ error: 'Template oder Items erforderlich.' });

    const session = await prisma.checklistSession.create({
      data: {
        tenantId,
        storeId: data.storeId,
        templateId,
        conductedBy: userId,
        status: 'IN_PROGRESS',
        notes: data.dueDate ? `Frist: ${data.dueDate}` : null,
        startedAt: new Date(),
      },
      include: {
        template: {
          include: {
            sections: { orderBy: { sortOrder: 'asc' }, include: { items: { orderBy: { sortOrder: 'asc' } } } },
          },
        },
        store: { select: { id: true, name: true, city: true } },
      },
    });

    res.status(201).json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /checklists/:id/items/:itemId — Toggle check ─────
checklistenRouter.put('/checklists/:id/items/:itemId', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const sessionId = req.params['id'] as string;
    const itemId = req.params['itemId'] as string;

    const session = await prisma.checklistSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Checkliste nicht gefunden.' });
    if (session.tenantId !== tenantId) return res.status(403).json({ error: 'Kein Zugriff.' });
    if ((session.status as string) !== 'IN_PROGRESS') return res.status(400).json({ error: 'Checkliste kann nicht mehr bearbeitet werden.' });

    // Check if item belongs to the template
    const item = await prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: { section: { select: { templateId: true } } },
    });
    if (!item || item.section.templateId !== session.templateId) {
      return res.status(404).json({ error: 'Pruefpunkt nicht gefunden.' });
    }

    // Toggle: check existing entry
    const existingEntry = await prisma.checklistEntry.findUnique({
      where: { sessionId_itemId: { sessionId, itemId } },
    });

    const newValue = existingEntry ? !(existingEntry.valueBool ?? false) : true;

    const entry = await prisma.checklistEntry.upsert({
      where: { sessionId_itemId: { sessionId, itemId } },
      update: {
        valueBool: newValue,
        comment: userId,
        answeredAt: new Date(),
      },
      create: {
        sessionId,
        itemId,
        valueBool: newValue,
        comment: userId,
      },
      include: { item: true },
    });

    // Recalculate completion and auto-complete if all done
    const totalItems = await prisma.checklistItem.count({
      where: { section: { templateId: session.templateId } },
    });
    const checkedItems = await prisma.checklistEntry.count({
      where: { sessionId, valueBool: true },
    });
    const completionRate = totalItems > 0 ? Math.round((checkedItems / totalItems) * 1000) / 10 : 0;

    const updateData: Record<string, unknown> = { completionRate };
    if (checkedItems === totalItems && totalItems > 0) {
      updateData['status'] = 'COMPLETED';
      updateData['completedAt'] = new Date();
    } else if ((session.status as string) === 'COMPLETED' && checkedItems < totalItems) {
      // Re-open if unchecked after complete
      updateData['status'] = 'IN_PROGRESS';
      updateData['completedAt'] = null;
    }

    await prisma.checklistSession.update({
      where: { id: sessionId },
      data: updateData as any,
    });

    // Fetch user name for response
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

    res.json({
      ...entry,
      checkedBy: user?.name ?? userId,
      checkedAt: entry.answeredAt,
      totalItems,
      checkedItems: newValue ? checkedItems : checkedItems,
      completionRate,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /dashboard ────────────────────────────────────────
checklistenRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = req.query['storeId'] as string | undefined;

    const baseWhere: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') baseWhere['storeId'] = { in: toolStoreIds };
    if (storeId) baseWhere['storeId'] = storeId;

    // Today's date range
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Today's checklists
    const todayWhere = { ...baseWhere, startedAt: { gte: todayStart, lt: todayEnd } };
    const todayChecklists = await prisma.checklistSession.count({ where: todayWhere });
    const todayCompleted = await prisma.checklistSession.count({ where: { ...todayWhere, status: 'COMPLETED' } });
    const todayRate = todayChecklists > 0 ? Math.round((todayCompleted / todayChecklists) * 100) : 0;

    // Overdue: IN_PROGRESS with notes containing a past due date
    const overdueChecklists = await prisma.checklistSession.findMany({
      where: {
        ...baseWhere,
        status: 'IN_PROGRESS',
        notes: { not: null },
      },
      include: {
        template: { select: { name: true } },
        store: { select: { name: true } },
      },
      orderBy: { startedAt: 'asc' },
      take: 20,
    });

    // Filter overdue by parsing date from notes
    const overdue = overdueChecklists.filter(c => {
      if (!c.notes) return false;
      const match = c.notes.match(/Frist:\s*(\d{4}-\d{2}-\d{2})/);
      if (!match) return false;
      return new Date(match[1]!) < todayStart;
    });

    // Recent history (last 7 days completed)
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentHistory = await prisma.checklistSession.findMany({
      where: { ...baseWhere, status: 'COMPLETED', completedAt: { gte: weekAgo } },
      include: {
        template: { select: { name: true } },
        store: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    // This month stats
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalThisMonth = await prisma.checklistSession.count({ where: { ...baseWhere, startedAt: { gte: monthStart } } });
    const completedThisMonth = await prisma.checklistSession.count({ where: { ...baseWhere, status: 'COMPLETED', completedAt: { gte: monthStart } } });

    // All-time completion rate
    const allCompleted = await prisma.checklistSession.findMany({
      where: { ...baseWhere, status: 'COMPLETED' },
      select: { completionRate: true },
    });
    const avgCompletion = allCompleted.length > 0
      ? Math.round(allCompleted.reduce((s, c) => s + c.completionRate, 0) / allCompleted.length * 10) / 10
      : 0;

    res.json({
      today: { total: todayChecklists, completed: todayCompleted, rate: todayRate },
      overdue: overdue.map(c => ({ id: c.id, template: c.template.name, store: c.store.name, dueDate: c.notes })),
      recentHistory: recentHistory.map(c => ({ id: c.id, template: c.template.name, store: c.store.name, completedAt: c.completedAt, completionRate: c.completionRate })),
      thisMonth: { total: totalThisMonth, completed: completedThisMonth },
      avgCompletionRate: avgCompletion,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
