import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { requireRole } from '../../../middleware/auth.js';
import { auditResponseSchema } from '@shared/validators';
import { createToolUpload, deleteUploadFile, getRelativePath } from '../../../lib/upload.js';

export const seaResponsesRouter: RouterType = Router();

const upload = createToolUpload('store-excellence-audit');

// PUT /sessions/:sessionId/responses/:criterionId — Upsert Bewertung
seaResponsesRouter.put(
  '/sessions/:sessionId/responses/:criterionId',
  requireRole('tenant_admin', 'store_manager', 'kore_admin'),
  async (req, res) => {
    try {
      const result = auditResponseSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['sessionId'] as string;
      const criterionId = req.params['criterionId'] as string;

      // Prüfe ob Session existiert und zugänglich ist
      const session = await prisma.auditSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({ error: 'Audit-Session nicht gefunden.' });
        return;
      }

      if (session.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
        res.status(400).json({ error: 'Session kann nicht mehr bearbeitet werden.' });
        return;
      }

      // Prüfe ob Kriterium existiert und zum Template gehört
      const criterion = await prisma.auditCriterion.findUnique({
        where: { id: criterionId },
        include: { category: { select: { templateId: true } } },
      });

      if (!criterion || criterion.category.templateId !== session.templateId) {
        res.status(404).json({ error: 'Kriterium nicht gefunden oder gehört nicht zum Template.' });
        return;
      }

      // Upsert: Erstellen oder aktualisieren
      const response = await prisma.auditResponse.upsert({
        where: {
          sessionId_criterionId: { sessionId, criterionId },
        },
        update: {
          scorePercent: data.scorePercent ?? undefined,
          passed: data.passed ?? undefined,
          comment: data.comment ?? undefined,
        },
        create: {
          sessionId,
          criterionId,
          scorePercent: data.scorePercent ?? null,
          passed: data.passed ?? null,
          comment: data.comment ?? null,
        },
        include: { criterion: true },
      });

      res.json(response);
    } catch (err) {
      console.error('SEA response upsert error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// POST /sessions/:sessionId/responses/:criterionId/photo — Foto hochladen
seaResponsesRouter.post(
  '/sessions/:sessionId/responses/:criterionId/photo',
  requireRole('tenant_admin', 'store_manager', 'kore_admin'),
  upload.single('photo'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['sessionId'] as string;
      const criterionId = req.params['criterionId'] as string;

      if (!req.file) {
        res.status(400).json({ error: 'Keine Datei hochgeladen.' });
        return;
      }

      // Prüfe Session-Zugriff
      const session = await prisma.auditSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({ error: 'Audit-Session nicht gefunden.' });
        return;
      }

      if (session.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
        res.status(400).json({ error: 'Session kann nicht mehr bearbeitet werden.' });
        return;
      }

      const relativePath = getRelativePath(
        'store-excellence-audit',
        tenantId,
        sessionId,
        req.file.filename,
      );

      // Altes Foto löschen falls vorhanden
      const existingResponse = await prisma.auditResponse.findUnique({
        where: {
          sessionId_criterionId: { sessionId, criterionId },
        },
      });

      if (existingResponse?.photoPath) {
        await deleteUploadFile(existingResponse.photoPath);
      }

      // Response upserten mit Foto-Pfad
      const response = await prisma.auditResponse.upsert({
        where: {
          sessionId_criterionId: { sessionId, criterionId },
        },
        update: { photoPath: relativePath },
        create: {
          sessionId,
          criterionId,
          photoPath: relativePath,
        },
        include: { criterion: true },
      });

      res.json(response);
    } catch (err) {
      console.error('SEA photo upload error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// DELETE /sessions/:sessionId/responses/:criterionId/photo — Foto entfernen
seaResponsesRouter.delete(
  '/sessions/:sessionId/responses/:criterionId/photo',
  requireRole('tenant_admin', 'store_manager', 'kore_admin'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['sessionId'] as string;
      const criterionId = req.params['criterionId'] as string;

      const session = await prisma.auditSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({ error: 'Audit-Session nicht gefunden.' });
        return;
      }

      if (session.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
        res.status(400).json({ error: 'Session kann nicht mehr bearbeitet werden.' });
        return;
      }

      const response = await prisma.auditResponse.findUnique({
        where: {
          sessionId_criterionId: { sessionId, criterionId },
        },
      });

      if (!response || !response.photoPath) {
        res.status(404).json({ error: 'Kein Foto vorhanden.' });
        return;
      }

      await deleteUploadFile(response.photoPath);

      const updated = await prisma.auditResponse.update({
        where: { id: response.id },
        data: { photoPath: null },
        include: { criterion: true },
      });

      res.json(updated);
    } catch (err) {
      console.error('SEA photo delete error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);
