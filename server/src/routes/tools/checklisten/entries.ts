import { Router, type Router as RouterType } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../../../lib/prisma.js';
import { requireRole } from '../../../middleware/auth.js';
import { checklistEntrySchema } from '@shared/validators';
import { deleteUploadFile, getRelativePath } from '../../../lib/upload.js';

export const checklistenEntriesRouter: RouterType = Router();

// Upload-Konfiguration für Checklisten-Fotos
// Verwendet itemId statt criterionId für den Dateinamen
const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? './uploads';
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['sessionId'] as string;
      const dir = path.join(UPLOAD_DIR, 'checklisten', tenantId, sessionId);
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const itemId = req.params['itemId'] as string;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${itemId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur JPEG, PNG und WebP Dateien sind erlaubt.'));
    }
  },
});

// PUT /sessions/:sessionId/entries/:itemId — Eintrag upserten
checklistenEntriesRouter.put(
  '/sessions/:sessionId/entries/:itemId',
  requireRole('tenant_admin', 'store_manager', 'kore_admin'),
  async (req, res) => {
    try {
      const result = checklistEntrySchema.safeParse(req.body);
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
      const itemId = req.params['itemId'] as string;

      // Prüfe ob Session existiert und zugänglich ist
      const session = await prisma.checklistSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({ error: 'Checklisten-Session nicht gefunden.' });
        return;
      }

      if (session.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (session.status !== 'IN_PROGRESS') {
        res.status(400).json({ error: 'Session kann nicht mehr bearbeitet werden.' });
        return;
      }

      // Prüfe ob Item existiert und zum Template gehört
      const item = await prisma.checklistItem.findUnique({
        where: { id: itemId },
        include: { section: { select: { templateId: true } } },
      });

      if (!item || item.section.templateId !== session.templateId) {
        res.status(404).json({ error: 'Checklist-Item nicht gefunden oder gehört nicht zum Template.' });
        return;
      }

      // Upsert: Erstellen oder aktualisieren
      const entry = await prisma.checklistEntry.upsert({
        where: {
          sessionId_itemId: { sessionId, itemId },
        },
        update: {
          valueBool: data.valueBool ?? undefined,
          valueText: data.valueText ?? undefined,
          valueNumber: data.valueNumber ?? undefined,
          comment: data.comment ?? undefined,
          answeredAt: new Date(),
        },
        create: {
          sessionId,
          itemId,
          valueBool: data.valueBool ?? null,
          valueText: data.valueText ?? null,
          valueNumber: data.valueNumber ?? null,
          comment: data.comment ?? null,
        },
        include: { item: true },
      });

      res.json(entry);
    } catch (err) {
      console.error('Checklisten entry upsert error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// POST /sessions/:sessionId/entries/:itemId/photo — Foto hochladen
checklistenEntriesRouter.post(
  '/sessions/:sessionId/entries/:itemId/photo',
  requireRole('tenant_admin', 'store_manager', 'kore_admin'),
  upload.single('photo'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['sessionId'] as string;
      const itemId = req.params['itemId'] as string;

      if (!req.file) {
        res.status(400).json({ error: 'Keine Datei hochgeladen.' });
        return;
      }

      // Prüfe Session-Zugriff
      const session = await prisma.checklistSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({ error: 'Checklisten-Session nicht gefunden.' });
        return;
      }

      if (session.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (session.status !== 'IN_PROGRESS') {
        res.status(400).json({ error: 'Session kann nicht mehr bearbeitet werden.' });
        return;
      }

      // Prüfe ob Item existiert und Typ PHOTO hat
      const item = await prisma.checklistItem.findUnique({
        where: { id: itemId },
        include: { section: { select: { templateId: true } } },
      });

      if (!item || item.section.templateId !== session.templateId) {
        res.status(404).json({ error: 'Checklist-Item nicht gefunden oder gehört nicht zum Template.' });
        return;
      }

      if (item.type !== 'PHOTO') {
        res.status(400).json({ error: 'Fotos können nur für Items vom Typ PHOTO hochgeladen werden.' });
        return;
      }

      const relativePath = getRelativePath(
        'checklisten',
        tenantId,
        sessionId,
        req.file.filename,
      );

      // Altes Foto löschen falls vorhanden
      const existingEntry = await prisma.checklistEntry.findUnique({
        where: {
          sessionId_itemId: { sessionId, itemId },
        },
      });

      if (existingEntry?.photoPath) {
        await deleteUploadFile(existingEntry.photoPath);
      }

      // Entry upserten mit Foto-Pfad
      const entry = await prisma.checklistEntry.upsert({
        where: {
          sessionId_itemId: { sessionId, itemId },
        },
        update: { photoPath: relativePath },
        create: {
          sessionId,
          itemId,
          photoPath: relativePath,
        },
        include: { item: true },
      });

      res.json(entry);
    } catch (err) {
      console.error('Checklisten photo upload error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// DELETE /sessions/:sessionId/entries/:itemId/photo — Foto entfernen
checklistenEntriesRouter.delete(
  '/sessions/:sessionId/entries/:itemId/photo',
  requireRole('tenant_admin', 'store_manager', 'kore_admin'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sessionId = req.params['sessionId'] as string;
      const itemId = req.params['itemId'] as string;

      const session = await prisma.checklistSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        res.status(404).json({ error: 'Checklisten-Session nicht gefunden.' });
        return;
      }

      if (session.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diese Session.' });
        return;
      }

      if (session.status !== 'IN_PROGRESS') {
        res.status(400).json({ error: 'Session kann nicht mehr bearbeitet werden.' });
        return;
      }

      const entry = await prisma.checklistEntry.findUnique({
        where: {
          sessionId_itemId: { sessionId, itemId },
        },
      });

      if (!entry || !entry.photoPath) {
        res.status(404).json({ error: 'Kein Foto vorhanden.' });
        return;
      }

      await deleteUploadFile(entry.photoPath);

      const updated = await prisma.checklistEntry.update({
        where: { id: entry.id },
        data: { photoPath: null },
        include: { item: true },
      });

      res.json(updated);
    } catch (err) {
      console.error('Checklisten photo delete error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);
