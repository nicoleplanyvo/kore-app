import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { standardEvaluationCreateSchema, standardScoreSchema } from '@shared/validators';

export const stdEvaluationsRouter: RouterType = Router();

// GET /  — Paginierte Liste
stdEvaluationsRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (req.query.status) where['status'] = req.query.status;
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.standardEvaluation.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
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
    console.error('Std evaluations list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /  — Neue Evaluation starten
stdEvaluationsRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = standardEvaluationCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const evaluation = await prisma.standardEvaluation.create({
      data: {
        tenantId,
        storeId: parsed.data.storeId,
        evaluatedBy: userId,
        period: parsed.data.period,
        notes: parsed.data.notes || null,
      },
      include: {
        store: { select: { id: true, name: true, city: true } },
      },
    });
    res.status(201).json(evaluation);
  } catch (err) {
    console.error('Std evaluation create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /:id  — Detail mit Scores
stdEvaluationsRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const evaluation = await prisma.standardEvaluation.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        scores: {
          include: {
            definition: {
              include: { category: { select: { id: true, name: true } } },
            },
          },
          orderBy: { definition: { sortOrder: 'asc' } },
        },
      },
    });
    if (!evaluation) return res.status(404).json({ error: 'Evaluation nicht gefunden.' });
    res.json(evaluation);
  } catch (err) {
    console.error('Std evaluation detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id/scores/:defId  — Score eintragen (Upsert)
stdEvaluationsRouter.put('/:id/scores/:defId', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = standardScoreSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    // Verify evaluation belongs to tenant and is IN_PROGRESS
    const evaluation = await prisma.standardEvaluation.findFirst({
      where: { id: req.params.id, tenantId, status: 'IN_PROGRESS' },
    });
    if (!evaluation) return res.status(404).json({ error: 'Evaluation nicht gefunden oder bereits abgeschlossen.' });

    // Get definition to calculate pass/fail
    const definition = await prisma.standardDefinition.findFirst({
      where: { id: req.params.defId, isActive: true },
    });
    if (!definition) return res.status(404).json({ error: 'Definition nicht gefunden.' });

    // Calculate passed based on operator
    const actual = parsed.data.actualValue;
    const target = definition.targetValue;
    let passed = false;
    switch (definition.operator) {
      case 'GTE': passed = actual >= target; break;
      case 'LTE': passed = actual <= target; break;
      case 'EQ':  passed = actual === target; break;
      case 'GT':  passed = actual > target; break;
      case 'LT':  passed = actual < target; break;
    }

    // Score: 0-100 based on how close to target
    let score = 0;
    if (passed) {
      score = 100;
    } else if (definition.operator === 'GTE' || definition.operator === 'GT') {
      score = target > 0 ? Math.max(0, Math.round((actual / target) * 100)) : 0;
    } else if (definition.operator === 'LTE' || definition.operator === 'LT') {
      score = actual > 0 ? Math.max(0, Math.round((target / actual) * 100)) : 100;
    }
    score = Math.min(100, score);

    const scoreEntry = await prisma.standardScore.upsert({
      where: {
        evaluationId_definitionId: {
          evaluationId: req.params.id,
          definitionId: req.params.defId,
        },
      },
      create: {
        evaluationId: req.params.id,
        definitionId: req.params.defId,
        actualValue: actual,
        passed,
        score,
        comment: parsed.data.comment || null,
      },
      update: {
        actualValue: actual,
        passed,
        score,
        comment: parsed.data.comment || null,
      },
      include: {
        definition: { select: { id: true, name: true, unit: true, targetValue: true, operator: true } },
      },
    });
    res.json(scoreEntry);
  } catch (err) {
    console.error('Std score upsert error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/complete  — Evaluation abschließen
stdEvaluationsRouter.post('/:id/complete', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const evaluation = await prisma.standardEvaluation.findFirst({
      where: { id: req.params.id, tenantId, status: 'IN_PROGRESS' },
      include: { scores: { include: { definition: true } } },
    });
    if (!evaluation) return res.status(404).json({ error: 'Evaluation nicht gefunden oder bereits abgeschlossen.' });

    // Calculate weighted overall score
    let totalWeight = 0;
    let weightedSum = 0;
    for (const s of evaluation.scores) {
      const w = s.definition.weight;
      totalWeight += w;
      weightedSum += s.score * w;
    }
    const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

    const updated = await prisma.standardEvaluation.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        overallScore,
        completedAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true, city: true } },
        scores: {
          include: { definition: { include: { category: { select: { id: true, name: true } } } } },
        },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('Std evaluation complete error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
