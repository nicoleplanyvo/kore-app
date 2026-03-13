import { Router, type Router as RouterType } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma.js';
import { logAudit } from '../../lib/audit.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';
import { userCreateSchema, userUpdateSchema, userStoreAssignSchema, userRegionAssignSchema } from '@shared/validators';
import { ROLE_HIERARCHY, hasMinRole, canCreateRole, type UserRole } from '@shared/types';

export const adminUsersRouter: RouterType = Router();

// Alle Routen erfordern mindestens store_manager
// (store_manager kann Mitarbeiter erstellen/verwalten)
adminUsersRouter.use(authenticate, requireMinRole('store_manager'));

// GET /api/admin/users — Liste aller User (scoping je nach Rolle)
adminUsersRouter.get('/', async (req, res) => {
  try {
    const { search, role, tenantId, page = '1', pageSize = '20' } = req.query;
    const p = Math.max(1, Number(page));
    const ps = Math.min(100, Math.max(1, Number(pageSize)));

    const where: Record<string, unknown> = {};
    const userRole = req.user!.role as UserRole;

    // Tenant-Scoping
    if (userRole === 'kore_admin') {
      if (tenantId) where['tenantId'] = tenantId;
    } else {
      // Alle anderen sehen nur eigenen Tenant
      where['tenantId'] = req.user!.tenantId;
    }

    // Rollen unterhalb der eigenen anzeigen (außer kore_admin/tenant_admin → sehen alle)
    if (userRole !== 'kore_admin' && userRole !== 'tenant_admin') {
      // regional_manager: Stores aus zugewiesenen Regionen + direkte Store-Zuweisungen
      // multisite_manager, store_manager: nur direkt zugewiesene Stores
      let myStoreIds: string[] = [];

      if (userRole === 'regional_manager') {
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

        const regionStores = regionIds.length > 0
          ? await prisma.store.findMany({
              where: { regionId: { in: regionIds } },
              select: { id: true },
            })
          : [];
        const regionStoreIds = regionStores.map((s: { id: string }) => s.id);
        myStoreIds = [...new Set([...directStoreIds, ...regionStoreIds])];
      } else {
        const storeAssignments = await prisma.userStoreAssignment.findMany({
          where: { userId: req.user!.sub },
          select: { storeId: true },
        });
        myStoreIds = storeAssignments.map((a: { storeId: string }) => a.storeId);
      }

      if (myStoreIds.length > 0) {
        where['OR'] = [
          // User die in meinen Stores zugewiesen sind
          { storeAssignments: { some: { storeId: { in: myStoreIds } } } },
          // Mich selbst
          { id: req.user!.sub },
        ];
      } else {
        // Nur mich selbst
        where['id'] = req.user!.sub;
      }
    }

    if (role) where['role'] = role;
    if (search) {
      // Bei Store-Scoped Queries muss OR kombiniert werden
      const searchFilter = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
      if (where['OR']) {
        where['AND'] = [{ OR: where['OR'] as unknown[] }, { OR: searchFilter }];
        delete where['OR'];
      } else {
        where['OR'] = searchFilter;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          tenantId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          tenant: { select: { name: true } },
          storeAssignments: {
            select: {
              storeId: true,
              store: { select: { name: true } },
            },
          },
          regionAssignments: {
            select: {
              regionId: true,
              region: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, total, page: p, pageSize: ps });
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /api/admin/users/:id — User-Detail
adminUsersRouter.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params['id'] },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: { select: { id: true, name: true } },
        storeAssignments: {
          select: {
            id: true,
            storeId: true,
            assignedAt: true,
            store: { select: { id: true, name: true, city: true } },
          },
        },
        regionAssignments: {
          select: {
            id: true,
            regionId: true,
            assignedAt: true,
            region: { select: { id: true, name: true, description: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      return;
    }

    // Tenant-Scoping: tenant_admin darf nur eigene User sehen
    if (req.user!.role !== 'kore_admin' && user.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Benutzer.' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error('User detail error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/admin/users — User erstellen
adminUsersRouter.post('/', async (req, res) => {
  try {
    const result = userCreateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validierungsfehler',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password, role, tenantId, storeIds, regionIds } = result.data;

    // Rollenbeschränkung: Nur Rollen STRIKT unter der eigenen erstellen
    if (!canCreateRole(req.user!.role as UserRole, role as UserRole)) {
      res.status(403).json({ error: 'Sie können keine Benutzer mit gleicher oder höherer Rolle erstellen.' });
      return;
    }

    // Nicht-kore_admin muss eigenen Tenant verwenden
    if (req.user!.role !== 'kore_admin') {
      if (tenantId && tenantId !== req.user!.tenantId) {
        res.status(403).json({ error: 'Kein Zugriff auf diesen Mandanten.' });
        return;
      }
    }

    // kore_admin braucht keinen Tenant
    const effectiveTenantId = role === 'kore_admin' ? null : (tenantId || req.user!.tenantId);
    if (role !== 'kore_admin' && !effectiveTenantId) {
      res.status(400).json({ error: 'tenantId ist erforderlich für diese Rolle.' });
      return;
    }

    // Prüfe ob Email bereits existiert
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'E-Mail-Adresse bereits vergeben.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        tenantId: effectiveTenantId,
      },
    });

    // Store-Zuweisungen erstellen
    if (storeIds && storeIds.length > 0) {
      await prisma.userStoreAssignment.createMany({
        data: storeIds.map((storeId) => ({
          userId: user.id,
          storeId,
        })),
      });
    }

    // Region-Zuweisungen erstellen (für regional_manager)
    if (regionIds && regionIds.length > 0) {
      await prisma.userRegionAssignment.createMany({
        data: regionIds.map((regionId) => ({
          userId: user.id,
          regionId,
        })),
      });
    }

    await logAudit({
      tenantId: effectiveTenantId,
      userId: req.user!.sub,
      action: 'CREATE',
      entity: 'user',
      entityId: user.id,
      details: JSON.stringify({ userName: name, role }),
      ipAddress: req.ip || null,
    });

    // Return user with store + region assignments
    const created = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        storeAssignments: {
          select: { storeId: true, store: { select: { name: true } } },
        },
        regionAssignments: {
          select: { regionId: true, region: { select: { name: true } } },
        },
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('User create error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /api/admin/users/:id — User aktualisieren
adminUsersRouter.put('/:id', async (req, res) => {
  try {
    const result = userUpdateSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validierungsfehler',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: req.params['id'] },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      return;
    }

    // Tenant-Scoping
    if (req.user!.role !== 'kore_admin' && targetUser.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Benutzer.' });
      return;
    }

    const { storeIds, regionIds, ...updateData } = result.data;

    // Rollenbeschränkung: Darf keine gleiche oder höhere Rolle vergeben
    if (updateData.role) {
      if (!canCreateRole(req.user!.role as UserRole, updateData.role as UserRole)) {
        res.status(403).json({ error: 'Sie können keine Benutzer auf gleiche oder höhere Rolle setzen.' });
        return;
      }
    }

    // Nicht-kore_admin/tenant_admin: Nur User in eigenen Stores bearbeiten
    const userRole = req.user!.role as UserRole;
    if (userRole !== 'kore_admin' && userRole !== 'tenant_admin') {
      const myStores = await prisma.userStoreAssignment.findMany({
        where: { userId: req.user!.sub },
        select: { storeId: true },
      });
      const myStoreIds = myStores.map((a: { storeId: string }) => a.storeId);
      const targetStores = await prisma.userStoreAssignment.findMany({
        where: { userId: targetUser.id },
        select: { storeId: true },
      });
      const hasOverlap = targetStores.some((a: { storeId: string }) => myStoreIds.includes(a.storeId));
      if (!hasOverlap && targetUser.id !== req.user!.sub) {
        res.status(403).json({ error: 'Kein Zugriff auf diesen Benutzer.' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params['id'] },
      data: updateData,
    });

    // Store-Zuweisungen aktualisieren (wenn angegeben)
    if (storeIds !== undefined) {
      // Alle alten löschen, neue erstellen
      await prisma.userStoreAssignment.deleteMany({
        where: { userId: user.id },
      });
      if (storeIds.length > 0) {
        await prisma.userStoreAssignment.createMany({
          data: storeIds.map((storeId) => ({
            userId: user.id,
            storeId,
          })),
        });
      }
    }

    // Region-Zuweisungen aktualisieren (wenn angegeben)
    if (regionIds !== undefined) {
      await prisma.userRegionAssignment.deleteMany({
        where: { userId: user.id },
      });
      if (regionIds.length > 0) {
        await prisma.userRegionAssignment.createMany({
          data: regionIds.map((regionId) => ({
            userId: user.id,
            regionId,
          })),
        });
      }
    }

    await logAudit({
      tenantId: targetUser.tenantId,
      userId: req.user!.sub,
      action: 'UPDATE',
      entity: 'user',
      entityId: user.id,
      details: JSON.stringify({ userName: user.name }),
      ipAddress: req.ip || null,
    });

    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        storeAssignments: {
          select: { storeId: true, store: { select: { name: true } } },
        },
        regionAssignments: {
          select: { regionId: true, region: { select: { name: true } } },
        },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /api/admin/users/:id/stores — Store-Zuweisungen aktualisieren
adminUsersRouter.put('/:id/stores', async (req, res) => {
  try {
    const result = userStoreAssignSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validierungsfehler',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: req.params['id'] },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      return;
    }

    // Tenant-Scoping
    if (req.user!.role !== 'kore_admin' && targetUser.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Benutzer.' });
      return;
    }

    const { storeIds } = result.data;

    // Replace all store assignments
    await prisma.userStoreAssignment.deleteMany({
      where: { userId: targetUser.id },
    });

    if (storeIds.length > 0) {
      await prisma.userStoreAssignment.createMany({
        data: storeIds.map((storeId) => ({
          userId: targetUser.id,
          storeId,
        })),
      });
    }

    await logAudit({
      tenantId: targetUser.tenantId,
      userId: req.user!.sub,
      action: 'UPDATE',
      entity: 'user',
      entityId: targetUser.id,
      details: JSON.stringify({ userName: targetUser.name, storesAssigned: storeIds.length }),
      ipAddress: req.ip || null,
    });

    const assignments = await prisma.userStoreAssignment.findMany({
      where: { userId: targetUser.id },
      select: {
        id: true,
        storeId: true,
        assignedAt: true,
        store: { select: { id: true, name: true, city: true } },
      },
    });

    res.json({ storeAssignments: assignments });
  } catch (err) {
    console.error('User store assign error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /api/admin/users/:id/regions — Region-Zuweisungen aktualisieren
adminUsersRouter.put('/:id/regions', async (req, res) => {
  try {
    const result = userRegionAssignSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validierungsfehler',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: req.params['id'] },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      return;
    }

    // Tenant-Scoping
    if (req.user!.role !== 'kore_admin' && targetUser.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Benutzer.' });
      return;
    }

    // Mindestens tenant_admin für Region-Zuweisungen
    if (!hasMinRole(req.user!.role as UserRole, 'tenant_admin')) {
      res.status(403).json({ error: 'Keine Berechtigung für Region-Zuweisungen.' });
      return;
    }

    const { regionIds } = result.data;

    // Replace all region assignments
    await prisma.userRegionAssignment.deleteMany({
      where: { userId: targetUser.id },
    });

    if (regionIds.length > 0) {
      await prisma.userRegionAssignment.createMany({
        data: regionIds.map((regionId) => ({
          userId: targetUser.id,
          regionId,
        })),
      });
    }

    await logAudit({
      tenantId: targetUser.tenantId,
      userId: req.user!.sub,
      action: 'UPDATE',
      entity: 'user_regions',
      entityId: targetUser.id,
      details: JSON.stringify({ userName: targetUser.name, regionsAssigned: regionIds.length }),
      ipAddress: req.ip || null,
    });

    const assignments = await prisma.userRegionAssignment.findMany({
      where: { userId: targetUser.id },
      select: {
        id: true,
        regionId: true,
        assignedAt: true,
        region: { select: { id: true, name: true, description: true } },
      },
    });

    res.json({ regionAssignments: assignments });
  } catch (err) {
    console.error('User region assign error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /api/admin/users/:id — User deaktivieren (soft delete)
adminUsersRouter.delete('/:id', async (req, res) => {
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: req.params['id'] },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      return;
    }

    // Tenant-Scoping
    if (req.user!.role !== 'kore_admin' && targetUser.tenantId !== req.user!.tenantId) {
      res.status(403).json({ error: 'Kein Zugriff auf diesen Benutzer.' });
      return;
    }

    // Kann sich nicht selbst deaktivieren
    if (targetUser.id === req.user!.sub) {
      res.status(400).json({ error: 'Sie können sich nicht selbst deaktivieren.' });
      return;
    }

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { isActive: false },
    });

    await logAudit({
      tenantId: targetUser.tenantId,
      userId: req.user!.sub,
      action: 'DELETE',
      entity: 'user',
      entityId: targetUser.id,
      details: JSON.stringify({ userName: targetUser.name }),
      ipAddress: req.ip || null,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('User delete error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
