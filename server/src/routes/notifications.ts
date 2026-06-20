import { Router, type Router as RouterType } from 'express';
import prisma from '../lib/prisma.js';
import { z } from 'zod';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const notificationsRouter: RouterType = Router();

const registerSchema = z.object({
  token: z.string().min(10).max(4096),
  platform: z.enum(['ios', 'android', 'web']),
});

// POST /register-device — Geräte-Token der nativen App speichern (upsert)
notificationsRouter.post('/register-device', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId ?? '';
    const userId = req.user!.sub;
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.' });

    const dt = await prisma.deviceToken.upsert({
      where: { token: parsed.data.token },
      create: { tenantId, userId, token: parsed.data.token, platform: parsed.data.platform },
      update: { tenantId, userId, platform: parsed.data.platform },
      select: { id: true },
    });
    res.status(201).json({ id: dt.id });
  } catch (err) {
    console.error('register-device Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /register-device — Token entfernen (Logout/Abmeldung Gerät)
notificationsRouter.delete('/register-device', async (req, res) => {
  try {
    const token = (req.body?.token ?? '') as string;
    if (token) await prisma.deviceToken.deleteMany({ where: { token } });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete-device Fehler:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
