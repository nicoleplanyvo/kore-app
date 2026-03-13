import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { requireRole } from '../../../middleware/auth.js';
import { sopCategoryCreateSchema } from '@shared/validators';

export const sopCategoriesRouter: RouterType = Router();

// GET /categories — Liste (KORE-Defaults + Tenant-eigene)
sopCategoriesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const categories = await prisma.sopCategory.findMany({
      where: {
        isActive: true,
        OR: [
          { tenantId: null },   // Globale Defaults
          { tenantId },         // Tenant-eigene
        ],
      },
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    res.json(categories);
  } catch (err) {
    console.error('SOP categories list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /categories — Neue Kategorie erstellen (tenant_admin, kore_admin)
sopCategoriesRouter.post(
  '/',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const result = sopCategoryCreateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;
      const tenantId = (req as any).tenantId as string;

      // kore_admin kann globale Kategorien erstellen (tenantId: null)
      const isGlobal = req.user!.role === 'kore_admin' && req.body.isGlobal === true;

      const category = await prisma.sopCategory.create({
        data: {
          name: data.name,
          sortOrder: data.sortOrder ?? 0,
          tenantId: isGlobal ? null : tenantId,
        },
        include: {
          _count: { select: { documents: true } },
        },
      });

      res.status(201).json(category);
    } catch (err) {
      console.error('SOP category create error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// PUT /categories/:id — Kategorie aktualisieren (tenant_admin, kore_admin)
sopCategoriesRouter.put(
  '/:id',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const result = sopCategoryCreateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;
      const tenantId = (req as any).tenantId as string;
      const categoryId = req.params['id'] as string;

      // Prüfe Zugriff
      const existing = await prisma.sopCategory.findUnique({
        where: { id: categoryId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Kategorie nicht gefunden.' });
        return;
      }

      // Globale Kategorien können nur von kore_admin bearbeitet werden
      if (existing.tenantId === null && req.user!.role !== 'kore_admin') {
        res.status(403).json({ error: 'Globale Kategorien können nur von KORE-Admins bearbeitet werden.' });
        return;
      }

      if (existing.tenantId !== null && existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Kategorie.' });
        return;
      }

      const category = await prisma.sopCategory.update({
        where: { id: categoryId },
        data: {
          name: data.name,
          sortOrder: data.sortOrder,
        },
        include: {
          _count: { select: { documents: true } },
        },
      });

      res.json(category);
    } catch (err) {
      console.error('SOP category update error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// DELETE /categories/:id — Soft-Delete (isActive=false)
sopCategoriesRouter.delete(
  '/:id',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const categoryId = req.params['id'] as string;

      const existing = await prisma.sopCategory.findUnique({
        where: { id: categoryId },
      });

      if (!existing) {
        res.status(404).json({ error: 'Kategorie nicht gefunden.' });
        return;
      }

      // Globale Kategorien können nur von kore_admin gelöscht werden
      if (existing.tenantId === null && req.user!.role !== 'kore_admin') {
        res.status(403).json({ error: 'Globale Kategorien können nur von KORE-Admins gelöscht werden.' });
        return;
      }

      if (existing.tenantId !== null && existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Kategorie.' });
        return;
      }

      await prisma.sopCategory.update({
        where: { id: categoryId },
        data: { isActive: false },
      });

      res.json({ success: true });
    } catch (err) {
      console.error('SOP category delete error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);
