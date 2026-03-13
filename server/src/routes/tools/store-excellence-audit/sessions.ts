import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { requireMinRole } from '../../../middleware/auth.js';
import { logAudit } from '../../../lib/audit.js';
import { auditSessionCreateSchema } from '@shared/validators';
import { calculateAuditScore } from '@shared/validators/audit-scoring';

export const seaSessionsRouter: RouterType = Router();

// GET /sessions — Liste mit Pagination und Filter
seaSessionsRouter.get('/', async (req, res) => {
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
      prisma.auditSession.findMany({
        where,
        include: {
          template: { select: { id: true, name: true } },
          store: { select: { id: true, name: true, city: true } },
          _count: { select: { responses: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditSession.count({ where }),
    ]);

    res.json({ data: sessions, total, page, pageSize });
  } catch (err) {
    console.error('SEA sessions list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /sessions — Neues Audit starten
seaSessionsRouter.post(
  '/',
  requireMinRole('store_manager'),
  async (req, res) => {
    try {
      const result = auditSessionCreateSchema.safeParse(req.body);
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
      const template = await prisma.auditTemplate.findUnique({
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

      const session = await prisma.auditSession.create({
        data: {
          tenantId,
          storeId: data.storeId,
          templateId: data.templateId,
          conductedBy: userId,
          storeLocation: data.storeLocation ?? null,
          notes: data.notes ?? null,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
        include: {
          template: {
            include: {
              categories: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  criteria: { orderBy: { sortOrder: 'asc' } },
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
        entity: 'AuditSession',
        entityId: session.id,
        details: `Audit gestartet in Store ${data.storeId}`,
        ipAddress: req.ip ?? null,
      });

      res.status(201).json(session);
    } catch (err) {
      console.error('SEA session create error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// GET /sessions/:id — Session-Detail mit allen Responses
seaSessionsRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const sessionId = req.params['id'] as string;

    const session = await prisma.auditSession.findUnique({
      where: { id: sessionId },
      include: {
        template: {
          include: {
            categories: {
              orderBy: { sortOrder: 'asc' },
              include: {
                criteria: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        store: { select: { id: true, name: true, city: true } },
        responses: {
          include: { criterion: true },
        },
      },
    });

    if (!session) {
      res.status(404).json({ error: 'Audit-Session nicht gefunden.' });
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
    console.error('SEA session detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /sessions/:id — Session aktualisieren (Notes, Status)
seaSessionsRouter.put(
  '/:id',
  requireMinRole('store_manager'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['id'] as string;

      const existing = await prisma.auditSession.findUnique({
        where: { id: sessionId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Audit-Session nicht gefunden.' });
        return;
      }

      if (existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
        res.status(400).json({ error: 'Abgeschlossene oder abgebrochene Sessions können nicht bearbeitet werden.' });
        return;
      }

      const session = await prisma.auditSession.update({
        where: { id: sessionId },
        data: {
          notes: req.body.notes !== undefined ? req.body.notes : undefined,
          storeLocation: req.body.storeLocation !== undefined ? req.body.storeLocation : undefined,
        },
        include: {
          template: { select: { id: true, name: true } },
          store: { select: { id: true, name: true, city: true } },
        },
      });

      res.json(session);
    } catch (err) {
      console.error('SEA session update error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// POST /sessions/:id/complete — Audit abschließen + Score berechnen
seaSessionsRouter.post(
  '/:id/complete',
  requireMinRole('store_manager'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['id'] as string;

      const session = await prisma.auditSession.findUnique({
        where: { id: sessionId },
        include: {
          template: {
            include: {
              categories: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  criteria: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
          responses: true,
        },
      });

      if (!session) {
        res.status(404).json({ error: 'Audit-Session nicht gefunden.' });
        return;
      }

      if (session.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (session.status === 'COMPLETED') {
        res.status(400).json({ error: 'Audit ist bereits abgeschlossen.' });
        return;
      }

      if (session.status === 'CANCELLED') {
        res.status(400).json({ error: 'Abgebrochenes Audit kann nicht abgeschlossen werden.' });
        return;
      }

      // Score berechnen
      const scoreResult = calculateAuditScore(
        session.template.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          weight: cat.weight,
          criteria: cat.criteria.map((crit) => ({
            id: crit.id,
            isRequired: crit.isRequired,
          })),
        })),
        session.responses.map((r) => ({
          criterionId: r.criterionId,
          scorePercent: r.scorePercent,
          passed: r.passed,
        })),
      );

      const completed = await prisma.auditSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          overallScore: scoreResult.overallScore,
          completedAt: new Date(),
        },
        include: {
          template: {
            include: {
              categories: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  criteria: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
          store: { select: { id: true, name: true, city: true } },
          responses: {
            include: { criterion: true },
          },
        },
      });

      await logAudit({
        tenantId,
        userId: req.user!.sub,
        action: 'COMPLETE',
        entity: 'AuditSession',
        entityId: session.id,
        details: `Audit abgeschlossen, Score: ${scoreResult.overallScore?.toFixed(1)}%`,
        ipAddress: req.ip ?? null,
      });

      res.json({ ...completed, scoreDetails: scoreResult });
    } catch (err) {
      console.error('SEA session complete error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// DELETE /sessions/:id — Session löschen (nur DRAFT/IN_PROGRESS)
seaSessionsRouter.delete(
  '/:id',
  requireMinRole('store_manager'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['id'] as string;

      const existing = await prisma.auditSession.findUnique({
        where: { id: sessionId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Audit-Session nicht gefunden.' });
        return;
      }

      if (existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (existing.status === 'COMPLETED') {
        res.status(400).json({ error: 'Abgeschlossene Audits können nicht gelöscht werden.' });
        return;
      }

      await prisma.auditSession.update({
        where: { id: sessionId },
        data: { status: 'CANCELLED' },
      });

      await logAudit({
        tenantId,
        userId: req.user!.sub,
        action: 'CANCEL',
        entity: 'AuditSession',
        entityId: sessionId,
        ipAddress: req.ip ?? null,
      });

      res.json({ success: true });
    } catch (err) {
      console.error('SEA session delete error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);
