import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { challengeCreateSchema, challengeUpdateSchema, challengeEntrySchema, challengeVoteSchema } from '@shared/validators';

export const challengesRouter: RouterType = Router();
challengesRouter.use(authenticate, requireToolAccess('training.challenges'));

// ── GET /stores ──────────────────────────────────────
challengesRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
    else if (tenantId) where['tenantId'] = tenantId;
    const stores = await prisma.store.findMany({ where, select: { id: true, name: true, city: true }, orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /users ───────────────────────────────────────
challengesRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /dashboard ───────────────────────────────────
challengesRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;

    const [active, completed, myParticipations] = await Promise.all([
      prisma.challenge.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.challenge.findMany({
        where: { tenantId, status: 'COMPLETED' },
        include: {
          participants: {
            orderBy: { currentValue: 'desc' },
            take: 3,
            include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
          },
          _count: { select: { participants: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      prisma.challengeParticipant.findMany({
        where: { userId },
        include: {
          challenge: { select: { id: true, title: true, status: true, type: true, mode: true, targetValue: true } },
        },
      }),
    ]);

    const totalParticipants = await prisma.challengeParticipant.count({
      where: { challenge: { tenantId, status: 'ACTIVE' } },
    });
    const totalUsers = await prisma.user.count({ where: { tenantId, isActive: true } });
    const participationRate = totalUsers > 0 ? Math.round((totalParticipants / totalUsers) * 100) : 0;

    const myWins = myParticipations.filter((p) => {
      return p.challenge.status === 'COMPLETED' && p.rank === 1;
    }).length;

    const myBadges = myParticipations.filter((p) => p.completedAt).length;

    res.json({
      activeChallenges: active,
      participationRate,
      myWins,
      myBadges,
      completedChallenges: completed.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        mode: c.mode,
        participantCount: c._count.participants,
        winners: c.participants.slice(0, 3).map((p, i) => ({
          rank: i + 1,
          userName: p.user?.name ?? 'Unbekannt',
          storeName: p.store?.name,
          value: p.currentValue,
        })),
      })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET / — Challenges Liste ─────────────────────────
challengesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.type) where['type'] = req.query.type;
    if (req.query.storeId) {
      where['participants'] = { some: { storeId: req.query.storeId } };
    }

    const [data, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        include: {
          _count: { select: { participants: true, entries: true, votes: true } },
          participants: {
            where: { userId },
            take: 1,
            select: { id: true, currentValue: true, rank: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.challenge.count({ where }),
    ]);

    const enriched = data.map((ch) => ({
      ...ch,
      myParticipation: ch.participants[0] ?? null,
      participants: undefined,
    }));

    res.json({ data: enriched, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST / — Challenge erstellen ─────────────────────
challengesRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = challengeCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const { storeIds, ...challengeData } = parsed.data;
    const challenge = await prisma.challenge.create({
      data: { ...challengeData, tenantId, createdBy: userId },
    });
    res.status(201).json(challenge);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /:id — Challenge Detail mit Leaderboard ──────
challengesRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const challenge = await prisma.challenge.findFirst({
      where: { id: req.params['id'], tenantId },
      include: {
        creator: { select: { id: true, name: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true } },
            store: { select: { id: true, name: true } },
          },
          orderBy: { currentValue: 'desc' },
        },
        entries: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        votes: {
          select: { voterId: true, targetUserId: true },
        },
        _count: { select: { participants: true, entries: true, votes: true } },
      },
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge nicht gefunden.' });

    // Compute vote tally for VOTING mode
    const voteTally: Record<string, number> = {};
    if (challenge.mode === 'VOTING') {
      for (const v of challenge.votes) {
        voteTally[v.targetUserId] = (voteTally[v.targetUserId] ?? 0) + 1;
      }
    }

    // Determine time remaining
    const now = new Date();
    const end = new Date(challenge.endDate + 'T23:59:59');
    const start = new Date(challenge.startDate + 'T00:00:00');
    const msRemaining = Math.max(0, end.getTime() - now.getTime());
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const isStarted = now >= start;

    // Anonymize if needed
    const leaderboard = challenge.participants.map((p, i) => ({
      id: p.id,
      rank: i + 1,
      userId: p.userId,
      userName: challenge.anonymized ? `Teilnehmer ${i + 1}` : (p.user?.name ?? 'Unbekannt'),
      storeName: p.store?.name ?? null,
      currentValue: p.currentValue,
      votes: voteTally[p.userId] ?? 0,
      isMe: p.userId === userId,
    }));

    const myPosition = leaderboard.find((l) => l.isMe) ?? null;
    const myVote = challenge.votes.find((v) => v.voterId === userId)?.targetUserId ?? null;

    res.json({
      ...challenge,
      votes: undefined,
      leaderboard,
      myPosition,
      myVote,
      daysRemaining,
      isStarted,
      voteTally,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /:id — Challenge aktualisieren ───────────────
challengesRouter.put('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = challengeUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const existing = await prisma.challenge.findFirst({ where: { id: req.params['id'], tenantId } });
    if (!existing) return res.status(404).json({ error: 'Challenge nicht gefunden.' });

    // If completing, compute ranks
    if (parsed.data.status === 'COMPLETED') {
      const participants = await prisma.challengeParticipant.findMany({
        where: { challengeId: existing.id },
        orderBy: { currentValue: 'desc' },
      });
      for (let i = 0; i < participants.length; i++) {
        await prisma.challengeParticipant.update({
          where: { id: participants[i]!.id },
          data: { rank: i + 1, completedAt: new Date() },
        });
      }
    }

    const challenge = await prisma.challenge.update({
      where: { id: req.params['id'] },
      data: parsed.data,
    });
    res.json(challenge);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── DELETE /:id — Challenge löschen ─────────────────
challengesRouter.delete('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const existing = await prisma.challenge.findFirst({ where: { id: req.params['id'], tenantId } });
    if (!existing) return res.status(404).json({ error: 'Challenge nicht gefunden.' });

    await prisma.challenge.delete({ where: { id: req.params['id'] } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /:id/entries — Ergebnis einreichen ──────────
challengesRouter.post('/:id/entries', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const challengeId = req.params['id']!;
    const parsed = challengeEntrySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    // Must be participant
    const participant = await prisma.challengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (!participant) return res.status(403).json({ error: 'Sie nehmen nicht an dieser Challenge teil.' });

    const entry = await prisma.challengeEntry.create({
      data: { challengeId, userId, value: parsed.data.value, note: parsed.data.note },
    });

    // Update participant currentValue (accumulate)
    await prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: { currentValue: { increment: parsed.data.value } },
    });

    res.status(201).json(entry);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /:id/vote — Abstimmung (creative challenges)
challengesRouter.post('/:id/vote', async (req, res) => {
  try {
    const voterId = req.user!.sub;
    const challengeId = req.params['id']!;
    const parsed = challengeVoteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || challenge.mode !== 'VOTING') {
      return res.status(400).json({ error: 'Diese Challenge unterstuetzt keine Abstimmung.' });
    }

    // Upsert vote
    const vote = await prisma.challengeVote.upsert({
      where: { challengeId_voterId: { challengeId, voterId } },
      update: { targetUserId: parsed.data.targetUserId },
      create: { challengeId, voterId, targetUserId: parsed.data.targetUserId },
    });

    // Update vote counts on participants
    const allVotes = await prisma.challengeVote.findMany({ where: { challengeId } });
    const tally: Record<string, number> = {};
    for (const v of allVotes) {
      tally[v.targetUserId] = (tally[v.targetUserId] ?? 0) + 1;
    }
    // Update each participant's currentValue to their vote count
    const participants = await prisma.challengeParticipant.findMany({ where: { challengeId } });
    for (const p of participants) {
      await prisma.challengeParticipant.update({
        where: { id: p.id },
        data: { currentValue: tally[p.userId] ?? 0 },
      });
    }

    res.status(201).json(vote);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /:id/leaderboard ─────────────────────────────
challengesRouter.get('/:id/leaderboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;

    const challenge = await prisma.challenge.findFirst({
      where: { id: req.params['id'], tenantId },
      select: { id: true, anonymized: true, targetValue: true, mode: true },
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge nicht gefunden.' });

    const participants = await prisma.challengeParticipant.findMany({
      where: { challengeId: challenge.id },
      include: {
        user: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: { currentValue: 'desc' },
    });

    const leaderboard = participants.map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      userName: challenge.anonymized ? `Teilnehmer ${i + 1}` : (p.user?.name ?? 'Unbekannt'),
      storeName: p.store?.name ?? null,
      currentValue: p.currentValue,
      isMe: p.userId === userId,
    }));

    res.json({ leaderboard, targetValue: challenge.targetValue });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /:id/join — Beitreten ───────────────────────
challengesRouter.post('/:id/join', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const storeId = req.body.storeId ?? null;
    const participant = await prisma.challengeParticipant.create({
      data: { challengeId: req.params['id']!, userId, storeId },
    });
    res.status(201).json(participant);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Sie nehmen bereits teil.' });
    console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
