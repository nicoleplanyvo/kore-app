import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';

export const checklistenReportsRouter: RouterType = Router();

// GET /reports/summary — Dashboard-Zusammenfassung
checklistenReportsRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = req.query['storeId'] as string | undefined;

    const baseWhere: Record<string, unknown> = {
      tenantId,
      status: 'COMPLETED',
    };
    if (toolStoreIds !== 'all') {
      baseWhere['storeId'] = { in: toolStoreIds };
    }
    if (storeId) {
      baseWhere['storeId'] = storeId;
    }

    // Gesamtanzahl abgeschlossener Sessions
    const totalSessions = await prisma.checklistSession.count({
      where: baseWhere,
    });

    // Durchschnittliche Completion Rate
    const completedSessions = await prisma.checklistSession.findMany({
      where: baseWhere,
      select: { completionRate: true },
    });

    const rates = completedSessions.map((s) => s.completionRate);
    const averageCompletionRate =
      rates.length > 0
        ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10
        : 0;

    // Diesen Monat
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = await prisma.checklistSession.count({
      where: {
        ...baseWhere,
        completedAt: { gte: thisMonthStart },
      },
    });

    // Letzten Monat
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const lastMonthCount = await prisma.checklistSession.count({
      where: {
        ...baseWhere,
        completedAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
    });

    res.json({
      totalSessions,
      averageCompletionRate,
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
    });
  } catch (err) {
    console.error('Checklisten reports summary error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/trends — Letzte 10 abgeschlossene Sessions mit Datum + Completion Rate
checklistenReportsRouter.get('/trends', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = req.query['storeId'] as string | undefined;

    const where: Record<string, unknown> = {
      tenantId,
      status: 'COMPLETED',
    };
    if (toolStoreIds !== 'all') {
      where['storeId'] = { in: toolStoreIds };
    }
    if (storeId) {
      where['storeId'] = storeId;
    }

    const sessions = await prisma.checklistSession.findMany({
      where,
      select: {
        id: true,
        completionRate: true,
        completedAt: true,
        store: { select: { name: true, city: true } },
        template: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    // Chronologische Reihenfolge für Charts
    res.json(sessions.reverse());
  } catch (err) {
    console.error('Checklisten reports trends error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
