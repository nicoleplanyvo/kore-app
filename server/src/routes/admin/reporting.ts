import { Router, type Router as RouterType } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';

export const adminReportingRouter: RouterType = Router();
adminReportingRouter.use(authenticate, requireMinRole('tenant_admin'));

// Hilfsfunktion: Store-Daten formatieren
function formatStore(s: {
  id: string;
  name: string;
  city: string | null;
  isActive: boolean;
  userAssignments: Array<{ assignedAt: Date; user: { id: string; name: string; email: string; role: string } }>;
}) {
  return {
    id: s.id,
    name: s.name,
    city: s.city,
    isActive: s.isActive,
    users: s.userAssignments.map((a) => ({
      id: a.user.id,
      name: a.user.name,
      email: a.user.email,
      role: a.user.role,
      assignedAt: a.assignedAt.toISOString(),
    })),
  };
}

// GET /api/admin/reporting/hierarchy — Organisationsstruktur für einen Tenant
adminReportingRouter.get('/hierarchy', async (req, res) => {
  try {
    // kore_admin kann tenantId per Query wählen, tenant_admin nutzt eigenen Tenant
    const tenantId =
      req.user!.role === 'kore_admin'
        ? (req.query['tenantId'] as string) || null
        : req.user!.tenantId;

    if (!tenantId) {
      res.status(400).json({ error: 'tenantId ist erforderlich.' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant nicht gefunden.' });
      return;
    }

    const storeInclude = {
      select: {
        id: true,
        name: true,
        city: true,
        isActive: true,
        userAssignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { assignedAt: 'desc' as const },
        },
      },
      orderBy: { name: 'asc' as const },
    };

    // Regionen mit ihren Stores
    const regions = await prisma.region.findMany({
      where: { tenantId, isActive: true },
      include: {
        stores: {
          where: { isActive: true },
          ...storeInclude,
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Nicht zugeordnete Stores (regionId: null)
    const unassignedStores = await prisma.store.findMany({
      where: { tenantId, isActive: true, regionId: null },
      ...storeInclude,
    });

    // Manager-zentrische Ansicht: Manager mit ihren zugewiesenen Stores
    const managers = await prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['tenant_admin', 'regional_manager', 'multisite_manager', 'store_manager', 'learner'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        storeAssignments: {
          include: {
            store: { select: { id: true, name: true, city: true } },
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    // Formatierung
    const formattedRegions = regions.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      sortOrder: r.sortOrder,
      stores: r.stores.map(formatStore),
    }));

    const formattedUnassignedStores = unassignedStores.map(formatStore);

    const formattedManagers = managers.map((m: { id: string; name: string; email: string; role: string; storeAssignments: Array<{ store: { id: string; name: string; city: string | null } }> }) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      stores: m.storeAssignments.map((a: { store: { id: string; name: string; city: string | null } }) => ({
        id: a.store.id,
        name: a.store.name,
        city: a.store.city,
      })),
    }));

    res.json({
      tenant,
      regions: formattedRegions,
      stores: formattedUnassignedStores,
      managers: formattedManagers,
    });
  } catch (err) {
    console.error('Reporting hierarchy error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
