/**
 * E-Mail-Versand über Brevo API (früher Sendinblue)
 * https://api.brevo.com/v3/smtp/email
 */

const BREVO_API_KEY = process.env['BREVO_API_KEY'] ?? 'REDACTED_ROTATED_KEY';
if (!BREVO_API_KEY) {
  console.warn('⚠ BREVO_API_KEY nicht gesetzt — E-Mails werden nur geloggt.');
}

const FROM = process.env['FROM_EMAIL'] ?? 'noreply@kore-retail.de';
const NOTIFY = process.env['NOTIFICATION_EMAIL'] ?? 'info@kore-retail.de';

// ──────────────────────────────────────────────
// Brevo Send
// ──────────────────────────────────────────────

interface EmailPayload {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  if (!BREVO_API_KEY) {
    console.log('[DEV] E-Mail (nur geloggt):', {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
    });
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    // Brevo Format
    const recipients = Array.isArray(payload.to) 
      ? payload.to.map(email => ({ email }))
      : [{ email: payload.to }];

    const sender = { email: FROM, name: 'KORE' };

    const brevoPayload = {
      sender,
      to: recipients,
      subject: payload.subject,
      htmlContent: payload.html,
      ...(payload.reply_to ? { replyTo: { email: payload.reply_to } } : {}),
    };

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(brevoPayload),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Brevo error:', res.status, body);
      return { success: false, error: `Brevo ${res.status}: ${body}` };
    }

    const data = (await res.json()) as { messageId?: string };
    return { success: true, messageId: data.messageId };
  } catch (err) {
    console.error('Brevo fetch error:', err);
    return { success: false, error: String(err) };
  }
}

// ──────────────────────────────────────────────
// E-Mail-Templates (KORE App)
// ──────────────────────────────────────────────

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background-color: #F7F4EF; font-family: 'Jost', 'Helvetica Neue', Arial, sans-serif; color: #1C1A17; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 24px; }
    .header { border-bottom: 2px solid #9E8460; padding-bottom: 20px; margin-bottom: 32px; }
    .logo { font-family: 'Cormorant', Georgia, serif; font-size: 28px; font-weight: 300; letter-spacing: 2px; color: #1C1A17; }
    .content { font-size: 15px; line-height: 1.7; color: #524E46; }
    .content h2 { font-family: 'Cormorant', Georgia, serif; font-size: 22px; font-weight: 400; color: #1C1A17; margin: 0 0 16px 0; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9E8460; font-weight: 500; margin-bottom: 4px; }
    .field { background: #FDFCFA; border: 1px solid #D8D4CC; padding: 12px 16px; margin-bottom: 12px; font-size: 14px; line-height: 1.6; color: #1C1A17; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #D8D4CC; font-size: 12px; color: #9E8460; }
    .brass-line { width: 48px; height: 2px; background: #9E8460; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">KORE</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      KORE — Retail Intelligence<br/>
      Eine Marke der Muñoz Bonilla GmbH<br/>
      Benediktusstraße 46, 40549 Düsseldorf
    </div>
  </div>
</body>
</html>`;
}

// ──────────────────────────────────────────────
// Benutzer-Registrierung
// ──────────────────────────────────────────────

export function userInviteEmail(data: {
  name: string;
  email: string;
  companyName: string;
  inviteLink: string;
}): EmailPayload {
  return {
    from: FROM,
    to: data.email,
    subject: `Willkommen bei KORE — ${data.companyName}`,
    html: baseLayout(`
      <h2>Willkommen bei KORE, ${escapeHtml(data.name)}.</h2>
      <p>Sie wurden zu KORE für <strong>${escapeHtml(data.companyName)}</strong> eingeladen.</p>
      <div class="brass-line"></div>
      <p>Klicken Sie auf den folgenden Link, um Ihr Konto zu aktivieren:</p>
      <p><a href="${escapeHtml(data.inviteLink)}" style="background: #9E8460; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Konto aktivieren</a></p>
      <p style="margin-top: 24px; color: #9E8460; font-style: italic;">
        Bei Fragen erreichen Sie uns unter <a href="mailto:info@kore-retail.de">info@kore-retail.de</a><br/>
        KORE — Retail Intelligence
      </p>
    `),
  };
}

export function passwordResetEmail(data: {
  name: string;
  email: string;
  resetLink: string;
}): EmailPayload {
  return {
    from: FROM,
    to: data.email,
    subject: 'KORE — Passwort zurücksetzen',
    html: baseLayout(`
      <h2>Passwort zurücksetzen</h2>
      <p>Hallo ${escapeHtml(data.name)},</p>
      <p>Sie haben eine Anfrage zum Zurücksetzen Ihres KORE-Passworts gestellt.</p>
      <div class="brass-line"></div>
      <p>Klicken Sie auf den folgenden Link, um ein neues Passwort zu erstellen:</p>
      <p><a href="${escapeHtml(data.resetLink)}" style="background: #9E8460; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Neues Passwort erstellen</a></p>
      <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
      <p style="margin-top: 24px; color: #9E8460; font-style: italic;">
        KORE — Retail Intelligence
      </p>
    `),
  };
}

// ──────────────────────────────────────────────
// Kontaktformular
// ──────────────────────────────────────────────

export function contactNotificationEmail(data: {
  name: string;
  email: string;
  company?: string;
  message: string;
}): EmailPayload {
  return {
    from: FROM,
    to: NOTIFY,
    subject: `Neue KORE Kontaktanfrage: ${data.name}`,
    reply_to: data.email,
    html: baseLayout(`
      <h2>Neue Kontaktanfrage</h2>
      <div class="label">Name</div>
      <div class="field">${escapeHtml(data.name)}</div>
      <div class="label">E-Mail</div>
      <div class="field"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
      ${data.company ? `<div class="label">Unternehmen</div><div class="field">${escapeHtml(data.company)}</div>` : ''}
      <div class="label">Nachricht</div>
      <div class="field">${escapeHtml(data.message).replace(/\n/g, '<br/>')}</div>
    `),
  };
}

export function contactConfirmationEmail(data: { name: string; email: string }): EmailPayload {
  return {
    from: FROM,
    to: data.email,
    subject: 'Ihre Anfrage bei KORE',
    html: baseLayout(`
      <h2>Vielen Dank, ${escapeHtml(data.name)}.</h2>
      <p>Wir haben Ihre Anfrage erhalten und melden uns in der Regel innerhalb von 24 Stunden bei Ihnen.</p>
      <div class="brass-line"></div>
      <p>Falls Sie in der Zwischenzeit Fragen haben, erreichen Sie uns jederzeit unter <a href="mailto:info@kore-retail.de">info@kore-retail.de</a>.</p>
      <p style="margin-top: 24px; color: #9E8460; font-style: italic;">
        Mit besten Grüßen,<br/>
        Nicole Muñoz Bonilla<br/>
        KORE — Retail Intelligence
      </p>
    `),
  };
}

// ──────────────────────────────────────────────
// Audit-Anfrage
// ──────────────────────────────────────────────

export function auditNotificationEmail(data: {
  name: string;
  email: string;
  company: string;
  storeCount: string;
  challenge: string;
}): EmailPayload {
  return {
    from: FROM,
    to: NOTIFY,
    subject: `Neue KORE Audit-Anfrage: ${data.company}`,
    reply_to: data.email,
    html: baseLayout(`
      <h2>Neue Audit-Anfrage</h2>
      <div class="label">Name</div>
      <div class="field">${escapeHtml(data.name)}</div>
      <div class="label">Unternehmen</div>
      <div class="field">${escapeHtml(data.company)}</div>
      <div class="label">E-Mail</div>
      <div class="field"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>
      <div class="label">Anzahl Stores</div>
      <div class="field">${escapeHtml(data.storeCount)}</div>
      <div class="label">Herausforderung</div>
      <div class="field">${escapeHtml(data.challenge).replace(/\n/g, '<br/>')}</div>
    `),
  };
}

export function auditConfirmationEmail(data: { name: string; email: string; company: string }): EmailPayload {
  return {
    from: FROM,
    to: data.email,
    subject: 'Ihre Audit-Anfrage bei KORE',
    html: baseLayout(`
      <h2>Vielen Dank, ${escapeHtml(data.name)}.</h2>
      <p>Wir haben Ihre Audit-Anfrage für <strong>${escapeHtml(data.company)}</strong> erhalten.</p>
      <div class="brass-line"></div>
      <p><strong>Wie geht es weiter?</strong></p>
      <p>Wir melden uns innerhalb von 24 Stunden bei Ihnen, um einen Termin für ein erstes Gespräch zu vereinbaren. Dabei besprechen wir Ihre Herausforderungen und klären den Rahmen für das Audit.</p>
      <p style="margin-top: 24px; color: #9E8460; font-style: italic;">
        Mit besten Grüßen,<br/>
        Nicole Muñoz Bonilla<br/>
        KORE — Retail Intelligence
      </p>
    `),
  };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}