import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { logAudit } from '../../../lib/audit.js';

export const sopAcknowledgmentsRouter: RouterType = Router();

// POST /documents/:id/acknowledge — User bestätigt SOP-Kenntnisnahme
sopAcknowledgmentsRouter.post('/documents/:id/acknowledge', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const sopId = req.params['id'] as string;

    // Prüfe ob SOP existiert und zugänglich ist
    const sop = await prisma.sop.findUnique({
      where: { id: sopId },
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

    // Nur veröffentlichte SOPs können bestätigt werden
    if (sop.status !== 'PUBLISHED') {
      res.status(400).json({ error: 'Nur veröffentlichte SOPs können bestätigt werden.' });
      return;
    }

    // Upsert: Falls bereits bestätigt, Zeitstempel aktualisieren
    const acknowledgment = await prisma.sopAcknowledgment.upsert({
      where: {
        sopId_userId: { sopId, userId },
      },
      update: {
        acknowledgedAt: new Date(),
      },
      create: {
        sopId,
        userId,
      },
    });

    await logAudit({
      tenantId,
      userId,
      action: 'ACKNOWLEDGE',
      entity: 'Sop',
      entityId: sopId,
      details: `SOP bestätigt: ${sop.title}`,
      ipAddress: req.ip ?? null,
    });

    res.json(acknowledgment);
  } catch (err) {
    console.error('SOP acknowledge error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /documents/:id/acknowledgments — Wer hat ein SOP bestätigt
sopAcknowledgmentsRouter.get('/documents/:id/acknowledgments', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const sopId = req.params['id'] as string;

    // Prüfe ob SOP existiert und zugänglich ist
    const sop = await prisma.sop.findUnique({
      where: { id: sopId },
    });

    if (!sop) {
      res.status(404).json({ error: 'SOP nicht gefunden.' });
      return;
    }

    if (sop.tenantId !== null && sop.tenantId !== tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf dieses SOP.' });
      return;
    }

    const acknowledgments = await prisma.sopAcknowledgment.findMany({
      where: { sopId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { acknowledgedAt: 'desc' },
    });

    res.json(acknowledgments);
  } catch (err) {
    console.error('SOP acknowledgments list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/acknowledgment-status — Zusammenfassung: pro SOP wie viele User bestätigt vs. Gesamt
sopAcknowledgmentsRouter.get('/reports/acknowledgment-status', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;

    // Alle veröffentlichten SOPs für diesen Tenant (inkl. globale)
    const sops = await prisma.sop.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { tenantId: null },
          { tenantId },
        ],
      },
      select: {
        id: true,
        title: true,
        category: { select: { id: true, name: true } },
        publishedAt: true,
        _count: { select: { acknowledgments: true } },
      },
      orderBy: { title: 'asc' },
    });

    // Gesamtanzahl aktiver User im Tenant
    const totalUsers = await prisma.user.count({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const report = sops.map((sop) => ({
      sopId: sop.id,
      title: sop.title,
      category: sop.category,
      publishedAt: sop.publishedAt,
      acknowledgedCount: sop._count.acknowledgments,
      totalUsers,
      acknowledgedPercent:
        totalUsers > 0
          ? Math.round((sop._count.acknowledgments / totalUsers) * 1000) / 10
          : 0,
    }));

    res.json(report);
  } catch (err) {
    console.error('SOP acknowledgment status report error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
