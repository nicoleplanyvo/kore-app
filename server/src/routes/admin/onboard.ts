import { Router, type Router as RouterType } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';
import { logAudit } from '../../lib/audit.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';
import { onboardSchema } from '@shared/validators';

export const adminOnboardRouter: RouterType = Router();

// Nur kore_admin darf neue Mandanten/Kunden anlegen
adminOnboardRouter.use(authenticate, requireMinRole('kore_admin'));

/** Firmenname → URL-tauglicher Slug. */
function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'kunde'
  );
}

/** Lesbares, starkes Temp-Passwort (12 Zeichen). */
function generatePassword(): string {
  return crypto.randomBytes(9).toString('base64url');
}

// POST /api/admin/onboard — Kunde in einem Schritt anlegen
adminOnboardRouter.post('/', async (req, res) => {
  const parsed = onboardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validierungsfehler', details: parsed.error.flatten().fieldErrors });
    return;
  }
  const { tenant, stores, toolKeys, admin } = parsed.data;

  try {
    // E-Mail des Admin-Users darf noch nicht existieren
    const existingUser = await prisma.user.findUnique({ where: { email: admin.email } });
    if (existingUser) {
      res.status(409).json({ error: `E-Mail ${admin.email} ist bereits vergeben.` });
      return;
    }

    const tempPassword = admin.password && admin.password.length >= 8 ? admin.password : generatePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      // 1) Eindeutigen Slug bestimmen
      const base = tenant.slug && tenant.slug.length >= 2 ? tenant.slug : slugify(tenant.name);
      let slug = base;
      let i = 1;
      while (await tx.tenant.findUnique({ where: { slug } })) {
        slug = `${base}-${i++}`.slice(0, 50);
      }

      // 2) Mandant
      const createdTenant = await tx.tenant.create({
        data: {
          name: tenant.name,
          slug,
          contactEmail: tenant.contactEmail || null,
          contactName: tenant.contactName || null,
          maxUsers: tenant.maxUsers ?? 15,
        },
      });

      // 3) Stores
      const createdStores = [];
      for (const s of stores) {
        const store = await tx.store.create({
          data: { tenantId: createdTenant.id, name: s.name, city: s.city || null },
        });
        createdStores.push(store);
      }

      // 4) Tools auflösen (['*'] = alle) und jedem Store zuweisen
      const tools = await tx.toolDefinition.findMany({
        where: toolKeys.includes('*') ? {} : { key: { in: toolKeys } },
        select: { id: true, name: true },
      });
      const assignmentData = createdStores.flatMap((store) =>
        tools.map((t) => ({ storeId: store.id, toolId: t.id })),
      );
      if (assignmentData.length > 0) {
        await tx.storeToolAssignment.createMany({ data: assignmentData });
      }

      // 5) Admin-User (Tenant-Admin) + Store-Zuweisungen
      const user = await tx.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          passwordHash,
          role: 'tenant_admin',
          tenantId: createdTenant.id,
        },
      });
      await tx.userStoreAssignment.createMany({
        data: createdStores.map((store) => ({ userId: user.id, storeId: store.id })),
      });

      return { tenant: createdTenant, stores: createdStores, tools, user };
    });

    await logAudit({
      tenantId: result.tenant.id,
      userId: req.user!.sub,
      action: 'CREATE',
      entity: 'tenant',
      entityId: result.tenant.id,
      details: JSON.stringify({
        onboarding: true,
        name: result.tenant.name,
        stores: result.stores.length,
        tools: result.tools.length,
        adminEmail: admin.email,
      }),
      ipAddress: req.ip,
    });

    res.status(201).json({
      ok: true,
      tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug },
      stores: result.stores.map((s) => ({ id: s.id, name: s.name, city: s.city })),
      tools: result.tools.map((t) => t.name),
      admin: {
        name: result.user.name,
        email: result.user.email,
        // Temp-Passwort wird genau EINMAL zurueckgegeben (nur wenn generiert)
        tempPassword: admin.password && admin.password.length >= 8 ? null : tempPassword,
      },
      loginUrl: process.env['APP_URL'] ?? 'https://app.kore-retail.de',
    });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Onboarding fehlgeschlagen.' });
  }
});
