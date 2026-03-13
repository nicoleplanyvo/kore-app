import { Router, type Router as RouterType } from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';
import { storeCreateSchema, storeUpdateSchema, storeToolAssignSchema, storeUserAssignSchema } from '@shared/validators';
import { logAudit } from '../../lib/audit.js';
import { hasMinRole, type UserRole } from '@shared/types';

export const adminStoresRouter: RouterType = Router();
// store_manager+ kann Stores sehen; Erstellung erfordert höhere Rolle (inline geprüft)
adminStoresRouter.use(authenticate, requireMinRole('store_manager'));

// GET /api/admin/stores — Stores mit Rollen-basiertem Scoping
adminStoresRouter.get('/', async (req, res) => {
  try {
    const tenantId = req.query['tenantId'] as string | undefined;
    const where: Record<string, unknown> = {};
    const userRole = req.user!.role as UserRole;

    if (userRole === 'kore_admin') {
      if (tenantId) where['tenantId'] = tenantId;
    } else if (userRole === 'tenant_admin') {
      // tenant_admin sieht alle Stores des eigenen Tenants
      where['tenantId'] = req.user!.tenantId;
    } else if (userRole === 'regional_manager') {
      // regional_manager: Stores aus zugewiesenen Regionen + direkt zugewiesene Stores
      where['tenantId'] = req.user!.tenantId;
      const [regionAssignments, storeAssignments] = await Promise.all([
        prisma.userRegionAssignment.findMany({
          where: { userId: req.user!.sub },
          select: { regionId: true },
        }),
        prisma.userStoreAssignment.findMany({
          where: { userId: req.user!.sub },
          select: { storeId: true },
        }),
      ]);
      const regionIds = regionAssignments.map((a: { regionId: string }) => a.regionId);
      const directStoreIds = storeAssignments.map((a: { storeId: string }) => a.storeId);

      // Alle Stores in zugewiesenen Regionen holen
      const regionStores = regionIds.length > 0
        ? await prisma.store.findMany({
            where: { regionId: { in: regionIds } },
            select: { id: true },
          })
        : [];
      const regionStoreIds = regionStores.map((s: { id: string }) => s.id);
      const allMyStoreIds = [...new Set([...directStoreIds, ...regionStoreIds])];
      where['id'] = { in: allMyStoreIds };
    } else {
      // multisite_manager, store_manager, learner:
      // Nur direkt zugewiesene Stores
      where['tenantId'] = req.user!.tenantId;
      const myAssignments = await prisma.userStoreAssignment.findMany({
        where: { userId: req.user!.sub },
        select: { storeId: true },
      });
      const myStoreIds = myAssignments.map((a: { storeId: string }) => a.storeId);
      where['id'] = { in: myStoreIds };
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true } },
        _count: { select: { tools: true, userAssignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(stores);
  } catch (err) {
    console.error('Stores list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/stores/:id — Store-Detail mit Tool-Zuweisungen
adminStoresRouter.get('/:id', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params['id'] },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true, description: true } },
        tools: {
          include: { tool: true },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });

    if (!store) {
      res.status(404).json({ error: 'Store nicht gefunden.' });
      return;
    }

    res.json(store);
  } catch (err) {
    console.error('Store detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/admin/stores — Store erstellen (mindestens multisite_manager)
adminStoresRouter.post('/', async (req, res) => {
  try {
    // Store-Erstellung erfordert mindestens multisite_manager
    if (!hasMinRole(req.user!.role as UserRole, 'multisite_manager')) {
      res.status(403).json({ error: 'Keine Berechtigung zum Erstellen von Stores.' });
      return;
    }

    const result = storeCreateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validierungsfehler', details: result.error.flatten().fieldErrors });
      return;
    }

    const data = result.data;

    // Nicht-kore_admin muss eigenen Tenant verwenden
    if (req.user!.role !== 'kore_admin' && data.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Mandanten.' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
    if (!tenant) {
      res.status(404).json({ error: 'Tenant nicht gefunden.' });
      return;
    }

    const store = await prisma.store.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        city: data.city || null,
        address: data.address || null,
        regionId: data.regionId || null,
      },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true } },
        _count: { select: { tools: true, userAssignments: true } },
      },
    });

    await logAudit({
      tenantId: data.tenantId,
      userId: req.user!.sub,
      action: 'CREATE',
      entity: 'store',
      entityId: store.id,
      details: JSON.stringify({ storeName: store.name }),
      ipAddress: req.ip,
    });

    res.status(201).json(store);
  } catch (err) {
    console.error('Store create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /api/admin/stores/:id — Store aktualisieren
adminStoresRouter.put('/:id', async (req, res) => {
  try {
    const result = storeUpdateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validierungsfehler', details: result.error.flatten().fieldErrors });
      return;
    }

    const updateData: Record<string, unknown> = { ...result.data };
    if ('city' in updateData) updateData['city'] = updateData['city'] || null;
    if ('address' in updateData) updateData['address'] = updateData['address'] || null;
    if ('regionId' in updateData) updateData['regionId'] = updateData['regionId'] || null;

    const store = await prisma.store.update({
      where: { id: req.params['id'] },
      data: updateData,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        region: { select: { id: true, name: true } },
        _count: { select: { tools: true, userAssignments: true } },
      },
    });

    res.json(store);
  } catch (err) {
    console.error('Store update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /api/admin/stores/:id — Store deaktivieren
adminStoresRouter.delete('/:id', async (req, res) => {
  try {
    const store = await prisma.store.update({
      where: { id: req.params['id'] },
      data: { isActive: false },
    });

    res.json({ success: true, store });
  } catch (err) {
    console.error('Store delete error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/stores/:id/users — Zugewiesene Benutzer + verfügbare Tenant-User
adminStoresRouter.get('/:id/users', async (req, res) => {
  try {
    const rawId = req.params['id'];
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const store = await prisma.store.findUnique({
      where: { id },
      select: { id: true, name: true, tenantId: true },
    });

    if (!store) {
      res.status(404).json({ error: 'Store nicht gefunden.' });
      return;
    }

    const assignments = await prisma.userStoreAssignment.findMany({
      where: { storeId: store.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    // Verfügbare Tenant-User (exkl. bereits zugewiesene + exkl. kore_admin)
    const assignedUserIds = new Set(assignments.map((a: { userId: string }) => a.userId));
    const tenantUsers = await prisma.user.findMany({
      where: {
        tenantId: store.tenantId,
        isActive: true,
        role: { not: 'kore_admin' },
      },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });

    const availableUsers = tenantUsers.filter((u: { id: string }) => !assignedUserIds.has(u.id));

    res.json({ store, assignments, availableUsers });
  } catch (err) {
    console.error('Store users error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /api/admin/stores/:id/users — User-Zuweisungen für Store aktualisieren
adminStoresRouter.put('/:id/users', async (req, res) => {
  try {
    const result = storeUserAssignSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: 'Validierungsfehler', details: result.error.flatten().fieldErrors });
      return;
    }

    const rawId = req.params['id'];
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const store = await prisma.store.findUnique({
      where: { id },
      select: { id: true, name: true, tenantId: true },
    });

    if (!store) {
      res.status(404).json({ error: 'Store nicht gefunden.' });
      return;
    }

    const { userIds } = result.data;

    // Lösche bestehende Zuweisungen und erstelle neue
    await prisma.userStoreAssignment.deleteMany({ where: { storeId: store.id } });

    if (userIds.length > 0) {
      await prisma.userStoreAssignment.createMany({
        data: userIds.map((userId) => ({
          userId,
          storeId: store.id,
        })),
      });
    }

    await logAudit({
      tenantId: store.tenantId,
      userId: req.user!.sub,
      action: 'UPDATE',
      entity: 'store_users',
      entityId: store.id,
      details: JSON.stringify({ storeName: store.name, userIds }),
      ipAddress: req.ip,
    });

    // Lade aktualisierte Zuweisungen
    const assignments = await prisma.userStoreAssignment.findMany({
      where: { storeId: store.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, isActive: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    res.json({ store, assignments });
  } catch (err) {
    console.error('Store users update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/stores/:id/tools — Alle Tools mit Zuweisungsstatus für diesen Store
adminStoresRouter.get('/:id/tools', async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: req.params['id'] },
      select: { id: true, name: true, tenantId: true },
    });
    if (!store) {
      res.status(404).json({ error: 'Store nicht gefunden.' });
      return;
    }

    const allTools = await prisma.toolDefinition.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });

    const assignments = await prisma.storeToolAssignment.findMany({
      where: { storeId: store.id },
    });

    const assignedToolIds = new Set(assignments.filter((a: { isActive: boolean }) => a.isActive).map((a: { toolId: string }) => a.toolId));

    const toolsWithAssignment = allTools.map((tool: { id: string; [key: string]: unknown }) => ({
      ...tool,
      assigned: assignedToolIds.has(tool.id),
    }));

    res.json({ store, tools: toolsWithAssignment });
  } catch (err) {
    console.error('Store tools error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/admin/stores/:id/tools/assign — Tool an Store zuweisen
adminStoresRouter.post('/:id/tools/assign', async (req, res) => {
  try {
    const { toolId } = req.body;
    const storeId = req.params['id']!;

    if (!toolId) {
      res.status(400).json({ error: 'toolId ist erforderlich.' });
      return;
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      res.status(404).json({ error: 'Store nicht gefunden.' });
      return;
    }

    const assignment = await prisma.storeToolAssignment.upsert({
      where: { storeId_toolId: { storeId, toolId } },
      update: { isActive: true },
      create: { storeId, toolId },
      include: { tool: true },
    });

    await logAudit({
      tenantId: store.tenantId,
      userId: req.user!.sub,
      action: 'ASSIGN',
      entity: 'tool',
      entityId: toolId,
      details: JSON.stringify({ storeName: store.name, toolName: assignment.tool.name }),
      ipAddress: req.ip,
    });

    res.json({ assignment });
  } catch (err) {
    console.error('Tool assign error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/admin/stores/:id/tools/unassign — Tool von Store entfernen
adminStoresRouter.post('/:id/tools/unassign', async (req, res) => {
  try {
    const { toolId } = req.body;
    const storeId = req.params['id']!;

    if (!toolId) {
      res.status(400).json({ error: 'toolId ist erforderlich.' });
      return;
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      res.status(404).json({ error: 'Store nicht gefunden.' });
      return;
    }

    const assignment = await prisma.storeToolAssignment.findUnique({
      where: { storeId_toolId: { storeId, toolId } },
      include: { tool: true },
    });

    if (!assignment) {
      res.status(404).json({ error: 'Zuweisung nicht gefunden.' });
      return;
    }

    await prisma.storeToolAssignment.delete({
      where: { storeId_toolId: { storeId, toolId } },
    });

    await logAudit({
      tenantId: store.tenantId,
      userId: req.user!.sub,
      action: 'UNASSIGN',
      entity: 'tool',
      entityId: toolId,
      details: JSON.stringify({ storeName: store.name, toolName: assignment.tool.name }),
      ipAddress: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Tool unassign error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
