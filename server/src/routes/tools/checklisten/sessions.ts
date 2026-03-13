import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { requireMinRole } from '../../../middleware/auth.js';
import { logAudit } from '../../../lib/audit.js';
import { checklistSessionCreateSchema } from '@shared/validators';

export const checklistenSessionsRouter: RouterType = Router();

// GET /sessions — Liste mit Pagination und Filter
checklistenSessionsRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize'] as string) || 20));
    const status = req.query['status'] as string | undefined;
    const storeId = req.query['storeId'] as string | undefined;

    const where: Record<string, unknown> = { tenantId };

    // Beschränke auf zugängliche Stores
    if (toolStoreIds !== 'all') {
      where['storeId'] = { in: toolStoreIds };
    }
    if (status) where['status'] = status;
    if (storeId) where['storeId'] = storeId;

    const [sessions, total] = await Promise.all([
      prisma.checklistSession.findMany({
        where,
        include: {
          template: { select: { id: true, name: true } },
          store: { select: { id: true, name: true, city: true } },
          _count: { select: { entries: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.checklistSession.count({ where }),
    ]);

    res.json({ data: sessions, total, page, pageSize });
  } catch (err) {
    console.error('Checklisten sessions list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /sessions — Neue Checklisten-Session starten
checklistenSessionsRouter.post(
  '/',
  requireMinRole('store_manager'),
  async (req, res) => {
    try {
      const result = checklistSessionCreateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;
      const tenantId = (req as any).tenantId as string;
      const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
      const userId = req.user!.sub;

      // Prüfe Store-Zugriff
      if (toolStoreIds !== 'all' && !toolStoreIds.includes(data.storeId)) {
        res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
        return;
      }

      // Prüfe ob Template existiert und zugänglich ist
      const template = await prisma.checklistTemplate.findUnique({
        where: { id: data.templateId },
      });

      if (!template || !template.isActive) {
        res.status(404).json({ error: 'Template nicht gefunden.' });
        return;
      }

      if (template.tenantId !== null && template.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses Template.' });
        return;
      }

      const session = await prisma.checklistSession.create({
        data: {
          tenantId,
          storeId: data.storeId,
          templateId: data.templateId,
          conductedBy: userId,
          notes: data.notes ?? null,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
        include: {
          template: {
            include: {
              sections: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  items: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
          store: { select: { id: true, name: true, city: true } },
        },
      });

      await logAudit({
        tenantId,
        userId,
        action: 'CREATE',
        entity: 'ChecklistSession',
        entityId: session.id,
        details: `Checkliste gestartet in Store ${data.storeId}`,
        ipAddress: req.ip ?? null,
      });

      res.status(201).json(session);
    } catch (err) {
      console.error('Checklisten session create error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// GET /sessions/:id — Session-Detail mit allen Entries und Template-Struktur
checklistenSessionsRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const sessionId = req.params['id'] as string;

    const session = await prisma.checklistSession.findUnique({
      where: { id: sessionId },
      include: {
        template: {
          include: {
            sections: {
              orderBy: { sortOrder: 'asc' },
              include: {
                items: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        store: { select: { id: true, name: true, city: true } },
        entries: {
          include: { item: true },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Checklisten-Session nicht gefunden.' });
      return;
    }

    if (session.tenantId !== tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
      return;
    }

    if (toolStoreIds !== 'all' && !toolStoreIds.includes(session.storeId)) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
      return;
    }

    res.json(session);
  } catch (err) {
    console.error('Checklisten session detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /sessions/:id/complete — Checkliste abschließen + Completion Rate berechnen
checklistenSessionsRouter.post(
  '/:id/complete',
  requireMinRole('store_manager'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['id'] as string;

      const session = await prisma.checklistSession.findUnique({
        where: { id: sessionId },
        include: {
          template: {
            include: {
              sections: {
                include: {
                  items: true,
                },
              },
            },
          },
          entries: true,
        },
      });

      if (!session) {
        res.status(404).json({ error: 'Checklisten-Session nicht gefunden.' });
        return;
      }

      if (session.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (session.status === 'COMPLETED') {
        res.status(400).json({ error: 'Checkliste ist bereits abgeschlossen.' });
        return;
      }

      if (session.status === 'CANCELLED') {
        res.status(400).json({ error: 'Abgebrochene Checkliste kann nicht abgeschlossen werden.' });
        return;
      }

      // Completion Rate berechnen: beantwortete Einträge / Gesamtanzahl Items * 100
      const totalItems = session.template.sections.reduce(
        (sum, sec) => sum + sec.items.length,
        0,
      );
      const answeredEntries = session.entries.length;
      const completionRate = totalItems > 0
        ? Math.round((answeredEntries / totalItems) * 1000) / 10
        : 0;

      const completed = await prisma.checklistSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completionRate,
          completedAt: new Date(),
        },
        include: {
          template: {
            include: {
              sections: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  items: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
          store: { select: { id: true, name: true, city: true } },
          entries: {
            include: { item: true },
          },
        },
      });

      await logAudit({
        tenantId,
        userId: req.user!.sub,
        action: 'COMPLETE',
        entity: 'ChecklistSession',
        entityId: session.id,
        details: `Checkliste abgeschlossen, Completion Rate: ${completionRate.toFixed(1)}%`,
        ipAddress: req.ip ?? null,
      });

      res.json(completed);
    } catch (err) {
      console.error('Checklisten session complete error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// DELETE /sessions/:id — Session abbrechen (Status auf CANCELLED setzen)
checklistenSessionsRouter.delete(
  '/:id',
  requireMinRole('store_manager'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['id'] as string;

      const existing = await prisma.checklistSession.findUnique({
        where: { id: sessionId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Checklisten-Session nicht gefunden.' });
        return;
      }

      if (existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (existing.status === 'COMPLETED') {
        res.status(400).json({ error: 'Abgeschlossene Checklisten können nicht abgebrochen werden.' });
        return;
      }

      await prisma.checklistSession.update({
        where: { id: sessionId },
        data: { status: 'CANCELLED' },
      });

      await logAudit({
        tenantId,
        userId: req.user!.sub,
        action: 'CANCEL',
        entity: 'ChecklistSession',
        entityId: sessionId,
        ipAddress: req.ip ?? null,
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Checklisten session delete error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);
