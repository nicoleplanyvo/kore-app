import { Router, type Router as RouterType } from 'express';
import { contactFormSchema } from '@shared/validators';
import {
  sendEmail,
  contactNotificationEmail,
  contactConfirmationEmail,
} from '../lib/email.js';

export const contactRouter: RouterType = Router();

contactRouter.post('/', async (req, res) => {
  try {
    // Validate
    const result = contactFormSchema.safeParse(req.body);
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
      sendEmail(contactNotificationEmail(data)),
      sendEmail(contactConfirmationEmail(data)),
    ]);

    if (!notification.success || !confirmation.success) {
      console.error('Email error:', notification.error || confirmation.error);
      res.status(500).json({ error: 'E-Mail konnte nicht gesendet werden.' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Contact route error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
