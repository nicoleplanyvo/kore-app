import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { standardCategoryCreateSchema, standardCategoryUpdateSchema } from '@shared/validators';

export const stdCategoriesRouter: RouterType = Router();

// GET /  — Alle Kategorien des Tenants (inkl. KORE-Defaults)
stdCategoriesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const categories = await prisma.standardCategory.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        isActive: true,
      },
      include: {
        _count: { select: { definitions: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error('Std categories list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /  — Neue Kategorie erstellen
stdCategoriesRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = standardCategoryCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const category = await prisma.standardCategory.create({
      data: { ...parsed.data, tenantId },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error('Std category create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id  — Kategorie aktualisieren
stdCategoriesRouter.put('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = standardCategoryUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.' });

    // Only update own categories (not KORE defaults)
    const result = await prisma.standardCategory.updateMany({
      where: { id: req.params.id, tenantId },
      data: parsed.data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Kategorie nicht gefunden oder KORE-Default.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Std category update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
