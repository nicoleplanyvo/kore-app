import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { pulseSurveyCreateSchema, pulseQuestionCreateSchema, pulseRespondSchema } from '@shared/validators';

export const pulseSurveyRouter: RouterType = Router();
pulseSurveyRouter.use(authenticate, requireToolAccess('coaching.pulse_survey'));

// ── STORES ──────────────────────────────────────────
pulseSurveyRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where = toolStoreIds === 'all' ? {} : { id: { in: toolStoreIds } };
    const stores = await prisma.store.findMany({ where, select: { id: true, name: true, city: true }, orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── SURVEYS ─────────────────────────────────────────

// GET /surveys — list all surveys for tenant
pulseSurveyRouter.get('/surveys', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const surveys = await prisma.pulseSurvey.findMany({
      where: { tenantId },
      include: { _count: { select: { questions: true, responses: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(surveys);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /surveys — create new survey
pulseSurveyRouter.post('/surveys', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;
    const createdBy = req.user!.sub;
    const parsed = pulseSurveyCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const survey = await prisma.pulseSurvey.create({ data: { ...parsed.data, tenantId, createdBy } });
    res.status(201).json(survey);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /surveys/:id — survey detail with questions
pulseSurveyRouter.get('/surveys/:id', async (req, res) => {
  try {
    const survey = await prisma.pulseSurvey.findUnique({
      where: { id: req.params['id'] },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { responses: true } },
      },
    });
    if (!survey) return res.status(404).json({ error: 'Umfrage nicht gefunden.' });
    res.json(survey);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /surveys/:id — update survey (status, title, dates)
pulseSurveyRouter.put('/surveys/:id', async (req, res) => {
  try {
    const { title, status, startDate, endDate, isAnonymous } = req.body;
    const data: Record<string, unknown> = {};
    if (title !== undefined) data['title'] = title;
    if (status !== undefined) data['status'] = status;
    if (startDate !== undefined) data['startDate'] = startDate;
    if (endDate !== undefined) data['endDate'] = endDate;
    if (isAnonymous !== undefined) data['isAnonymous'] = isAnonymous;

    const survey = await prisma.pulseSurvey.update({
      where: { id: req.params['id'] },
      data,
      include: { _count: { select: { questions: true, responses: true } } },
    });
    res.json(survey);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// DELETE /surveys/:id
pulseSurveyRouter.delete('/surveys/:id', async (req, res) => {
  try {
    const surveyId = req.params['id']!;
    // Delete answers, responses, questions, then survey
    const responses = await prisma.pulseResponse.findMany({ where: { surveyId }, select: { id: true } });
    const responseIds = responses.map(r => r.id);
    if (responseIds.length > 0) {
      await prisma.pulseAnswer.deleteMany({ where: { responseId: { in: responseIds } } });
    }
    await prisma.pulseResponse.deleteMany({ where: { surveyId } });
    await prisma.pulseQuestion.deleteMany({ where: { surveyId } });
    await prisma.pulseSurvey.delete({ where: { id: surveyId } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── QUESTIONS ───────────────────────────────────────

// POST /surveys/:id/questions
pulseSurveyRouter.post('/surveys/:id/questions', async (req, res) => {
  try {
    const parsed = pulseQuestionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const question = await prisma.pulseQuestion.create({ data: { ...parsed.data, surveyId: req.params['id']! } });
    res.status(201).json(question);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /surveys/:surveyId/questions/:qid
pulseSurveyRouter.put('/surveys/:surveyId/questions/:qid', async (req, res) => {
  try {
    const { text, type, options, sortOrder } = req.body;
    const data: Record<string, unknown> = {};
    if (text !== undefined) data['text'] = text;
    if (type !== undefined) data['type'] = type;
    if (options !== undefined) data['options'] = options;
    if (sortOrder !== undefined) data['sortOrder'] = sortOrder;
    const question = await prisma.pulseQuestion.update({ where: { id: req.params['qid'] }, data });
    res.json(question);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// DELETE /surveys/:surveyId/questions/:qid
pulseSurveyRouter.delete('/surveys/:surveyId/questions/:qid', async (req, res) => {
  try {
    await prisma.pulseAnswer.deleteMany({ where: { questionId: req.params['qid'] } });
    await prisma.pulseQuestion.delete({ where: { id: req.params['qid'] } });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── RESPOND ─────────────────────────────────────────

// POST /surveys/:id/respond
pulseSurveyRouter.post('/surveys/:id/respond', async (req, res) => {
  try {
    const respondentId = req.user!.sub;
    const surveyId = req.params['id']!;
    const parsed = pulseRespondSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    // Check survey is active
    const survey = await prisma.pulseSurvey.findUnique({ where: { id: surveyId } });
    if (!survey) return res.status(404).json({ error: 'Umfrage nicht gefunden.' });
    if (survey.status !== 'ACTIVE') return res.status(400).json({ error: 'Umfrage ist nicht aktiv.' });

    // Check double participation
    const existing = await prisma.pulseResponse.findFirst({ where: { surveyId, respondentId } });
    if (existing) return res.status(409).json({ error: 'Sie haben bereits an dieser Umfrage teilgenommen.' });

    const response = await prisma.pulseResponse.create({
      data: {
        surveyId,
        storeId: parsed.data.storeId,
        respondentId: survey.isAnonymous ? null : respondentId,
        answers: { create: parsed.data.answers },
      },
      include: { answers: true },
    });
    res.status(201).json(response);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── RESULTS ─────────────────────────────────────────

// GET /surveys/:id/results?storeId=
pulseSurveyRouter.get('/surveys/:id/results', async (req, res) => {
  try {
    const storeId = req.query['storeId'] as string | undefined;

    const survey = await prisma.pulseSurvey.findUnique({
      where: { id: req.params['id'] },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
        responses: {
          where: storeId ? { storeId } : {},
          include: { answers: true },
        },
      },
    });
    if (!survey) return res.status(404).json({ error: 'Umfrage nicht gefunden.' });

    const totalResponses = survey.responses.length;

    const questionResults = survey.questions.map(q => {
      const answers = survey.responses.flatMap(r => r.answers.filter(a => a.questionId === q.id));

      // Rating stats
      const ratings = answers.filter(a => a.valueRating != null).map(a => a.valueRating!);
      const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((s, v) => s + v, 0) / ratings.length * 10) / 10 : null;
      const ratingDistribution: Record<number, number> = {};
      if (q.type === 'RATING') {
        for (let i = 1; i <= 5; i++) ratingDistribution[i] = 0;
        ratings.forEach(r => { ratingDistribution[r] = (ratingDistribution[r] ?? 0) + 1; });
      }

      // Choice distribution
      const choiceDistribution: Record<string, number> = {};
      if (q.type === 'CHOICE') {
        answers.forEach(a => {
          if (a.valueChoice) {
            choiceDistribution[a.valueChoice] = (choiceDistribution[a.valueChoice] ?? 0) + 1;
          }
        });
      }

      // Text responses
      const textResponses = answers.filter(a => a.valueText).map(a => a.valueText!);

      return {
        questionId: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        totalAnswers: answers.length,
        avgRating,
        ratingDistribution: q.type === 'RATING' ? ratingDistribution : undefined,
        choiceDistribution: q.type === 'CHOICE' ? choiceDistribution : undefined,
        textResponses: q.type === 'TEXT' ? textResponses : undefined,
      };
    });

    // Participation by store
    const storeParticipation = new Map<string, number>();
    survey.responses.forEach(r => {
      const sid = r.storeId || 'unknown';
      storeParticipation.set(sid, (storeParticipation.get(sid) ?? 0) + 1);
    });

    res.json({
      survey: { id: survey.id, title: survey.title, status: survey.status, isAnonymous: survey.isAnonymous },
      totalResponses,
      questionResults,
      participationByStore: Object.fromEntries(storeParticipation),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── DASHBOARD ───────────────────────────────────────

// GET /dashboard — overview KPIs across all surveys
pulseSurveyRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId!;

    const surveys = await prisma.pulseSurvey.findMany({
      where: { tenantId },
      include: {
        questions: true,
        responses: { include: { answers: true } },
        _count: { select: { questions: true, responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSurveys = surveys.length;
    const activeSurveys = surveys.filter(s => s.status === 'ACTIVE').length;
    const totalResponses = surveys.reduce((s, sv) => s + sv.responses.length, 0);
    const totalQuestions = surveys.reduce((s, sv) => s + sv.questions.length, 0);

    // Overall average rating across all rating questions
    let allRatings: number[] = [];
    surveys.forEach(sv => {
      sv.responses.forEach(r => {
        r.answers.forEach(a => {
          if (a.valueRating != null) allRatings.push(a.valueRating);
        });
      });
    });
    const overallAvgRating = allRatings.length > 0
      ? Math.round(allRatings.reduce((s, v) => s + v, 0) / allRatings.length * 10) / 10
      : null;

    // Average participation rate
    const avgParticipation = totalSurveys > 0
      ? Math.round(totalResponses / totalSurveys)
      : 0;

    // Recent surveys with response counts for trend
    const recentSurveys = surveys.slice(0, 10).map(sv => ({
      id: sv.id,
      title: sv.title,
      status: sv.status,
      startDate: sv.startDate,
      endDate: sv.endDate,
      questionCount: sv.questions.length,
      responseCount: sv.responses.length,
      avgRating: (() => {
        const ratings = sv.responses.flatMap(r => r.answers.filter(a => a.valueRating != null).map(a => a.valueRating!));
        return ratings.length > 0 ? Math.round(ratings.reduce((s, v) => s + v, 0) / ratings.length * 10) / 10 : null;
      })(),
    }));

    res.json({
      kpis: {
        totalSurveys,
        activeSurveys,
        totalResponses,
        totalQuestions,
        overallAvgRating,
        avgParticipation,
      },
      recentSurveys,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
