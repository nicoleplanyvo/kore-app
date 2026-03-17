import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { lossIncidentCreateSchema, lossIncidentUpdateSchema } from '@shared/validators';

export const lossPreventionRouter: RouterType = Router();
lossPreventionRouter.use(authenticate, requireToolAccess('performance.loss_prevention'));

// ── Helpers ────────────────────────────────────────────────────
function autoPriority(amount: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (amount >= 2000) return 'CRITICAL';
  if (amount >= 500) return 'HIGH';
  if (amount >= 100) return 'MEDIUM';
  return 'LOW';
}

const STANDARD_AREAS = [
  'Verkaufsfläche',
  'Kasse',
  'Lager',
  'Eingang',
  'Umkleide',
  'Sonstiges',
];

const MEASURES_CATALOG = [
  { id: 'camera', name: 'Kameraüberwachung', category: 'Technik' },
  { id: 'security_tag', name: 'Warensicherung / Tags', category: 'Technik' },
  { id: 'eas_gate', name: 'EAS-Gate (Warensicherungsanlage)', category: 'Technik' },
  { id: 'mirror', name: 'Spiegel / Einsicht', category: 'Technik' },
  { id: 'training', name: 'Mitarbeiterschulung', category: 'Organisation' },
  { id: 'process', name: 'Prozessoptimierung', category: 'Organisation' },
  { id: 'layout', name: 'Ladengestaltung / Layout', category: 'Organisation' },
  { id: 'cash_audit', name: 'Kassenprüfung', category: 'Kontrolle' },
  { id: 'delivery_check', name: 'Wareneingangskontrolle', category: 'Kontrolle' },
  { id: 'inventory', name: 'Inventurprüfung', category: 'Kontrolle' },
  { id: 'security_staff', name: 'Sicherheitspersonal', category: 'Personal' },
  { id: 'greeting', name: 'Kundenansprache', category: 'Personal' },
];

const CATEGORY_LABELS: Record<string, string> = {
  THEFT: 'Diebstahl extern',
  ADMIN_ERROR: 'Kassenfehlbuchung',
  DAMAGE: 'Beschädigung',
  SUPPLIER: 'WE-Differenz',
  OTHER: 'Sonstige',
};

// ── GET /stores ────────────────────────────────────────────────
lossPreventionRouter.get('/stores', async (req, res) => {
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

// ── GET /users ─────────────────────────────────────────────────
lossPreventionRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const storeId = req.query.storeId as string | undefined;

    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (storeId) {
      where['storeAssignments'] = { some: { storeId } };
    }

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /incidents ─────────────────────────────────────────────
lossPreventionRouter.get('/incidents', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (toolStoreIds !== 'all') where['storeId'] = req.query.storeId || { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.category) where['category'] = req.query.category;
    if (req.query.severity) where['severity'] = req.query.severity;

    // Date range filters
    if (req.query.from || req.query.to) {
      const dateFilter: Record<string, unknown> = {};
      if (req.query.from) dateFilter['gte'] = new Date(req.query.from as string);
      if (req.query.to) dateFilter['lte'] = new Date(req.query.to as string);
      where['incidentDate'] = dateFilter;
    }

    const [data, total] = await Promise.all([
      prisma.lossIncident.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
          reporter: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { incidentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lossIncident.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /incidents ────────────────────────────────────────────
lossPreventionRouter.post('/incidents', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = lossIncidentCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const severity = autoPriority(parsed.data.amount);
    const isAnonymous = req.body.anonymous === true;

    const incident = await prisma.lossIncident.create({
      data: {
        ...parsed.data,
        severity,
        tenantId,
        reportedBy: isAnonymous ? 'anonymous' : userId,
        photoPath: req.body.photoPath || null,
      },
      include: {
        store: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(incident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /incidents/:id ─────────────────────────────────────────
lossPreventionRouter.get('/incidents/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const incident = await prisma.lossIncident.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    if (!incident) return res.status(404).json({ error: 'Vorfall nicht gefunden.' });
    res.json(incident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── PUT /incidents/:id ─────────────────────────────────────────
lossPreventionRouter.put('/incidents/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = lossIncidentUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.' });

    const data: Record<string, unknown> = { ...parsed.data };

    // Recalculate severity if amount changed
    if (req.body.amount != null) {
      data['severity'] = autoPriority(Number(req.body.amount));
      data['amount'] = Number(req.body.amount);
    }

    if (parsed.data.status === 'RESOLVED' || parsed.data.status === 'CLOSED') {
      data['resolvedAt'] = new Date();
    }

    const result = await prisma.lossIncident.updateMany({
      where: { id: req.params.id, tenantId },
      data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Vorfall nicht gefunden.' });

    // Return updated record
    const updated = await prisma.lossIncident.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /incidents/:id/assign ─────────────────────────────────
lossPreventionRouter.post('/incidents/:id/assign', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ error: 'assignedTo ist erforderlich.' });

    const result = await prisma.lossIncident.updateMany({
      where: { id: req.params.id, tenantId },
      data: {
        assignedTo,
        status: 'INVESTIGATING',
      },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Vorfall nicht gefunden.' });

    const updated = await prisma.lossIncident.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /incidents/:id/escalate ───────────────────────────────
lossPreventionRouter.post('/incidents/:id/escalate', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const incident = await prisma.lossIncident.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!incident) return res.status(404).json({ error: 'Vorfall nicht gefunden.' });

    // Escalate severity
    const escalation: Record<string, string> = {
      LOW: 'MEDIUM',
      MEDIUM: 'HIGH',
      HIGH: 'CRITICAL',
      CRITICAL: 'CRITICAL',
    };
    const newSeverity = escalation[incident.severity] || 'CRITICAL';
    const description = incident.description + `\n\n[ESKALIERT am ${new Date().toLocaleDateString('de-DE')}]`;

    await prisma.lossIncident.updateMany({
      where: { id: req.params.id, tenantId },
      data: {
        severity: newSeverity,
        description,
        status: 'INVESTIGATING',
      },
    });

    const updated = await prisma.lossIncident.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /incidents/:id/resolve ────────────────────────────────
lossPreventionRouter.post('/incidents/:id/resolve', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const { resolution } = req.body;
    if (!resolution) return res.status(400).json({ error: 'resolution ist erforderlich.' });

    const result = await prisma.lossIncident.updateMany({
      where: { id: req.params.id, tenantId },
      data: {
        resolution,
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Vorfall nicht gefunden.' });

    const updated = await prisma.lossIncident.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /areas ─────────────────────────────────────────────────
lossPreventionRouter.get('/areas', async (_req, res) => {
  try {
    res.json(STANDARD_AREAS);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /measures ──────────────────────────────────────────────
lossPreventionRouter.get('/measures', async (_req, res) => {
  try {
    res.json(MEASURES_CATALOG);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /dashboard ─────────────────────────────────────────────
lossPreventionRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    // Current period
    const now = new Date();
    let fromDate: Date;
    let toDate: Date = new Date(now);

    if (req.query.from && req.query.to) {
      fromDate = new Date(req.query.from as string);
      toDate = new Date(req.query.to as string);
    } else {
      // Default: current month
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodMs = toDate.getTime() - fromDate.getTime();
    const prevFrom = new Date(fromDate.getTime() - periodMs);
    const prevTo = new Date(fromDate.getTime());

    const currentWhere = { ...where, incidentDate: { gte: fromDate.toISOString(), lte: toDate.toISOString() } };
    const prevWhere = { ...where, incidentDate: { gte: prevFrom.toISOString(), lte: prevTo.toISOString() } };

    // Parallel data fetching
    const [
      totalIncidents,
      totalAmount,
      prevTotalIncidents,
      prevTotalAmount,
      byCategory,
      bySeverity,
      byStatus,
      allIncidents,
    ] = await Promise.all([
      prisma.lossIncident.count({ where: currentWhere }),
      prisma.lossIncident.aggregate({ where: currentWhere, _sum: { amount: true } }),
      prisma.lossIncident.count({ where: prevWhere }),
      prisma.lossIncident.aggregate({ where: prevWhere, _sum: { amount: true } }),
      prisma.lossIncident.groupBy({
        by: ['category'],
        where: currentWhere,
        _count: true,
        _sum: { amount: true },
      }),
      prisma.lossIncident.groupBy({
        by: ['severity'],
        where: currentWhere,
        _count: true,
      }),
      prisma.lossIncident.groupBy({
        by: ['status'],
        where: currentWhere,
        _count: true,
      }),
      prisma.lossIncident.findMany({
        where: currentWhere,
        select: { incidentDate: true, amount: true, description: true },
      }),
    ]);

    // Parse area from description (format: "[Bereich: xxx]" in description)
    const areaPattern = /\[Bereich:\s*([^\]]+)\]/;
    const areaCounts: Record<string, number> = {};
    const weekdayCounts: number[] = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    const hourCounts: Record<number, number> = {};
    for (let h = 9; h <= 22; h++) hourCounts[h] = 0;

    const monthlyAmounts: Record<string, number> = {};

    for (const inc of allIncidents) {
      // Area analysis
      const areaMatch = inc.description.match(areaPattern);
      const area = areaMatch ? areaMatch[1]! : 'Unbekannt';
      areaCounts[area] = (areaCounts[area] ?? 0) + 1;

      // Weekday analysis (0=Sunday in JS, shift to Mon=0)
      const d = new Date(inc.incidentDate);
      const jsDay = d.getDay(); // 0=Sun
      const weekday = jsDay === 0 ? 6 : jsDay - 1; // Mon=0, Sun=6
      weekdayCounts[weekday] = (weekdayCounts[weekday] ?? 0) + 1;

      // Hour analysis
      const hour = d.getHours();
      if (hour >= 9 && hour <= 22) {
        hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
      }

      // Monthly trend
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyAmounts[monthKey] = (monthlyAmounts[monthKey] || 0) + (Number(inc.amount) || 0);
    }

    // Sort areas by count descending, top 5
    const topAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area, count]) => ({ area, count }));

    // Shrinkage rate placeholder (would need revenue data)
    // For now, set to 0 — to be calculated with KPI revenue integration
    const shrinkageRate = 0;

    const currentTotal = Number(totalAmount._sum?.amount ?? 0);
    const prevTotal = Number(prevTotalAmount._sum?.amount ?? 0);
    const incidentChange = prevTotalIncidents > 0
      ? ((totalIncidents - prevTotalIncidents) / prevTotalIncidents) * 100
      : 0;
    const amountChange = prevTotal > 0
      ? ((currentTotal - prevTotal) / prevTotal) * 100
      : 0;

    // Monthly trend sorted
    const monthlyTrend = Object.entries(monthlyAmounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({ month, amount }));

    const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    res.json({
      totalIncidents,
      totalAmount: currentTotal,
      shrinkageRate,
      prevPeriod: {
        totalIncidents: prevTotalIncidents,
        totalAmount: prevTotal,
        incidentChange: Math.round(incidentChange * 10) / 10,
        amountChange: Math.round(amountChange * 10) / 10,
      },
      byCategory: byCategory.map((c) => ({
        category: c.category,
        label: CATEGORY_LABELS[c.category] || c.category,
        count: c._count,
        amount: Number(c._sum?.amount ?? 0),
      })),
      bySeverity: bySeverity.map((s) => ({
        severity: s.severity,
        count: s._count,
      })),
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      topAreas,
      byWeekday: WEEKDAY_LABELS.map((label, i) => ({
        day: label,
        count: weekdayCounts[i],
      })),
      byHour: Object.entries(hourCounts)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([hour, count]) => ({ hour: Number(hour), count })),
      monthlyTrend,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
