import { Router, type Router as RouterType } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import prisma from '../../../lib/prisma.js';
import { requireRole } from '../../../middleware/auth.js';
import { logAudit } from '../../../lib/audit.js';
import { sopCreateSchema, sopUpdateSchema } from '@shared/validators';

export const sopDocumentsRouter: RouterType = Router();

// ── Upload-Konfiguration für SOP-Anhänge ─────────────────────
const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? './uploads';
const ALLOWED_MIMETYPES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const dir = path.join(UPLOAD_DIR, 'sop', tenantId || 'global');
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `sop-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur JPEG, PNG, WebP, PDF, Word und Excel Dateien sind erlaubt.'));
    }
  },
});

// GET /documents — Paginierte Liste mit Filtern
sopDocumentsRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize'] as string) || 20));
    const categoryId = req.query['categoryId'] as string | undefined;
    const status = req.query['status'] as string | undefined;
    const search = req.query['search'] as string | undefined;

    const where: Record<string, unknown> = {
      OR: [
        { tenantId: null },   // Globale SOPs
        { tenantId },         // Tenant-eigene
      ],
    };

    if (categoryId) where['categoryId'] = categoryId;
    if (status) where['status'] = status;
    if (search) {
      where['title'] = { contains: search, mode: 'insensitive' };
    }

    const [documents, total] = await Promise.all([
      prisma.sop.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { acknowledgments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sop.count({ where }),
    ]);

    res.json({ data: documents, total, page, pageSize });
  } catch (err) {
    console.error('SOP documents list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /documents/:id — SOP-Detail mit Kategorie, Ersteller, Bestätigungen
sopDocumentsRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const sopId = req.params['id'] as string;

    const sop = await prisma.sop.findUnique({
      where: { id: sopId },
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { acknowledgments: true } },
      },
    });

    if (!sop) {
      res.status(404).json({ error: 'SOP nicht gefunden.' });
      return;
    }

    // Zugriffsprüfung: Global oder eigener Tenant
    if (sop.tenantId !== null && sop.tenantId !== tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf dieses SOP.' });
      return;
    }

    res.json(sop);
  } catch (err) {
    console.error('SOP document detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /documents — Neues SOP erstellen (tenant_admin, kore_admin)
sopDocumentsRouter.post(
  '/',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const result = sopCreateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;
      const tenantId = (req as any).tenantId as string;
      const userId = req.user!.sub;

      // kore_admin kann globale SOPs erstellen (tenantId: null)
      const isGlobal = req.user!.role === 'kore_admin' && req.body.isGlobal === true;

      const sop = await prisma.sop.create({
        data: {
          title: data.title,
          content: data.content,
          categoryId: data.categoryId,
          tenantId: isGlobal ? null : tenantId,
          createdBy: userId,
          status: 'DRAFT',
        },
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { acknowledgments: true } },
        },
      });

      await logAudit({
        tenantId: isGlobal ? null : tenantId,
        userId,
        action: 'CREATE',
        entity: 'Sop',
        entityId: sop.id,
        details: `SOP erstellt: ${data.title}`,
        ipAddress: req.ip ?? null,
      });

      res.status(201).json(sop);
    } catch (err) {
      console.error('SOP document create error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// PUT /documents/:id — SOP aktualisieren (Titel, Inhalt, Kategorie). Version inkrementieren.
sopDocumentsRouter.put(
  '/:id',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const result = sopUpdateSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          error: 'Validierungsfehler',
          details: result.error.flatten().fieldErrors,
        });
        return;
      }

      const data = result.data;
      const tenantId = (req as any).tenantId as string;
      const sopId = req.params['id'] as string;

      // Prüfe Zugriff
      const existing = await prisma.sop.findUnique({
        where: { id: sopId },
      });

      if (!existing) {
        res.status(404).json({ error: 'SOP nicht gefunden.' });
        return;
      }

      // Globale SOPs können nur von kore_admin bearbeitet werden
      if (existing.tenantId === null && req.user!.role !== 'kore_admin') {
        res.status(403).json({ error: 'Globale SOPs können nur von KORE-Admins bearbeitet werden.' });
        return;
      }

      if (existing.tenantId !== null && existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses SOP.' });
        return;
      }

      const sop = await prisma.sop.update({
        where: { id: sopId },
        data: {
          title: data.title,
          content: data.content,
          categoryId: data.categoryId,
          version: { increment: 1 },
        },
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { acknowledgments: true } },
        },
      });

      await logAudit({
        tenantId: existing.tenantId,
        userId: req.user!.sub,
        action: 'UPDATE',
        entity: 'Sop',
        entityId: sop.id,
        details: `SOP aktualisiert (Version ${sop.version})`,
        ipAddress: req.ip ?? null,
      });

      res.json(sop);
    } catch (err) {
      console.error('SOP document update error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// POST /documents/:id/publish — SOP veröffentlichen
sopDocumentsRouter.post(
  '/:id/publish',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sopId = req.params['id'] as string;

      const existing = await prisma.sop.findUnique({
        where: { id: sopId },
      });

      if (!existing) {
        res.status(404).json({ error: 'SOP nicht gefunden.' });
        return;
      }

      if (existing.tenantId === null && req.user!.role !== 'kore_admin') {
        res.status(403).json({ error: 'Globale SOPs können nur von KORE-Admins veröffentlicht werden.' });
        return;
      }

      if (existing.tenantId !== null && existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses SOP.' });
        return;
      }

      if (existing.status === 'ARCHIVED') {
        res.status(400).json({ error: 'Archivierte SOPs können nicht veröffentlicht werden.' });
        return;
      }

      const sop = await prisma.sop.update({
        where: { id: sopId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { acknowledgments: true } },
        },
      });

      await logAudit({
        tenantId: existing.tenantId,
        userId: req.user!.sub,
        action: 'PUBLISH',
        entity: 'Sop',
        entityId: sop.id,
        details: `SOP veröffentlicht: ${sop.title}`,
        ipAddress: req.ip ?? null,
      });

      res.json(sop);
    } catch (err) {
      console.error('SOP document publish error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// POST /documents/:id/archive — SOP archivieren
sopDocumentsRouter.post(
  '/:id/archive',
  requireRole('tenant_admin', 'kore_admin'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sopId = req.params['id'] as string;

      const existing = await prisma.sop.findUnique({
        where: { id: sopId },
      });

      if (!existing) {
        res.status(404).json({ error: 'SOP nicht gefunden.' });
        return;
      }

      if (existing.tenantId === null && req.user!.role !== 'kore_admin') {
        res.status(403).json({ error: 'Globale SOPs können nur von KORE-Admins archiviert werden.' });
        return;
      }

      if (existing.tenantId !== null && existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses SOP.' });
        return;
      }

      const sop = await prisma.sop.update({
        where: { id: sopId },
        data: {
          status: 'ARCHIVED',
        },
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { acknowledgments: true } },
        },
      });

      await logAudit({
        tenantId: existing.tenantId,
        userId: req.user!.sub,
        action: 'ARCHIVE',
        entity: 'Sop',
        entityId: sop.id,
        details: `SOP archiviert: ${sop.title}`,
        ipAddress: req.ip ?? null,
      });

      res.json(sop);
    } catch (err) {
      console.error('SOP document archive error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);

// POST /documents/:id/attachment — Anhang hochladen
sopDocumentsRouter.post(
  '/:id/attachment',
  requireRole('tenant_admin', 'kore_admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      const tenantId = (req as any).tenantId as string;
      const sopId = req.params['id'] as string;

      const existing = await prisma.sop.findUnique({
        where: { id: sopId },
      });

      if (!existing) {
        res.status(404).json({ error: 'SOP nicht gefunden.' });
        return;
      }

      if (existing.tenantId === null && req.user!.role !== 'kore_admin') {
        res.status(403).json({ error: 'Globale SOPs können nur von KORE-Admins bearbeitet werden.' });
        return;
      }

      if (existing.tenantId !== null && existing.tenantId !== tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf dieses SOP.' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Keine Datei hochgeladen.' });
        return;
      }

      // Relativen Pfad speichern
      const relativePath = path.join('sop', tenantId || 'global', req.file.filename);

      const sop = await prisma.sop.update({
        where: { id: sopId },
        data: {
          attachmentPath: relativePath,
        },
        include: {
          category: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { acknowledgments: true } },
        },
      });

      res.json(sop);
    } catch (err) {
      console.error('SOP attachment upload error:', err);
      res.status(500).json({ error: 'Interner Serverfehler.' });
    }
  },
);
