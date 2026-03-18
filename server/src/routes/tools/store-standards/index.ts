import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';

export const storeStandardsRouter: RouterType = Router();
storeStandardsRouter.use(authenticate, requireToolAccess('standards.store_standards'));

// GET /stores
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
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /categories — Standard-Kategorien
storeStandardsRouter.get('/categories', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const categories = await prisma.standardCategory.findMany({
      where: {
        isActive: true,
        OR: [{ tenantId: null }, { tenantId }],
      },
      include: {
        definitions: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /categories — Neue Kategorie erstellen
storeStandardsRouter.post('/categories', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { name, description, sortOrder } = req.body;
    if (!name) return res.status(400).json({ error: 'Name ist erforderlich.' });
    const category = await prisma.standardCategory.create({
      data: { tenantId, name, description, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /definitions — Neuen Standard definieren
storeStandardsRouter.post('/definitions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { categoryId, name, description, unit, targetValue, operator, weight, sortOrder } = req.body;
    if (!categoryId || !name || targetValue == null) {
      return res.status(400).json({ error: 'categoryId, name und targetValue sind erforderlich.' });
    }
    const definition = await prisma.standardDefinition.create({
      data: { categoryId, tenantId, name, description, unit, targetValue, operator: operator ?? 'GTE', weight: weight ?? 1, sortOrder: sortOrder ?? 0 },
    });
    res.status(201).json(definition);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /evaluations — Bewertungen auflisten
storeStandardsRouter.get('/evaluations', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query['page']) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query['pageSize']) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query['storeId']) where['storeId'] = req.query['storeId'];
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query['status']) where['status'] = req.query['status'];

    const [data, total] = await Promise.all([
      prisma.standardEvaluation.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
          evaluator: { select: { id: true, name: true } },
          _count: { select: { scores: true } },
        },
        orderBy: { evaluatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.standardEvaluation.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /evaluations — Neue Bewertung starten
storeStandardsRouter.post('/evaluations', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const { storeId, period, notes } = req.body;
    if (!storeId || !period) return res.status(400).json({ error: 'storeId und period sind erforderlich.' });
    const evaluation = await prisma.standardEvaluation.create({
      data: { tenantId, storeId, evaluatedBy: userId, period, notes },
      include: { store: { select: { id: true, name: true } }, evaluator: { select: { id: true, name: true } } },
    });
    res.status(201).json(evaluation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /evaluations/:id — Bewertung Detail
storeStandardsRouter.get('/evaluations/:id', async (req, res) => {
  try {
    const evaluation = await prisma.standardEvaluation.findUnique({
      where: { id: req.params['id'] },
      include: {
        store: { select: { id: true, name: true, city: true } },
        evaluator: { select: { id: true, name: true } },
        scores: { include: { definition: { include: { category: true } } } },
      },
    });
    if (!evaluation) return res.status(404).json({ error: 'Bewertung nicht gefunden.' });
    res.json(evaluation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /evaluations/:id/scores — Score eintragen
storeStandardsRouter.post('/evaluations/:id/scores', async (req, res) => {
  try {
    const { definitionId, actualValue, comment } = req.body;
    if (!definitionId || actualValue == null) return res.status(400).json({ error: 'definitionId und actualValue sind erforderlich.' });

    const definition = await prisma.standardDefinition.findUnique({ where: { id: definitionId } });
    if (!definition) return res.status(404).json({ error: 'Standard nicht gefunden.' });

    const passed = (() => {
      switch (definition.operator) {
        case 'GTE': return actualValue >= definition.targetValue;
        case 'LTE': return actualValue <= definition.targetValue;
        case 'EQ': return actualValue === definition.targetValue;
        case 'GT': return actualValue > definition.targetValue;
        case 'LT': return actualValue < definition.targetValue;
        default: return actualValue >= definition.targetValue;
      }
    })();
    const score = passed ? 100 : Math.max(0, Math.round((actualValue / definition.targetValue) * 100));

    const result = await prisma.standardScore.upsert({
      where: { evaluationId_definitionId: { evaluationId: req.params['id']!, definitionId } },
      update: { actualValue, passed, score, comment },
      create: { evaluationId: req.params['id']!, definitionId, actualValue, passed, score, comment },
    });

    // Recalculate overall score
    const allScores = await prisma.standardScore.findMany({
      where: { evaluationId: req.params['id'] },
      include: { definition: true },
    });
    const totalWeight = allScores.reduce((s, sc) => s + sc.definition.weight, 0);
    const weightedSum = allScores.reduce((s, sc) => s + sc.score * sc.definition.weight, 0);
    const overallScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
    await prisma.standardEvaluation.update({ where: { id: req.params['id'] }, data: { overallScore } });

    res.json({ ...result, overallScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /evaluations/:id/complete — Bewertung abschließen
storeStandardsRouter.post('/evaluations/:id/complete', async (req, res) => {
  try {
    const evaluation = await prisma.standardEvaluation.update({
      where: { id: req.params['id'] },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    res.json(evaluation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /dashboard — Store Standards Dashboard
storeStandardsRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const evaluations = await prisma.standardEvaluation.findMany({
      where,
      include: { store: { select: { id: true, name: true } } },
      orderBy: { evaluatedAt: 'desc' },
    });

    const total = evaluations.length;
    const completed = evaluations.filter(e => e.status === 'COMPLETED').length;
    const avgScore = evaluations.filter(e => e.overallScore != null).length > 0
      ? Math.round(evaluations.filter(e => e.overallScore != null).reduce((s, e) => s + (e.overallScore ?? 0), 0) / evaluations.filter(e => e.overallScore != null).length * 10) / 10
      : 0;

    // Store ranking
    const byStore: Record<string, { name: string; scores: number[]; count: number }> = {};
    for (const e of evaluations.filter(x => x.overallScore != null)) {
      const sid = e.storeId;
      if (!byStore[sid]) byStore[sid] = { name: e.store?.name ?? sid, scores: [], count: 0 };
      byStore[sid]!.scores.push(e.overallScore!);
      byStore[sid]!.count++;
    }
    const storeRanking = Object.entries(byStore).map(([storeId, d]) => ({
      storeId,
      storeName: d.name,
      avgScore: Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length * 10) / 10,
      evaluations: d.count,
    })).sort((a, b) => b.avgScore - a.avgScore);

    res.json({ total, completed, avgScore, storeRanking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
