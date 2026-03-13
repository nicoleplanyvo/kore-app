import { Router, type Router as RouterType } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';

export const adminGdprRouter: RouterType = Router();
adminGdprRouter.use(authenticate, requireMinRole('tenant_admin'));

// GET /api/admin/gdpr/audit-log — Audit-Log mit Filtern
adminGdprRouter.get('/audit-log', async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const pageSize = Math.min(parseInt(req.query['pageSize'] as string) || 50, 100);
    const tenantId = req.query['tenantId'] as string | undefined;
    const entity = req.query['entity'] as string | undefined;
    const action = req.query['action'] as string | undefined;

    const where: Record<string, unknown> = {};
    if (tenantId) where['tenantId'] = tenantId;
    if (entity) where['entity'] = entity;
    if (action) where['action'] = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data: logs, total, page, pageSize });
  } catch (err) {
    console.error('Audit log error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/gdpr/consents/:tenantId — Einwilligungen eines Tenants
adminGdprRouter.get('/consents/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const consents = await prisma.dataProcessingConsent.findMany({
      where: { tenantId },
      orderBy: { grantedAt: 'desc' },
    });
    res.json({ consents });
  } catch (err) {
    console.error('Consents error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/admin/gdpr/consents — Neue Einwilligung erfassen
adminGdprRouter.post('/consents', async (req, res) => {
  try {
    const { tenantId, consentType, version, document } = req.body;
    if (!tenantId || !consentType || !version) {
      res.status(400).json({ error: 'tenantId, consentType und version sind erforderlich.' });
      return;
    }

    const consent = await prisma.dataProcessingConsent.upsert({
      where: { tenantId_consentType: { tenantId, consentType } },
      update: {
        grantedAt: new Date(),
        grantedBy: req.user!.sub,
        version,
        document: document || null,
        revokedAt: null,
        revokedBy: null,
      },
      create: {
        tenantId,
        consentType,
        grantedBy: req.user!.sub,
        version,
        document: document || null,
      },
    });

    res.json({ consent });
  } catch (err) {
    console.error('Consent create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/admin/gdpr/consents/revoke — Einwilligung widerrufen
adminGdprRouter.post('/consents/revoke', async (req, res) => {
  try {
    const { tenantId, consentType } = req.body;
    if (!tenantId || !consentType) {
      res.status(400).json({ error: 'tenantId und consentType sind erforderlich.' });
      return;
    }

    const consent = await prisma.dataProcessingConsent.update({
      where: { tenantId_consentType: { tenantId, consentType } },
      data: {
        revokedAt: new Date(),
        revokedBy: req.user!.sub,
      },
    });

    res.json({ consent });
  } catch (err) {
    console.error('Consent revoke error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/gdpr/data-export/:tenantId — GDPR Datenexport für einen Tenant
adminGdprRouter.get('/data-export/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
        stores: {
          include: {
            tools: { include: { tool: true } },
          },
        },
        consents: true,
      },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant nicht gefunden.' });
      return;
    }

    // GDPR Art. 20: Recht auf Datenübertragbarkeit
    res.json({
      exportDate: new Date().toISOString(),
      gdprArticle: 'Art. 20 DSGVO - Recht auf Datenübertragbarkeit',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        contactEmail: tenant.contactEmail,
        contactName: tenant.contactName,
        contactPhone: tenant.contactPhone,
        createdAt: tenant.createdAt,
      },
      users: tenant.users,
      stores: tenant.stores.map((s: { id: string; name: string; city: string | null; address: string | null; isActive: boolean; createdAt: Date; tools: Array<{ assignedAt: Date; isActive: boolean; tool: { name: string; category: string; priceMonthly: number } }> }) => ({
        id: s.id,
        name: s.name,
        city: s.city,
        address: s.address,
        isActive: s.isActive,
        createdAt: s.createdAt,
        toolAssignments: s.tools.map((ta: { assignedAt: Date; isActive: boolean; tool: { name: string; category: string; priceMonthly: number } }) => ({
          toolName: ta.tool.name,
          toolCategory: ta.tool.category,
          priceMonthly: ta.tool.priceMonthly,
          assignedAt: ta.assignedAt,
          isActive: ta.isActive,
        })),
      })),
      consents: tenant.consents,
    });
  } catch (err) {
    console.error('Data export error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
