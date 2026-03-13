import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { requireRole } from '../../../middleware/auth.js';
import { checklistTemplateCreateSchema, checklistTemplateUpdateSchema } from '@shared/validators';

export const checklistenTemplatesRouter: RouterType = Router();

// GET /templates — Liste (KORE-Defaults + Tenant-eigene)
checklistenTemplatesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const templates = await prisma.checklistTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { tenantId: null, isDefault: true }, // KORE-Defaults
          { tenantId },                        // Tenant-eigene
        ],
      },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { items: true } },
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    res.json(templates);
  } catch (err) {
    console.error('Checklisten templates list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /templates/:id — Detail mit Sections + Items
checklistenTemplatesRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const template = await prisma.checklistTemplate.findUnique({
      where: { id: req.params['id'] },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
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
    console.error('Checklisten template detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /templates — Neues Template erstellen (tenant_admin, kore_admin)
checklistenTemplatesRouter.post(
  '/',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const result = checklistTemplateCreateSchema.safeParse(req.body);
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

      const template = await prisma.checklistTemplate.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          tenantId: isKoreDefault ? null : tenantId,
          isDefault: isKoreDefault,
          createdBy: userId,
          sections: data.sections
            ? {
                create: data.sections.map((sec, secIdx) => ({
                  name: sec.name,
                  sortOrder: sec.sortOrder ?? secIdx,
                  items: sec.items
                    ? {
                        create: sec.items.map((item, itemIdx) => ({
                          text: item.text,
                          type: item.type ?? 'BOOLEAN',
                          isRequired: item.isRequired ?? false,
                          sortOrder: item.sortOrder ?? itemIdx,
                        })),
                      }
                    : undefined,
                })),
              }
            : undefined,
        },
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      res.status(201).json(template);
    } catch (err) {
      console.error('Checklisten template create error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// PUT /templates/:id — Template aktualisieren (Metadaten)
checklistenTemplatesRouter.put(
  '/:id',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const result = checklistTemplateUpdateSchema.safeParse(req.body);
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
      const existing = await prisma.checklistTemplate.findUnique({
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

      const template = await prisma.checklistTemplate.update({
        where: { id: templateId },
        data: {
          name: data.name,
          description: data.description,
          version: { increment: 1 },
        },
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      res.json(template);
    } catch (err) {
      console.error('Checklisten template update error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// POST /templates/:id/clone — KORE-Default in Tenant-Kopie klonen
checklistenTemplatesRouter.post(
  '/:id/clone',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const userId = req.user!.sub;
      const sourceId = req.params['id'] as string;

      const source = await prisma.checklistTemplate.findUnique({
        where: { id: sourceId },
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      if (!source) {
        res.status(404).json({ error: 'Template nicht gefunden.' });
        return;
      }

      const clone = await prisma.checklistTemplate.create({
        data: {
          name: `${source.name} (Kopie)`,
          description: source.description,
          tenantId,
          isDefault: false,
          createdBy: userId,
          sections: {
            create: source.sections.map((sec) => ({
              name: sec.name,
              sortOrder: sec.sortOrder,
              items: {
                create: sec.items.map((item) => ({
                  text: item.text,
                  type: item.type,
                  isRequired: item.isRequired,
                  sortOrder: item.sortOrder,
                })),
              },
            })),
          },
        },
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      res.status(201).json(clone);
    } catch (err) {
      console.error('Checklisten template clone error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);
