import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';

export const stdReportsRouter: RouterType = Router();

// GET /summary  — Übersicht
stdReportsRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const storeFilter: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') storeFilter['storeId'] = { in: toolStoreIds };

    const [totalEvaluations, completed, avgResult] = await Promise.all([
      prisma.standardEvaluation.count({ where: storeFilter }),
      prisma.standardEvaluation.count({ where: { ...storeFilter, status: 'COMPLETED' } }),
      prisma.standardEvaluation.aggregate({
        where: { ...storeFilter, status: 'COMPLETED' },
        _avg: { overallScore: true },
      }),
    ]);

    const averageScore = Math.round(avgResult._avg.overallScore ?? 0);

    // Pass rate: evaluations with overallScore >= 80
    const passing = await prisma.standardEvaluation.count({
      where: { ...storeFilter, status: 'COMPLETED', overallScore: { gte: 80 } },
    });
    const passRate = completed > 0 ? Math.round((passing / completed) * 100) : 0;

    // Definitions count
    const totalDefinitions = await prisma.standardDefinition.count({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        isActive: true,
      },
    });

    res.json({
      totalEvaluations,
      completedEvaluations: completed,
      averageScore,
      passRate,
      totalDefinitions,
    });
  } catch (err) {
    console.error('Std summary error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /benchmark  — Store-Vergleich
stdReportsRouter.get('/benchmark', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const storeWhere: Record<string, unknown> = { tenantId, isActive: true };
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: {
        id: true,
        name: true,
        city: true,
        standardEvaluations: {
          where: { status: 'COMPLETED' },
          select: { overallScore: true, period: true, evaluatedAt: true },
          orderBy: { evaluatedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = stores.map((store) => {
      const evals = store.standardEvaluations;
      const avgScore = evals.length > 0
        ? Math.round(evals.reduce((sum, e) => sum + (e.overallScore ?? 0), 0) / evals.length)
        : 0;
      return {
        storeId: store.id,
        storeName: store.name,
        city: store.city,
        evaluationCount: evals.length,
        averageScore: avgScore,
        latestPeriod: evals[0]?.period ?? null,
        latestScore: evals[0]?.overallScore ?? null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Std benchmark error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /trends  — Verlauf über Zeit
stdReportsRouter.get('/trends', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId, status: 'COMPLETED' };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.storeId) where['storeId'] = req.query.storeId;

    const evaluations = await prisma.standardEvaluation.findMany({
      where,
      select: {
        period: true,
        overallScore: true,
        evaluatedAt: true,
        store: { select: { id: true, name: true } },
      },
      orderBy: { evaluatedAt: 'asc' },
      take: 50,
    });

    res.json(evaluations);
  } catch (err) {
    console.error('Std trends error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
