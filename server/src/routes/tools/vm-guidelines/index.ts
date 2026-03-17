import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  vmGuidelineDocCreateSchema,
  vmGuidelineDocUpdateSchema,
} from '@shared/validators';

export const vmGuidelinesRouter: RouterType = Router();
vmGuidelinesRouter.use(authenticate, requireToolAccess('vm.vm_guidelines'));

// GET /stores
vmGuidelinesRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
    else if (tenantId) where['tenantId'] = tenantId;
    const stores = await prisma.store.findMany({ where, select: { id: true, name: true, city: true }, orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET / — Alle Guidelines (paginiert, filterbar)
vmGuidelinesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.category) where['category'] = req.query.category;
    if (req.query.search) {
      where['OR'] = [
        { title: { contains: req.query.search as string } },
        { content: { contains: req.query.search as string } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.vmGuidelineDoc.findMany({
        where,
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, _count: { select: { images: true } } },
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
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

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
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const doc = await prisma.vmGuidelineDoc.update({
      where: { id: req.params['id'] },
      data: { ...parsed.data, version: { increment: 1 } },
    });
    res.json(doc);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// DELETE /:id — Guideline loeschen (archivieren)
vmGuidelinesRouter.delete('/:id', async (req, res) => {
  try {
    await prisma.vmGuidelineDoc.update({
      where: { id: req.params['id'] },
      data: { status: 'ARCHIVED' },
    });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /:id/read — Lesebestaetigung
vmGuidelinesRouter.post('/:id/read', async (req, res) => {
  try {
    const userId = req.user!.sub;
    // We store read confirmations as a simple log — using a lightweight approach
    // Since there's no dedicated model, we just return success
    // In production, you'd add a VmGuidelineRead model
    res.json({ success: true, userId, guidelineId: req.params['id'], readAt: new Date().toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /:id/readers — Wer hat gelesen
vmGuidelinesRouter.get('/:id/readers', async (_req, res) => {
  try {
    // Placeholder — would need a VmGuidelineRead model
    res.json([]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /:id/publish — Veroeffentlichen
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

// POST /:id/images — Bild zur Guideline hinzufuegen
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

// GET /dashboard — Dashboard-Daten
vmGuidelinesRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const [totalDocs, published, draft, archived] = await Promise.all([
      prisma.vmGuidelineDoc.count({ where: { tenantId } }),
      prisma.vmGuidelineDoc.count({ where: { tenantId, status: 'PUBLISHED' } }),
      prisma.vmGuidelineDoc.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.vmGuidelineDoc.count({ where: { tenantId, status: 'ARCHIVED' } }),
    ]);

    const recentUpdates = await prisma.vmGuidelineDoc.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, title: true, category: true, status: true, updatedAt: true, version: true },
    });

    const byCategory: Record<string, number> = {};
    const allDocs = await prisma.vmGuidelineDoc.findMany({
      where: { tenantId, status: 'PUBLISHED' },
      select: { category: true },
    });
    for (const d of allDocs) {
      const cat = d.category || 'Ohne Kategorie';
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }

    res.json({
      totalDocs,
      published,
      draft,
      archived,
      recentUpdates,
      byCategory,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
