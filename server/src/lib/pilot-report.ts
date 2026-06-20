import prisma from './prisma.js';

/**
 * Pilot-Ergebnis-Report: aggregiert die messbaren Resultate der Pilot-Tools
 * (Spot-Checks, Follow-ups, Checklisten, Audits) tenant-weit auf **Store-Ebene**
 * für einen Zeitraum. Keine personenbezogene Auswertung (DSFA / § 87 BetrVG).
 */

export interface StoreRow {
  storeId: string;
  storeName: string;
  [k: string]: number | string | null;
}

export interface PilotReport {
  tenantName: string;
  from: string;
  to: string;
  spotChecks: {
    requests: number; targets: number; submitted: number; approved: number;
    onTimeRate: number | null; approvalRate: number | null; avgResponseMin: number | null;
    byStore: StoreRow[];
  };
  followUps: {
    total: number; done: number; overdue: number;
    completionRate: number | null; avgResolutionDays: number | null;
    byStore: StoreRow[];
  };
  checklists: { sessions: number; completed: number; completionRate: number | null; byStore: StoreRow[] };
  audits: { sessions: number; avgScore: number | null; byStore: StoreRow[] };
}

function rate(part: number, total: number): number | null {
  return total > 0 ? Math.round((part / total) * 100) : null;
}
function avg(nums: number[]): number | null {
  return nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
}

export async function collectPilotMetrics(tenantId: string, from: Date, to: Date): Promise<PilotReport> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
  const stores = await prisma.store.findMany({ where: { tenantId }, select: { id: true, name: true } });
  const storeName = new Map(stores.map((s) => [s.id, s.name]));

  // ── Spot-Checks ────────────────────────────────
  const requests = await prisma.photoRequest.findMany({
    where: { tenantId, createdAt: { gte: from, lte: to } },
    select: { createdAt: true, deadline: true, targets: { select: { storeId: true, status: true, submittedAt: true } } },
  });
  const scStore = new Map<string, { targets: number; submitted: number; approved: number; onTime: number; resp: number[] }>();
  let scReq = requests.length;
  for (const r of requests) {
    for (const t of r.targets) {
      const e = scStore.get(t.storeId) ?? { targets: 0, submitted: 0, approved: 0, onTime: 0, resp: [] };
      e.targets += 1;
      if (t.submittedAt) {
        e.submitted += 1;
        if (t.submittedAt.getTime() <= r.deadline.getTime()) e.onTime += 1;
        e.resp.push((t.submittedAt.getTime() - r.createdAt.getTime()) / 60000);
      }
      if (t.status === 'APPROVED') e.approved += 1;
      scStore.set(t.storeId, e);
    }
  }
  const scAgg = [...scStore.values()];
  const scByStore: StoreRow[] = [...scStore.entries()].map(([id, e]) => ({
    storeId: id, storeName: storeName.get(id) ?? id,
    targets: e.targets, submitted: e.submitted,
    onTimeRate: rate(e.onTime, e.submitted), approvalRate: rate(e.approved, e.submitted),
    avgResponseMin: avg(e.resp),
  }));

  // ── Follow-ups ─────────────────────────────────
  const fus = await prisma.followUpAction.findMany({
    where: { tenantId, createdAt: { gte: from, lte: to } },
    select: { storeId: true, status: true, dueDate: true, resolvedAt: true, createdAt: true },
  });
  const fuStore = new Map<string, { total: number; done: number; overdue: number; days: number[] }>();
  for (const f of fus) {
    const e = fuStore.get(f.storeId) ?? { total: 0, done: 0, overdue: 0, days: [] };
    e.total += 1;
    const isOpen = f.status === 'OPEN' || f.status === 'IN_PROGRESS';
    if (f.status === 'DONE') {
      e.done += 1;
      if (f.resolvedAt) e.days.push((f.resolvedAt.getTime() - f.createdAt.getTime()) / 86400000);
    }
    if (isOpen && f.dueDate && f.dueDate.getTime() < Date.now()) e.overdue += 1;
    fuStore.set(f.storeId, e);
  }
  const fuByStore: StoreRow[] = [...fuStore.entries()].map(([id, e]) => ({
    storeId: id, storeName: storeName.get(id) ?? id,
    total: e.total, done: e.done, overdue: e.overdue,
    completionRate: rate(e.done, e.total), avgResolutionDays: avg(e.days),
  }));

  // ── Checklisten ────────────────────────────────
  const cls = await prisma.checklistSession.findMany({
    where: { tenantId, startedAt: { gte: from, lte: to } },
    select: { storeId: true, status: true },
  });
  const clStore = new Map<string, { sessions: number; completed: number }>();
  for (const c of cls) {
    const e = clStore.get(c.storeId) ?? { sessions: 0, completed: 0 };
    e.sessions += 1;
    if (c.status === 'COMPLETED') e.completed += 1;
    clStore.set(c.storeId, e);
  }
  const clByStore: StoreRow[] = [...clStore.entries()].map(([id, e]) => ({
    storeId: id, storeName: storeName.get(id) ?? id,
    sessions: e.sessions, completed: e.completed, completionRate: rate(e.completed, e.sessions),
  }));

  // ── Audits ─────────────────────────────────────
  const audits = await prisma.auditSession.findMany({
    where: { tenantId, status: 'COMPLETED', completedAt: { gte: from, lte: to } },
    select: { storeId: true, overallScore: true },
  });
  const auStore = new Map<string, number[]>();
  for (const a of audits) {
    if (a.overallScore == null) continue;
    const arr = auStore.get(a.storeId) ?? [];
    arr.push(a.overallScore);
    auStore.set(a.storeId, arr);
  }
  const auByStore: StoreRow[] = [...auStore.entries()].map(([id, scores]) => ({
    storeId: id, storeName: storeName.get(id) ?? id,
    sessions: scores.length, avgScore: avg(scores),
  }));

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return {
    tenantName: tenant?.name ?? 'Unbekannt',
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    spotChecks: {
      requests: scReq,
      targets: sum(scAgg.map((e) => e.targets)),
      submitted: sum(scAgg.map((e) => e.submitted)),
      approved: sum(scAgg.map((e) => e.approved)),
      onTimeRate: rate(sum(scAgg.map((e) => e.onTime)), sum(scAgg.map((e) => e.submitted))),
      approvalRate: rate(sum(scAgg.map((e) => e.approved)), sum(scAgg.map((e) => e.submitted))),
      avgResponseMin: avg(scAgg.flatMap((e) => e.resp)),
      byStore: scByStore,
    },
    followUps: {
      total: fus.length,
      done: sum([...fuStore.values()].map((e) => e.done)),
      overdue: sum([...fuStore.values()].map((e) => e.overdue)),
      completionRate: rate(sum([...fuStore.values()].map((e) => e.done)), fus.length),
      avgResolutionDays: avg([...fuStore.values()].flatMap((e) => e.days)),
      byStore: fuByStore,
    },
    checklists: {
      sessions: cls.length,
      completed: sum([...clStore.values()].map((e) => e.completed)),
      completionRate: rate(sum([...clStore.values()].map((e) => e.completed)), cls.length),
      byStore: clByStore,
    },
    audits: {
      sessions: audits.length,
      avgScore: avg([...auStore.values()].flat()),
      byStore: auByStore,
    },
  };
}
