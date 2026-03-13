import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  vmGuidelineDocCreateSchema,
  vmGuidelineDocUpdateSchema,
} from '@shared/validators';

export const vmGuidelinesRouter: RouterType = Router();
vmGuidelinesRouter.use(authenticate, requireToolAccess('floor.vm_guidelines'));

// GET / — Alle Guidelines (paginiert, filterbar)
vmGuidelinesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.category) where['category'] = req.query.category;

    const [data, total] = await Promise.all([
      prisma.vmGuidelineDoc.findMany({
        where,
        include: { _count: { select: { images: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vmGuidelineDoc.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST / — Neue Guideline erstellen
vmGuidelinesRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = vmGuidelineDocCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const doc = await prisma.vmGuidelineDoc.create({
      data: { ...parsed.data, tenantId, createdBy: userId },
    });
    res.status(201).json(doc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /:id — Einzelne Guideline mit Bildern
vmGuidelinesRouter.get('/:id', async (req, res) => {
  try {
    const doc = await prisma.vmGuidelineDoc.findUnique({
      where: { id: req.params['id'] },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!doc) return res.status(404).json({ error: 'Guideline nicht gefunden.' });
    res.json(doc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /:id — Guideline aktualisieren
vmGuidelinesRouter.put('/:id', async (req, res) => {
  try {
    const parsed = vmGuidelineDocUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const doc = await prisma.vmGuidelineDoc.update({
      where: { id: req.params['id'] },
      data: parsed.data,
    });
    res.json(doc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /:id/publish — Veröffentlichen
vmGuidelinesRouter.post('/:id/publish', async (req, res) => {
  try {
    const doc = await prisma.vmGuidelineDoc.update({
      where: { id: req.params['id'] },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
    res.json(doc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /:id/archive — Archivieren
vmGuidelinesRouter.post('/:id/archive', async (req, res) => {
  try {
    const doc = await prisma.vmGuidelineDoc.update({
      where: { id: req.params['id'] },
      data: { status: 'ARCHIVED' },
    });
    res.json(doc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /:id/images — Bild zur Guideline hinzufügen
vmGuidelinesRouter.post('/:id/images', async (req, res) => {
  try {
    const { imagePath, caption, sortOrder } = req.body;
    if (!imagePath) return res.status(400).json({ error: 'imagePath erforderlich.' });
    const image = await prisma.vmGuidelineImage.create({
      data: {
        guidelineDocId: req.params['id']!,
        imagePath,
        caption: caption ?? null,
        sortOrder: sortOrder ?? 0,
      },
    });
    res.status(201).json(image);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
