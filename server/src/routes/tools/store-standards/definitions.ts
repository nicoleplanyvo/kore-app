import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { standardDefinitionCreateSchema, standardDefinitionUpdateSchema } from '@shared/validators';

export const stdDefinitionsRouter: RouterType = Router();

// GET /  — Alle Definitionen (optional ?categoryId=)
stdDefinitionsRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = {
      OR: [{ tenantId }, { tenantId: null }],
      isActive: true,
    };
    if (req.query.categoryId) where['categoryId'] = req.query.categoryId;

    const definitions = await prisma.standardDefinition.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
    res.json(definitions);
  } catch (err) {
    console.error('Std definitions list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /  — Neue Definition erstellen
stdDefinitionsRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = standardDefinitionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    // Verify category exists
    const category = await prisma.standardCategory.findFirst({
      where: {
        id: parsed.data.categoryId,
        OR: [{ tenantId }, { tenantId: null }],
      },
    });
    if (!category) return res.status(404).json({ error: 'Kategorie nicht gefunden.' });

    const definition = await prisma.standardDefinition.create({
      data: { ...parsed.data, tenantId },
      include: { category: { select: { id: true, name: true } } },
    });
    res.status(201).json(definition);
  } catch (err) {
    console.error('Std definition create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id  — Definition aktualisieren
stdDefinitionsRouter.put('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = standardDefinitionUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.' });

    const result = await prisma.standardDefinition.updateMany({
      where: { id: req.params.id, tenantId },
      data: parsed.data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Definition nicht gefunden oder KORE-Default.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Std definition update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /:id  — Soft-Delete
stdDefinitionsRouter.delete('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const result = await prisma.standardDefinition.updateMany({
      where: { id: req.params.id, tenantId },
      data: { isActive: false },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Definition nicht gefunden.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Std definition delete error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
