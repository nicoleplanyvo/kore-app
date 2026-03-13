import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { vmGuidelineCreateSchema, vmGuidelineUpdateSchema } from '@shared/validators';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve('data/uploads/vm-guidelines');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ storage: multer.diskStorage({ destination: uploadDir, filename: (_r, file, cb) => cb(null, `${Date.now()}-${file.originalname}`) }), limits: { fileSize: 10 * 1024 * 1024 } });

export const vmGuidelinesRouter: RouterType = Router();

vmGuidelinesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const guidelines = await prisma.vmGuideline.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { submissions: true } } },
    });
    res.json(guidelines);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

vmGuidelinesRouter.post('/', upload.single('referencePhoto'), async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = vmGuidelineCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const guideline = await prisma.vmGuideline.create({
      data: {
        ...parsed.data,
        tenantId,
        createdBy: userId,
        referencePhoto: req.file ? `/uploads/vm-guidelines/${req.file.filename}` : null,
      },
    });
    res.status(201).json(guideline);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

vmGuidelinesRouter.put('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = vmGuidelineUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.' });
    const guideline = await prisma.vmGuideline.updateMany({ where: { id: req.params.id, tenantId }, data: parsed.data });
    if (guideline.count === 0) return res.status(404).json({ error: 'Guideline nicht gefunden.' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

vmGuidelinesRouter.delete('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    await prisma.vmGuideline.updateMany({ where: { id: req.params.id, tenantId }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
