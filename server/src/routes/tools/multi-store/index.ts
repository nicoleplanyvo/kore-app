/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';

export const multiStoreRouter: RouterType = Router();
multiStoreRouter.use(authenticate, requireToolAccess('regional.multi_store_view'));

// ── In-Memory Task Storage ───────────────────────────
// (No Prisma model available — schema must not be modified)

interface MsTask {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  type: 'TODO' | 'CHECKLIST' | 'CAMPAIGN' | 'SURVEY';
  category: string;
  tags: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'REJECTED';
  storeIds: string[];
  deadline: string | null;
  requiresPhoto: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  // Checklist items (JSON-encoded)
  checklistItems: string[];
  // Campaign fields
  campaignName: string | null;
  campaignStart: string | null;
  campaignEnd: string | null;
  // Survey fields
  surveyQuestions: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'SCALE' | 'FREE_TEXT' | 'PHOTO';
  question: string;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
}

interface MsTaskResponse {
  id: string;
  taskId: string;
  storeId: string;
  storeName: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  completedBy: string | null;
  completedByName: string | null;
  completedAt: string | null;
  photoUrl: string | null;
  feedback: string | null;
  rejectionReason: string | null;
  checklistProgress: Record<string, boolean>;
  surveyAnswers: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface MsComment {
  id: string;
  taskId: string;
  storeId: string | null;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

// In-memory stores
const tasks = new Map<string, MsTask>();
const responses = new Map<string, MsTaskResponse>();
const comments = new Map<string, MsComment>();

let idCounter = 1;
function genId(): string {
  return `ms_${Date.now()}_${idCounter++}`;
}

// ── STORES ───────────────────────────────────────────

multiStoreRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };

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

// ── USERS ────────────────────────────────────────────

multiStoreRouter.get('/users', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── TASKS CRUD ───────────────────────────────────────

// GET /tasks — List tasks with filters
multiStoreRouter.get('/tasks', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = req.user!.tenantId!;
    let allTasks = Array.from(tasks.values()).filter((t) => t.tenantId === tenantId);

    // Filter by store access
    if (toolStoreIds !== 'all') {
      allTasks = allTasks.filter((t) => t.storeIds.some((sid) => toolStoreIds.includes(sid)));
    }

    // Filter by type
    if (req.query.type) allTasks = allTasks.filter((t) => t.type === req.query.type);

    // Filter by status
    if (req.query.status) allTasks = allTasks.filter((t) => t.status === req.query.status);

    // Filter by priority
    if (req.query.priority) allTasks = allTasks.filter((t) => t.priority === req.query.priority);

    // Filter by category
    if (req.query.category) allTasks = allTasks.filter((t) => t.category === req.query.category);

    // Filter by storeId (specific store)
    if (req.query.storeId) allTasks = allTasks.filter((t) => t.storeIds.includes(req.query.storeId as string));

    // Search
    if (req.query.search) {
      const s = (req.query.search as string).toLowerCase();
      allTasks = allTasks.filter(
        (t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s) || t.tags.some((tag) => tag.toLowerCase().includes(s)),
      );
    }

    // Sort by createdAt desc
    allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const total = allTasks.length;
    const data = allTasks.slice((page - 1) * pageSize, page * pageSize);

    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /tasks/:id — Single task with responses
multiStoreRouter.get('/tasks/:id', async (req, res) => {
  try {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });

    const taskResponses = Array.from(responses.values()).filter((r) => r.taskId === task.id);
    const taskComments = Array.from(comments.values())
      .filter((c) => c.taskId === task.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Compute compliance
    const totalStores = task.storeIds.length;
    const completedStores = taskResponses.filter((r) => r.status === 'COMPLETED').length;
    const complianceRate = totalStores > 0 ? Math.round((completedStores / totalStores) * 100) : 0;

    res.json({ ...task, responses: taskResponses, comments: taskComments, complianceRate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /tasks — Create task
multiStoreRouter.post('/tasks', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.sub;

    const body = req.body;
    if (!body.title || !body.storeIds?.length) {
      return res.status(400).json({ error: 'Titel und mindestens ein Store erforderlich.' });
    }

    // Validate store access
    if (toolStoreIds !== 'all') {
      const invalid = body.storeIds.filter((sid: string) => !toolStoreIds.includes(sid));
      if (invalid.length > 0) return res.status(403).json({ error: 'Kein Zugriff auf einige Stores.' });
    }

    // Get creator name
    const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

    // Get store names for responses
    const stores = await prisma.store.findMany({
      where: { id: { in: body.storeIds } },
      select: { id: true, name: true },
    });
    const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));

    const now = new Date().toISOString();
    const taskId = genId();

    const task: MsTask = {
      id: taskId,
      tenantId,
      title: body.title,
      description: body.description || '',
      type: body.type || 'TODO',
      category: body.category || 'Allgemein',
      tags: body.tags || [],
      priority: body.priority || 'MEDIUM',
      status: 'OPEN',
      storeIds: body.storeIds,
      deadline: body.deadline || null,
      requiresPhoto: body.requiresPhoto || false,
      createdBy: userId,
      createdByName: creator?.name || 'Unbekannt',
      createdAt: now,
      updatedAt: now,
      checklistItems: body.checklistItems || [],
      campaignName: body.campaignName || null,
      campaignStart: body.campaignStart || null,
      campaignEnd: body.campaignEnd || null,
      surveyQuestions: body.surveyQuestions || [],
    };

    tasks.set(taskId, task);

    // Create a response entry for each store
    for (const storeId of body.storeIds) {
      const respId = genId();
      const resp: MsTaskResponse = {
        id: respId,
        taskId,
        storeId,
        storeName: storeMap[storeId] ?? storeId,
        status: 'OPEN',
        completedBy: null,
        completedByName: null,
        completedAt: null,
        photoUrl: null,
        feedback: null,
        rejectionReason: null,
        checklistProgress: {},
        surveyAnswers: {},
        createdAt: now,
        updatedAt: now,
      };
      responses.set(respId, resp);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /tasks/:id — Update task
multiStoreRouter.put('/tasks/:id', async (req, res) => {
  try {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });

    const body = req.body;
    const now = new Date().toISOString();

    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined) task.description = body.description;
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.category !== undefined) task.category = body.category;
    if (body.tags !== undefined) task.tags = body.tags;
    if (body.deadline !== undefined) task.deadline = body.deadline;
    if (body.requiresPhoto !== undefined) task.requiresPhoto = body.requiresPhoto;
    if (body.status !== undefined) task.status = body.status;
    if (body.checklistItems !== undefined) task.checklistItems = body.checklistItems;
    if (body.campaignName !== undefined) task.campaignName = body.campaignName;
    if (body.campaignStart !== undefined) task.campaignStart = body.campaignStart;
    if (body.campaignEnd !== undefined) task.campaignEnd = body.campaignEnd;
    task.updatedAt = now;

    tasks.set(task.id, task);
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /tasks/:id — Delete task
multiStoreRouter.delete('/tasks/:id', async (req, res) => {
  try {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });

    tasks.delete(task.id);

    // Remove associated responses and comments
    for (const [key, resp] of responses) {
      if (resp.taskId === task.id) responses.delete(key);
    }
    for (const [key, comment] of comments) {
      if (comment.taskId === task.id) comments.delete(key);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── RESPONSES (Store-Level) ──────────────────────────

// PUT /tasks/:taskId/responses/:storeId — Update store response
multiStoreRouter.put('/tasks/:taskId/responses/:storeId', async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const storeId = req.params.storeId;
    const userId = req.user!.sub;

    const resp = Array.from(responses.values()).find((r) => r.taskId === taskId && r.storeId === storeId);
    if (!resp) return res.status(404).json({ error: 'Store-Antwort nicht gefunden.' });

    const body = req.body;
    const now = new Date().toISOString();

    if (body.status !== undefined) {
      resp.status = body.status;
      if (body.status === 'COMPLETED') {
        resp.completedBy = userId;
        const completer = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        resp.completedByName = completer?.name || 'Unbekannt';
        resp.completedAt = now;
      }
      if (body.status === 'REJECTED') {
        resp.rejectionReason = body.rejectionReason || null;
      }
    }
    if (body.feedback !== undefined) resp.feedback = body.feedback;
    if (body.photoUrl !== undefined) resp.photoUrl = body.photoUrl;
    if (body.checklistProgress !== undefined) resp.checklistProgress = body.checklistProgress;
    if (body.surveyAnswers !== undefined) resp.surveyAnswers = body.surveyAnswers;
    resp.updatedAt = now;

    responses.set(resp.id, resp);

    // Update parent task status based on responses
    const task = tasks.get(taskId);
    if (task) {
      const taskResps = Array.from(responses.values()).filter((r) => r.taskId === taskId);
      const allCompleted = taskResps.every((r) => r.status === 'COMPLETED');
      const someStarted = taskResps.some((r) => r.status === 'IN_PROGRESS' || r.status === 'COMPLETED');
      if (allCompleted) task.status = 'COMPLETED';
      else if (someStarted) task.status = 'IN_PROGRESS';
      task.updatedAt = now;
      tasks.set(task.id, task);
    }

    res.json(resp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── COMMENTS ─────────────────────────────────────────

// GET /tasks/:taskId/comments
multiStoreRouter.get('/tasks/:taskId/comments', async (req, res) => {
  try {
    const taskComments = Array.from(comments.values())
      .filter((c) => c.taskId === req.params.taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(taskComments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /tasks/:taskId/comments — Add comment
multiStoreRouter.post('/tasks/:taskId/comments', async (req, res) => {
  try {
    const task = tasks.get(req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });

    const userId = req.user!.sub;
    if (!req.body.message) return res.status(400).json({ error: 'Nachricht erforderlich.' });

    const creator = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

    const commentId = genId();
    const comment: MsComment = {
      id: commentId,
      taskId: task.id,
      storeId: req.body.storeId || null,
      userId,
      userName: creator?.name || 'Unbekannt',
      message: req.body.message,
      createdAt: new Date().toISOString(),
    };

    comments.set(commentId, comment);
    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DASHBOARD ────────────────────────────────────────

multiStoreRouter.get('/dashboard', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = req.user!.tenantId!;

    let allTasks = Array.from(tasks.values()).filter((t) => t.tenantId === tenantId);
    if (toolStoreIds !== 'all') {
      allTasks = allTasks.filter((t) => t.storeIds.some((sid) => toolStoreIds.includes(sid)));
    }

    const allResponses = Array.from(responses.values());
    const taskIds = new Set(allTasks.map((t) => t.id));
    const relevantResponses = allResponses.filter((r) => taskIds.has(r.taskId));

    // KPIs
    const totalTasks = allTasks.length;
    const openTasks = allTasks.filter((t) => t.status === 'OPEN').length;
    const inProgressTasks = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED').length;
    const overdueTasks = allTasks.filter((t) => {
      if (!t.deadline) return false;
      return new Date(t.deadline) < new Date() && t.status !== 'COMPLETED';
    }).length;

    // Overall compliance
    const totalResponses = relevantResponses.length;
    const completedResponses = relevantResponses.filter((r) => r.status === 'COMPLETED').length;
    const complianceRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;

    // Compliance by store
    const storeComplianceMap = new Map<string, { total: number; completed: number; storeName: string }>();
    for (const r of relevantResponses) {
      const entry = storeComplianceMap.get(r.storeId) || { total: 0, completed: 0, storeName: r.storeName };
      entry.total++;
      if (r.status === 'COMPLETED') entry.completed++;
      storeComplianceMap.set(r.storeId, entry);
    }

    const storeCompliance = Array.from(storeComplianceMap.entries())
      .map(([storeId, data]) => ({
        storeId,
        storeName: data.storeName,
        total: data.total,
        completed: data.completed,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }))
      .sort((a, b) => a.rate - b.rate);

    // Problem stores (< 50% compliance)
    const problemStores = storeCompliance.filter((s) => s.rate < 50);

    // Trend (by week, last 4 weeks)
    const trends: { week: string; created: number; completed: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      const weekLabel = `KW ${getWeekNumber(weekStart)}`;

      const created = allTasks.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= weekStart && d < weekEnd;
      }).length;

      const completed = relevantResponses.filter((r) => {
        if (!r.completedAt) return false;
        const d = new Date(r.completedAt);
        return d >= weekStart && d < weekEnd;
      }).length;

      trends.push({ week: weekLabel, created, completed });
    }

    // Tasks by type
    const byType = {
      TODO: allTasks.filter((t) => t.type === 'TODO').length,
      CHECKLIST: allTasks.filter((t) => t.type === 'CHECKLIST').length,
      CAMPAIGN: allTasks.filter((t) => t.type === 'CAMPAIGN').length,
      SURVEY: allTasks.filter((t) => t.type === 'SURVEY').length,
    };

    // Tasks by priority
    const byPriority = {
      LOW: allTasks.filter((t) => t.priority === 'LOW').length,
      MEDIUM: allTasks.filter((t) => t.priority === 'MEDIUM').length,
      HIGH: allTasks.filter((t) => t.priority === 'HIGH').length,
      URGENT: allTasks.filter((t) => t.priority === 'URGENT').length,
    };

    // Average response time (time from creation to completion)
    const completedWithTime = relevantResponses.filter((r) => r.completedAt);
    let avgResponseTimeHours = 0;
    if (completedWithTime.length > 0) {
      const totalMs = completedWithTime.reduce((sum, r) => {
        return sum + (new Date(r.completedAt!).getTime() - new Date(r.createdAt).getTime());
      }, 0);
      avgResponseTimeHours = Math.round(totalMs / completedWithTime.length / 3600000);
    }

    res.json({
      kpis: {
        totalTasks,
        openTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        complianceRate,
        avgResponseTimeHours,
      },
      storeCompliance,
      problemStores,
      trends,
      byType,
      byPriority,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── OVERVIEW (Legacy — original store overview) ──────

multiStoreRouter.get('/overview', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });

    const storeIds = stores.map((s) => s.id);

    // Latest KPI per store
    const kpiEntries = await prisma.kpiEntry.findMany({
      where: { storeId: { in: storeIds } },
      orderBy: { date: 'desc' },
    });

    const latestKpi: Record<string, (typeof kpiEntries)[0]> = {};
    for (const k of kpiEntries) {
      if (!latestKpi[k.storeId]) latestKpi[k.storeId] = k;
    }

    // Footfall summary (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const footfallEntries = await prisma.footfallEntry.findMany({
      where: {
        storeId: { in: storeIds },
        date: { gte: sevenDaysAgo.toISOString().split('T')[0] },
      },
    });

    const footfallByStore: Record<string, { totalFootfall: number; totalRevenue: number; totalTransactions: number }> = {};
    for (const f of footfallEntries) {
      const sid = f.storeId;
      if (!footfallByStore[sid]) footfallByStore[sid] = { totalFootfall: 0, totalRevenue: 0, totalTransactions: 0 };
      const bucket = footfallByStore[sid]!;
      bucket.totalFootfall += f.footfall;
      bucket.totalRevenue += f.revenue;
      bucket.totalTransactions += f.transactions;
    }

    // Open maintenance requests per store
    const maintenanceOpen = await prisma.maintenanceRequest.groupBy({
      by: ['storeId'],
      where: { storeId: { in: storeIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      _count: { id: true },
    });
    const maintenanceMap: Record<string, number> = {};
    for (const m of maintenanceOpen) {
      maintenanceMap[m.storeId] = m._count.id;
    }

    // In-memory task compliance per store
    const tenantId = req.user!.tenantId!;
    const allTasks = Array.from(tasks.values()).filter((t) => t.tenantId === tenantId);
    const allResp = Array.from(responses.values());

    const taskComplianceByStore: Record<string, { total: number; completed: number }> = {};
    for (const sid of storeIds) {
      const storeResps = allResp.filter((r) => {
        const task = allTasks.find((t) => t.id === r.taskId);
        return task && r.storeId === sid;
      });
      const completed = storeResps.filter((r) => r.status === 'COMPLETED').length;
      taskComplianceByStore[sid] = { total: storeResps.length, completed };
    }

    const overview = stores.map((s) => {
      const kpi = latestKpi[s.id];
      const taskData = taskComplianceByStore[s.id] ?? { total: 0, completed: 0 };
      return {
        storeId: s.id,
        storeName: s.name,
        city: s.city,
        kpi: kpi
          ? {
              revenue: kpi.revenue,
              transactions: kpi.transactions,
              footfall: kpi.footfall,
              unitsSold: kpi.unitsSold,
              date: kpi.date,
            }
          : null,
        footfall7d: footfallByStore[s.id] ?? { totalFootfall: 0, totalRevenue: 0, totalTransactions: 0 },
        openMaintenance: maintenanceMap[s.id] ?? 0,
        taskCompliance: taskData.total > 0 ? Math.round((taskData.completed / taskData.total) * 100) : 100,
        openTasks: taskData.total - taskData.completed,
      };
    });

    res.json(overview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── COMPARISON ───────────────────────────────────────

multiStoreRouter.get('/comparison', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const storeIds = stores.map((s) => s.id);
    const period = (req.query.period as string) || '7d';
    const days = period === '30d' ? 30 : period === '14d' ? 14 : 7;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const kpiEntries = await prisma.kpiEntry.findMany({
      where: {
        storeId: { in: storeIds },
        date: { gte: fromDate.toISOString().split('T')[0] },
      },
    });

    const groupByStore: Record<string, any[]> = {};
    for (const k of kpiEntries) {
      if (!groupByStore[k.storeId]) groupByStore[k.storeId] = [];
      groupByStore[k.storeId]!.push(k);
    }

    const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));

    const comparison = Object.entries(groupByStore).map(([storeId, entries]) => {
      const totalRevenue = entries.reduce((s: number, e: any) => s + e.revenue, 0);
      const totalTransactions = entries.reduce((s: number, e: any) => s + (e.transactions ?? 0), 0);
      const totalFootfall = entries.reduce((s: number, e: any) => s + (e.footfall ?? 0), 0);
      const totalUnitsSold = entries.reduce((s: number, e: any) => s + (e.unitsSold ?? 0), 0);
      const avgRevenuePerDay = entries.length > 0 ? totalRevenue / entries.length : 0;
      return {
        storeId,
        storeName: storeMap[storeId] ?? storeId,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        totalFootfall,
        totalUnitsSold,
        avgRevenuePerDay: Math.round(avgRevenuePerDay * 100) / 100,
        dataPoints: entries.length,
      };
    });

    comparison.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json(comparison);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── RANKING ──────────────────────────────────────────

multiStoreRouter.get('/ranking', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, name: true, city: true },
    });

    const storeIds = stores.map((s) => s.id);
    const metric = (req.query.metric as string) || 'revenue';

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    const kpiEntries = await prisma.kpiEntry.findMany({
      where: {
        storeId: { in: storeIds },
        date: { gte: fromDate.toISOString().split('T')[0] },
      },
    });

    const rankGroupByStore: Record<string, any[]> = {};
    for (const k of kpiEntries) {
      if (!rankGroupByStore[k.storeId]) rankGroupByStore[k.storeId] = [];
      rankGroupByStore[k.storeId]!.push(k);
    }

    const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

    const rankings = Object.entries(rankGroupByStore).map(([storeId, entries]) => {
      let value = 0;
      if (metric === 'revenue') value = entries.reduce((s: number, e: any) => s + e.revenue, 0);
      else if (metric === 'transactions') value = entries.reduce((s: number, e: any) => s + (e.transactions ?? 0), 0);
      else if (metric === 'footfall') value = entries.reduce((s: number, e: any) => s + (e.footfall ?? 0), 0);
      else if (metric === 'unitsSold') value = entries.reduce((s: number, e: any) => s + (e.unitsSold ?? 0), 0);

      const store = storeMap[storeId] as any;
      return {
        storeId,
        storeName: store?.name ?? storeId,
        city: store?.city ?? '',
        metric,
        value: Math.round(value * 100) / 100,
        rank: 0,
      };
    });

    rankings.sort((a, b) => b.value - a.value);
    rankings.forEach((r, i) => { r.rank = i + 1; });

    res.json(rankings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── HELPERS ──────────────────────────────────────────

function getWeekNumber(d: Date): number {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - oneJan.getTime()) / 86400000) + 1;
  return Math.ceil(dayOfYear / 7);
}
