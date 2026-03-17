import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { teamMessageCreateSchema } from '@shared/validators';

export const teamPushRouter: RouterType = Router();
teamPushRouter.use(authenticate, requireToolAccess('komm.team_push'));

// ── STORES ──────────────────────────────────────────
// GET /stores — List stores for selector
teamPushRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where = toolStoreIds === 'all' ? {} : { id: { in: toolStoreIds } };
    const stores = await prisma.store.findMany({ where, select: { id: true, name: true, city: true }, orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── USERS ───────────────────────────────────────────
// GET /users — List users for recipient selector
teamPushRouter.get('/users', async (req, res) => {
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

// ── MESSAGES ────────────────────────────────────────

// GET /messages — List messages (paginated) with filters
teamPushRouter.get('/messages', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.priority) where['priority'] = req.query.priority;
    if (req.query.targetType) where['targetType'] = req.query.targetType;
    if (req.query.search) {
      where['OR'] = [
        { title: { contains: req.query.search as string } },
        { body: { contains: req.query.search as string } },
      ];
    }
    if (req.query.from) where['createdAt'] = { ...(where['createdAt'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['createdAt'] = { ...(where['createdAt'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const [data, total] = await Promise.all([
      prisma.teamMessage.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true } },
          _count: { select: { reads: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.teamMessage.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /messages/:id — Single message with read details
teamPushRouter.get('/messages/:id', async (req, res) => {
  try {
    const message = await prisma.teamMessage.findUnique({
      where: { id: req.params['id'] },
      include: {
        sender: { select: { id: true, name: true } },
        reads: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { readAt: 'desc' },
        },
      },
    });
    if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden.' });

    // Total eligible recipients for read rate
    const tenantUserCount = await prisma.user.count({
      where: { tenantId: message.tenantId, isActive: true },
    });

    res.json({ ...message, totalRecipients: tenantUserCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /messages — Create message
teamPushRouter.post('/messages', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const userId = req.user!.sub;
    const parsed = teamMessageCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const message = await prisma.teamMessage.create({
      data: { ...parsed.data, tenantId, sentBy: userId },
      include: {
        sender: { select: { id: true, name: true } },
        _count: { select: { reads: true } },
      },
    });
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /messages/:id — Delete message (only sender can delete)
teamPushRouter.delete('/messages/:id', async (req, res) => {
  try {
    const message = await prisma.teamMessage.findUnique({ where: { id: req.params['id'] } });
    if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden.' });
    if (message.sentBy !== req.user!.sub) return res.status(403).json({ error: 'Nur der Absender kann die Nachricht loeschen.' });

    // Delete reads first, then message
    await prisma.teamMessageRead.deleteMany({ where: { messageId: message.id } });
    await prisma.teamMessage.delete({ where: { id: message.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── READ CONFIRMATIONS ──────────────────────────────

// POST /messages/:id/read — Mark as read
teamPushRouter.post('/messages/:id/read', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const read = await prisma.teamMessageRead.upsert({
      where: { messageId_userId: { messageId: req.params['id']!, userId } },
      create: { messageId: req.params['id']!, userId },
      update: { readAt: new Date() },
    });
    res.status(201).json(read);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /messages/:id/unread — List users who have NOT read a message
teamPushRouter.get('/messages/:id/unread', async (req, res) => {
  try {
    const message = await prisma.teamMessage.findUnique({
      where: { id: req.params['id'] },
      include: { reads: { select: { userId: true } } },
    });
    if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden.' });

    const readUserIds = message.reads.map(r => r.userId);
    const unreadUsers = await prisma.user.findMany({
      where: {
        tenantId: message.tenantId,
        isActive: true,
        id: { notIn: readUserIds },
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(unreadUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DASHBOARD / REPORTS ─────────────────────────────

// GET /dashboard — KPIs + analytics
teamPushRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;

    const where: Record<string, unknown> = { tenantId };
    if (req.query.from) where['createdAt'] = { ...(where['createdAt'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['createdAt'] = { ...(where['createdAt'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const messages = await prisma.teamMessage.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true } },
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalUsers = await prisma.user.count({ where: { tenantId, isActive: true } });
    const totalMessages = messages.length;
    const totalReads = messages.reduce((sum, m) => sum + m._count.reads, 0);
    const avgReadRate = totalMessages > 0 && totalUsers > 0
      ? Math.round((totalReads / (totalMessages * totalUsers)) * 100)
      : 0;
    const urgentCount = messages.filter(m => m.priority === 'URGENT').length;
    const highCount = messages.filter(m => m.priority === 'HIGH').length;

    // By priority
    const byPriority = { NORMAL: 0, HIGH: 0, URGENT: 0 } as Record<string, number>;
    messages.forEach(m => { byPriority[m.priority] = (byPriority[m.priority] ?? 0) + 1; });

    // By target type
    const byTarget = { ALL: 0, STORE: 0, ROLE: 0 } as Record<string, number>;
    messages.forEach(m => { byTarget[m.targetType] = (byTarget[m.targetType] ?? 0) + 1; });

    // Top senders
    const senderMap = new Map<string, { id: string; name: string; count: number; totalReads: number }>();
    messages.forEach(m => {
      const existing = senderMap.get(m.sentBy) || { id: m.sentBy, name: m.sender.name, count: 0, totalReads: 0 };
      existing.count++;
      existing.totalReads += m._count.reads;
      senderMap.set(m.sentBy, existing);
    });
    const topSenders = Array.from(senderMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Trend by date
    const dateMap = new Map<string, { sent: number; reads: number }>();
    messages.forEach(m => {
      const dateStr = new Date(m.createdAt).toISOString().split('T')[0] as string;
      const existing = dateMap.get(dateStr) ?? { sent: 0, reads: 0 };
      existing.sent++;
      existing.reads += m._count.reads;
      dateMap.set(dateStr, existing);
    });
    const trends = Array.from(dateMap.entries())
      .map(([date, d]) => ({ date, sent: d.sent, reads: d.reads }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Read rate per message (for best/worst)
    const messagesWithRate = messages.map(m => ({
      id: m.id,
      title: m.title,
      readRate: totalUsers > 0 ? Math.round((m._count.reads / totalUsers) * 100) : 0,
      reads: m._count.reads,
    }));
    const bestRead = messagesWithRate.length > 0
      ? messagesWithRate.reduce((a, b) => a.readRate > b.readRate ? a : b)
      : null;

    res.json({
      kpis: {
        totalMessages,
        totalReads,
        avgReadRate,
        totalUsers,
        urgentCount,
        highCount,
      },
      byPriority,
      byTarget,
      topSenders,
      trends,
      bestRead,
      recentMessages: messages.slice(0, 5),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/reach — Calculate reach rate
teamPushRouter.get('/reports/reach', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const messages = await prisma.teamMessage.findMany({
      where: { tenantId },
      include: { _count: { select: { reads: true } } },
    });
    const totalMessages = messages.length;
    const totalReads = messages.reduce((sum, m) => sum + m._count.reads, 0);
    res.json({ totalMessages, totalReads, avgReach: totalMessages > 0 ? Math.round((totalReads / totalMessages) * 100) / 100 : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
