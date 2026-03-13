import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { pulseSurveyCreateSchema, pulseQuestionCreateSchema, pulseRespondSchema } from '@shared/validators';

export const pulseSurveyRouter: RouterType = Router();
pulseSurveyRouter.use(authenticate, requireToolAccess('coaching.pulse_survey'));

// GET /surveys
pulseSurveyRouter.get('/surveys', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const surveys = await prisma.pulseSurvey.findMany({
      where: { tenantId },
      include: { _count: { select: { questions: true, responses: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(surveys);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /surveys
pulseSurveyRouter.post('/surveys', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const createdBy = req.user!.sub;
    const parsed = pulseSurveyCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const survey = await prisma.pulseSurvey.create({ data: { ...parsed.data, tenantId, createdBy } });
    res.status(201).json(survey);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /surveys/:id
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

// POST /surveys/:id/questions
pulseSurveyRouter.post('/surveys/:id/questions', async (req, res) => {
  try {
    const parsed = pulseQuestionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const question = await prisma.pulseQuestion.create({ data: { ...parsed.data, surveyId: req.params['id']! } });
    res.status(201).json(question);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /surveys/:id/respond
pulseSurveyRouter.post('/surveys/:id/respond', async (req, res) => {
  try {
    const respondentId = req.user!.sub;
    const parsed = pulseRespondSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const response = await prisma.pulseResponse.create({
      data: {
        surveyId: req.params['id']!,
        storeId: parsed.data.storeId,
        respondentId,
        answers: { create: parsed.data.answers },
      },
      include: { answers: true },
    });
    res.status(201).json(response);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /surveys/:id/results
pulseSurveyRouter.get('/surveys/:id/results', async (req, res) => {
  try {
    const survey = await prisma.pulseSurvey.findUnique({
      where: { id: req.params['id'] },
      include: {
        questions: { orderBy: { sortOrder: 'asc' } },
        responses: { include: { answers: true } },
      },
    });
    if (!survey) return res.status(404).json({ error: 'Umfrage nicht gefunden.' });

    const results = survey.questions.map(q => {
      const answers = survey.responses.flatMap(r => r.answers.filter(a => a.questionId === q.id));
      const ratings = answers.filter(a => a.valueRating != null).map(a => a.valueRating!);
      return {
        questionId: q.id,
        text: q.text,
        type: q.type,
        totalAnswers: answers.length,
        avgRating: ratings.length > 0 ? Math.round(ratings.reduce((s, v) => s + v, 0) / ratings.length * 10) / 10 : null,
        textAnswers: answers.filter(a => a.valueText).map(a => a.valueText),
      };
    });
    res.json({ survey: { id: survey.id, title: survey.title, totalResponses: survey.responses.length }, results });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
