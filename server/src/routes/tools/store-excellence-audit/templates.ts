import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { requireRole } from '../../../middleware/auth.js';
import { auditTemplateCreateSchema, auditTemplateUpdateSchema } from '@shared/validators';

export const seaTemplatesRouter: RouterType = Router();

// GET /templates — Liste (KORE-Defaults + Tenant-eigene)
seaTemplatesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const templates = await prisma.auditTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { tenantId: null, isDefault: true }, // KORE-Defaults
          { tenantId },                        // Tenant-eigene
        ],
      },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { criteria: true } },
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    res.json(templates);
  } catch (err) {
    console.error('SEA templates list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /templates/:id — Detail mit Categories + Criteria
seaTemplatesRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const template = await prisma.auditTemplate.findUnique({
      where: { id: req.params['id'] },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            criteria: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!template) {
      res.status(404).json({ error: 'Template nicht gefunden.' });
      return;
    }

    // Zugriffsprüfung: KORE-Default oder eigener Tenant
    if (template.tenantId !== null && template.tenantId !== tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf dieses Template.' });
      return;
    }

    res.json(template);
  } catch (err) {
    console.error('SEA template detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /templates — Neues Template erstellen (tenant_admin, kore_admin)
seaTemplatesRouter.post(
  '/',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const result = auditTemplateCreateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;
      const tenantId = (req as any).tenantId as string;
      const userId = req.user!.sub;

      // kore_admin kann KORE-Defaults erstellen (tenantId: null)
      const isKoreDefault = req.user!.role === 'kore_admin' && req.body.isDefault === true;

      const template = await prisma.auditTemplate.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          tenantId: isKoreDefault ? null : tenantId,
          isDefault: isKoreDefault,
          createdBy: userId,
          categories: data.categories
            ? {
                create: data.categories.map((cat, catIdx) => ({
                  name: cat.name,
                  description: cat.description ?? null,
                  sortOrder: cat.sortOrder ?? catIdx,
                  weight: cat.weight ?? 1.0,
                  criteria: cat.criteria
                    ? {
                        create: cat.criteria.map((crit, critIdx) => ({
                          name: crit.name,
                          description: crit.description ?? null,
                          sortOrder: crit.sortOrder ?? critIdx,
                          isRequired: crit.isRequired ?? true,
                          photoRequired: crit.photoRequired ?? false,
                        })),
                      }
                    : undefined,
                })),
              }
            : undefined,
        },
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              criteria: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      res.status(201).json(template);
    } catch (err) {
      console.error('SEA template create error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// PUT /templates/:id — Template aktualisieren
seaTemplatesRouter.put(
  '/:id',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const result = auditTemplateUpdateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;
      const tenantId = (req as any).tenantId as string;
      const templateId = req.params['id'] as string;

      // Prüfe Zugriff
      const existing = await prisma.auditTemplate.findUnique({
        where: { id: templateId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Template nicht gefunden.' });
        return;
      }

      if (existing.tenantId !== null && existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses Template.' });
        return;
      }

      // KORE-Defaults können nur von kore_admin bearbeitet werden
      if (existing.isDefault && req.user!.role !== 'kore_admin') {
        res.status(403).json({ error: 'KORE-Standard-Templates können nur von Admins bearbeitet werden.' });
        return;
      }

      const template = await prisma.auditTemplate.update({
        where: { id: templateId },
        data: {
          name: data.name,
          description: data.description,
          version: { increment: 1 },
        },
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              criteria: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      res.json(template);
    } catch (err) {
      console.error('SEA template update error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// DELETE /templates/:id — Soft-Delete
seaTemplatesRouter.delete(
  '/:id',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const templateId = req.params['id'] as string;

      const existing = await prisma.auditTemplate.findUnique({
        where: { id: templateId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Template nicht gefunden.' });
        return;
      }

      if (existing.tenantId !== null && existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses Template.' });
        return;
      }

      if (existing.isDefault && req.user!.role !== 'kore_admin') {
        res.status(403).json({ error: 'KORE-Standard-Templates können nur von Admins gelöscht werden.' });
        return;
      }

      await prisma.auditTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
      });

      res.json({ success: true });
    } catch (err) {
      console.error('SEA template delete error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// POST /templates/:id/clone — KORE-Default in Tenant-Kopie klonen
seaTemplatesRouter.post(
  '/:id/clone',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const userId = req.user!.sub;
      const sourceId = req.params['id'] as string;

      const source = await prisma.auditTemplate.findUnique({
        where: { id: sourceId },
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              criteria: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      if (!source) {
        res.status(404).json({ error: 'Template nicht gefunden.' });
        return;
      }

      const clone = await prisma.auditTemplate.create({
        data: {
          name: `${source.name} (Kopie)`,
          description: source.description,
          tenantId,
          isDefault: false,
          createdBy: userId,
          categories: {
            create: source.categories.map((cat) => ({
              name: cat.name,
              description: cat.description,
              sortOrder: cat.sortOrder,
              weight: cat.weight,
              criteria: {
                create: cat.criteria.map((crit) => ({
                  name: crit.name,
                  description: crit.description,
                  sortOrder: crit.sortOrder,
                  isRequired: crit.isRequired,
                  photoRequired: crit.photoRequired,
                })),
              },
            })),
          },
        },
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              criteria: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      res.status(201).json(clone);
    } catch (err) {
      console.error('SEA template clone error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);
