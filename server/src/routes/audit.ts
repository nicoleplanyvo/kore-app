import { Router, type Router as RouterType } from 'express';
import { auditRequestSchema } from '@shared/validators';
import {
  sendEmail,
  auditNotificationEmail,
  auditConfirmationEmail,
} from '../lib/email.js';

export const auditRouter: RouterType = Router();

auditRouter.post('/', async (req, res) => {
  try {
    // Validate
    const result = auditRequestSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validierungsfehler',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const data = result.data;

    // Send emails
    const [notification, confirmation] = await Promise.all([
      sendEmail(auditNotificationEmail(data)),
      sendEmail(auditConfirmationEmail(data)),
    ]);

    if (!notification.success || !confirmation.success) {
      console.error('Email error:', notification.error || confirmation.error);
      res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden.' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Audit route error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
