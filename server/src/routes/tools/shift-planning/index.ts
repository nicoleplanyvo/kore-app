import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { shiftTemplateCreateSchema, shiftEntryCreateSchema, shiftEntryUpdateSchema, shiftSwapRequestSchema } from '@shared/validators';

export const shiftPlanningRouter: RouterType = Router();
shiftPlanningRouter.use(authenticate, requireToolAccess('coaching.shift_planning'));

// GET /templates
shiftPlanningRouter.get('/templates', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    const templates = await prisma.shiftTemplate.findMany({
      where, include: { store: { select: { id: true, name: true } } }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json(templates);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /templates
shiftPlanningRouter.post('/templates', async (req, res) => {
  try {
    const parsed = shiftTemplateCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const template = await prisma.shiftTemplate.create({ data: parsed.data });
    res.status(201).json(template);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /entries
shiftPlanningRouter.get('/entries', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from && req.query.to) {
      where['date'] = { gte: new Date(req.query.from as string), lte: new Date(req.query.to as string) };
    }
    if (req.query.status) where['status'] = req.query.status;
    const entries = await prisma.shiftEntry.findMany({
      where,
      include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
    res.json(entries);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /entries
shiftPlanningRouter.post('/entries', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = shiftEntryCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const entry = await prisma.shiftEntry.create({ data: { ...parsed.data, createdBy: userId } });
    res.status(201).json(entry);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /entries/:id
shiftPlanningRouter.put('/entries/:id', async (req, res) => {
  try {
    const parsed = shiftEntryUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const entry = await prisma.shiftEntry.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(entry);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /entries/:id/swap
shiftPlanningRouter.post('/entries/:id/swap', async (req, res) => {
  try {
    const requestedBy = req.user!.sub;
    const parsed = shiftSwapRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const swap = await prisma.shiftSwapRequest.create({
      data: { shiftEntryId: req.params['id']!, requestedBy, ...parsed.data },
    });
    res.status(201).json(swap);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /swaps/:id
shiftPlanningRouter.put('/swaps/:id', async (req, res) => {
  try {
    const approvedBy = req.user!.sub;
    const status = req.body.status as string;
    if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Status muss APPROVED oder REJECTED sein.' });
    const swap = await prisma.shiftSwapRequest.update({ where: { id: req.params['id'] }, data: { status, approvedBy } });
    if (status === 'APPROVED') {
      await prisma.shiftEntry.update({ where: { id: swap.shiftEntryId }, data: { status: 'SWAPPED' } });
    }
    res.json(swap);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
