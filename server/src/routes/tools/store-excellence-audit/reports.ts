import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { calculateAuditScore } from '@shared/validators/audit-scoring';

export const seaReportsRouter: RouterType = Router();

// GET /reports/summary — Dashboard-Summary
seaReportsRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const from = req.query['from'] as string | undefined;
    const to = req.query['to'] as string | undefined;

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter['gte'] = new Date(from);
    if (to) dateFilter['lte'] = new Date(to);

    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = {
      tenantId,
      status: 'COMPLETED',
    };
    if (toolStoreIds !== 'all') {
      where['storeId'] = { in: toolStoreIds };
    }
    if (from || to) {
      where['completedAt'] = dateFilter;
    }

    const sessions = await prisma.auditSession.findMany({
      where,
      select: {
        id: true,
        overallScore: true,
        completedAt: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    const totalAudits = sessions.length;
    const scores = sessions
      .map((s) => s.overallScore)
      .filter((s): s is number => s !== null);

    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

    // Trend: Vergleiche letzte 5 mit vorherigen 5
    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    if (scores.length >= 4) {
      const half = Math.floor(scores.length / 2);
      const recentAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const olderAvg = scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half);
      if (recentAvg > olderAvg + 2) recentTrend = 'up';
      else if (recentAvg < olderAvg - 2) recentTrend = 'down';
    }

    // Pass-Rate über alle Responses der gefilterten Sessions
    const sessionIds = sessions.map((s) => s.id);
    let passRate = 0;
    if (sessionIds.length > 0) {
      const responseCounts = await prisma.auditResponse.groupBy({
        by: ['passed'],
        where: {
          sessionId: { in: sessionIds },
          passed: { not: null },
        },
        _count: true,
      });

      const passedCount = responseCounts.find((r) => r.passed === true)?._count ?? 0;
      const totalEvaluated = responseCounts.reduce((sum, r) => sum + r._count, 0);
      passRate = totalEvaluated > 0 ? Math.round((passedCount / totalEvaluated) * 1000) / 10 : 0;
    }

    res.json({
      totalAudits,
      averageScore,
      passRate,
      recentTrend,
    });
  } catch (err) {
    console.error('SEA reports summary error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/trends — Score-Verlauf über Zeit
seaReportsRouter.get('/trends', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));

    const storeFilter = toolStoreIds !== 'all' ? { storeId: { in: toolStoreIds } } : {};

    const sessions = await prisma.auditSession.findMany({
      where: {
        tenantId,
        status: 'COMPLETED',
        overallScore: { not: null },
        ...storeFilter,
      },
      select: {
        id: true,
        overallScore: true,
        completedAt: true,
        storeLocation: true,
        store: { select: { name: true, city: true } },
        template: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    // Chronologische Reihenfolge für Charts
    res.json(sessions.reverse());
  } catch (err) {
    console.error('SEA reports trends error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/categories — Durchschnitt pro Kategorie
seaReportsRouter.get('/categories', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const from = req.query['from'] as string | undefined;
    const to = req.query['to'] as string | undefined;

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter['gte'] = new Date(from);
    if (to) dateFilter['lte'] = new Date(to);

    const toolStoreIds2 = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = {
      tenantId,
      status: 'COMPLETED',
    };
    if (toolStoreIds2 !== 'all') {
      where['storeId'] = { in: toolStoreIds2 };
    }
    if (from || to) {
      where['completedAt'] = dateFilter;
    }

    // Lade alle abgeschlossenen Sessions mit vollem Template + Responses
    const sessions = await prisma.auditSession.findMany({
      where,
      include: {
        template: {
          include: {
            categories: {
              orderBy: { sortOrder: 'asc' },
              include: {
                criteria: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        responses: true,
      },
      orderBy: { completedAt: 'desc' },
    });

    // Berechne Scores pro Session und aggregiere pro Kategorie
    const categoryTotals = new Map<
      string,
      { name: string; scores: number[]; passRates: number[] }
    >();

    for (const session of sessions) {
      const scoreResult = calculateAuditScore(
        session.template.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          weight: cat.weight,
          criteria: cat.criteria.map((crit) => ({
            id: crit.id,
            isRequired: crit.isRequired,
          })),
        })),
        session.responses.map((r) => ({
          criterionId: r.criterionId,
          scorePercent: r.scorePercent,
          passed: r.passed,
        })),
      );

      for (const scored of scoreResult.categories) {
        const existing = categoryTotals.get(scored.categoryName);
        if (existing) {
          if (scored.scoredCount > 0) existing.scores.push(scored.averagePercent);
          if (scored.passCount + scored.failCount > 0) existing.passRates.push(scored.passRate);
        } else {
          categoryTotals.set(scored.categoryName, {
            name: scored.categoryName,
            scores: scored.scoredCount > 0 ? [scored.averagePercent] : [],
            passRates: scored.passCount + scored.failCount > 0 ? [scored.passRate] : [],
          });
        }
      }
    }

    const categoryAverages = Array.from(categoryTotals.values()).map((cat) => ({
      categoryName: cat.name,
      averageScore:
        cat.scores.length > 0
          ? Math.round((cat.scores.reduce((a, b) => a + b, 0) / cat.scores.length) * 10) / 10
          : 0,
      passRate:
        cat.passRates.length > 0
          ? Math.round((cat.passRates.reduce((a, b) => a + b, 0) / cat.passRates.length) * 10) / 10
          : 0,
      sampleCount: cat.scores.length,
    }));

    res.json({ categoryAverages, totalSessions: sessions.length });
  } catch (err) {
    console.error('SEA reports categories error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
