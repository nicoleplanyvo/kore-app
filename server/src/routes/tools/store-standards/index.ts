import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';

export const storeStandardsRouter: RouterType = Router();
storeStandardsRouter.use(authenticate, requireToolAccess('standards.store_standards'));

// GET /stores — Stores mit Tool-Zugang
storeStandardsRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
    else if (tenantId) where['tenantId'] = tenantId;
    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (err) {
    console.error('Budget stores error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /scenarios — List scenarios for a store
storeStandardsRouter.get('/scenarios', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) {
      where['storeId'] = req.query.storeId;
    } else if (toolStoreIds !== 'all') {
      where['storeId'] = { in: toolStoreIds };
    }
    const scenarios = await prisma.budgetScenario.findMany({
      where,
      select: { id: true, storeId: true, name: true, createdBy: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(scenarios);
  } catch (err) {
    console.error('Scenarios list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /scenarios — Save scenario
storeStandardsRouter.post('/scenarios', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { storeId, name, data } = req.body;
    if (!storeId || !name || !data) {
      return res.status(400).json({ error: 'storeId, name und data sind erforderlich.' });
    }
    const scenario = await prisma.budgetScenario.create({
      data: {
        storeId,
        createdBy: userId,
        name,
        data: typeof data === 'string' ? data : JSON.stringify(data),
      },
    });
    res.status(201).json(scenario);
  } catch (err) {
    console.error('Scenario create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /scenarios/:id — Load scenario
storeStandardsRouter.get('/scenarios/:id', async (req, res) => {
  try {
    const scenario = await prisma.budgetScenario.findUnique({
      where: { id: req.params.id },
    });
    if (!scenario) return res.status(404).json({ error: 'Szenario nicht gefunden.' });
    res.json({ ...scenario, data: JSON.parse(scenario.data) });
  } catch (err) {
    console.error('Scenario load error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /scenarios/:id — Update scenario
storeStandardsRouter.put('/scenarios/:id', async (req, res) => {
  try {
    const { name, data } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name) updateData['name'] = name;
    if (data) updateData['data'] = typeof data === 'string' ? data : JSON.stringify(data);
    const scenario = await prisma.budgetScenario.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(scenario);
  } catch (err) {
    console.error('Scenario update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /scenarios/:id — Delete scenario
storeStandardsRouter.delete('/scenarios/:id', async (req, res) => {
  try {
    await prisma.budgetScenario.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Scenario delete error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /scenarios/compare — Compare multiple scenarios
storeStandardsRouter.get('/scenarios/compare', async (req, res) => {
  try {
    const ids = (req.query.ids as string)?.split(',').filter(Boolean) ?? [];
    if (ids.length < 2) return res.status(400).json({ error: 'Mindestens 2 IDs erforderlich.' });
    const scenarios = await prisma.budgetScenario.findMany({
      where: { id: { in: ids } },
    });
    const parsed = scenarios.map((s) => ({ ...s, data: JSON.parse(s.data) }));
    res.json(parsed);
  } catch (err) {
    console.error('Scenario compare error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
