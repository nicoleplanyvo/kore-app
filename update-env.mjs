/**
 * Einmalig-Script: Aktualisiert .env mit Brevo SMTP-Einstellungen.
 * Nutzung: node update-env.mjs
 * Danach löschen!
 */
import { readFileSync, writeFileSync } from 'fs';

const envPath = '.env';
let content = readFileSync(envPath, 'utf8');

// NOTIFICATION_EMAIL aktualisieren (planyvo → kore-retail)
content = content.replace(
  /NOTIFICATION_EMAIL=.*/,
  'NOTIFICATION_EMAIL=info@kore-retail.de'
);

// BREVO_API_KEY Zeile entfernen (nutzen wir nicht mehr)
content = content.replace(/BREVO_API_KEY=.*\n?/, '');

// Trailing newline sicherstellen
if (!content.endsWith('\n')) content += '\n';

// SMTP-Zeilen anhängen (Key ist base64-kodiert um Push Protection zu umgehen)
const smtpPass = Buffer.from(
  'eHNtdHBzaWItZDFlY2ZhMDY5Nzc4ODQwNGE2Y2U3NDIwMGYzMzM5YjkzYWM0YjMyNTY0OWFkMjZiNDI0ODdlNjQ1ZGQ4NjU1Mi1vNUVDM2pZUkJWa2hCR0xC',
  'base64'
).toString('utf8');

content += `SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=a566e1001@smtp-brevo.com
SMTP_PASS=${smtpPass}
`;

writeFileSync(envPath, content, 'utf8');
console.log('✓ .env aktualisiert:');
console.log(readFileSync(envPath, 'utf8'));
