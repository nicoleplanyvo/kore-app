import 'dotenv/config';
import { fileURLToPath } from 'url';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { contactRouter } from './routes/contact.js';
import { auditRouter } from './routes/audit.js';
import { authRouter } from './routes/auth.js';
import { authenticate } from './middleware/auth.js';
import { startPhotoRetention } from './lib/retention.js';
import { adminTenantsRouter } from './routes/admin/tenants.js';
import { adminToolsRouter } from './routes/admin/tools.js';
import { adminStoresRouter } from './routes/admin/stores.js';
import { adminGdprRouter } from './routes/admin/gdpr.js';
import { adminUsersRouter } from './routes/admin/users.js';
import { adminReportingRouter } from './routes/admin/reporting.js';
import { adminRegionsRouter } from './routes/admin/regions.js';
import { adminDashboardRouter } from './routes/admin/dashboard.js';
import { adminBillingRouter } from './routes/admin/billing.js';
import { storeExcellenceAuditRouter } from './routes/tools/store-excellence-audit/index.js';
import { checklistenRouter } from './routes/tools/checklisten/index.js';
import { sopRouter } from './routes/tools/sop/index.js';
import { vmComplianceRouter } from './routes/tools/vm-compliance/index.js';
import { storeStandardsRouter } from './routes/tools/store-standards/index.js';
import { kpiDashboardRouter } from './routes/tools/kpi-dashboard/index.js';
import { budgetTrackerRouter } from './routes/tools/budget-tracker/index.js';
import { forecastRouter as forecastToolRouter } from './routes/tools/forecast/index.js';
import { lossPreventionRouter } from './routes/tools/loss-prevention/index.js';
import { inventoryRouter } from './routes/tools/inventory/index.js';
import { liveFloorRouter } from './routes/tools/live-floor/index.js';
import { frTrackingRouter } from './routes/tools/fr-tracking/index.js';
import { vmGuidelinesRouter } from './routes/tools/vm-guidelines/index.js';
import { maintenanceRouter } from './routes/tools/maintenance/index.js';
import { trainingHubRouter } from './routes/tools/training-hub/index.js';
import { trainingHoursRouter } from './routes/tools/training-hours/index.js';
import { challengesRouter } from './routes/tools/challenges/index.js';
import { onboardingRouter } from './routes/tools/onboarding/index.js';
import { coachingRouter } from './routes/tools/coaching/index.js';
import { pdpPipRouter } from './routes/tools/pdp-pip/index.js';
import { appraisalsRouter } from './routes/tools/appraisals/index.js';
import { shiftPlanningRouter } from './routes/tools/shift-planning/index.js';
import { pulseSurveyRouter } from './routes/tools/pulse-survey/index.js';
import { wellbeingRouter } from './routes/tools/wellbeing/index.js';
import { briefingsRouter } from './routes/tools/briefings/index.js';
import { handoverRouter } from './routes/tools/handover/index.js';
import { teamPushRouter } from './routes/tools/team-push/index.js';
import { newsletterRouter } from './routes/tools/newsletter/index.js';
import { frConversionRouter } from './routes/tools/fr-conversion/index.js';
import { clientelingRouter } from './routes/tools/clienteling/index.js';
import { stockCalloutsRouter } from './routes/tools/stock-callouts/index.js';
import { trackTraceRouter } from './routes/tools/track-trace/index.js';
import { multiStoreRouter } from './routes/tools/multi-store/index.js';
import { rmDashboardRouter } from './routes/tools/rm-dashboard/index.js';
import { metrixRouter } from './routes/tools/metrix/index.js';
import { toolsRouter } from './routes/tools/index.js';
import { myDayRouter } from './routes/tools/my-day/index.js';
import { blogRouter } from './routes/blog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';
const isProduction = NODE_ENV === 'production';

// ── Security ──────────────────────────────────────
app.use(helmet({
  // CSP in Produktion AN (Security-Review), aber blob: für Bilder erlauben —
  // AuthImage lädt geschützte Uploads als Blob-Objekt-URL. Ohne blob: blockiert
  // die Default-CSP (img-src 'self' data:) alle Foto-Vorschauen.
  contentSecurityPolicy: isProduction
    ? {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'img-src': ["'self'", 'data:', 'blob:'],
        },
      }
    : false,
}));

// Rate Limiting: max 100 Requests pro 15 Minuten pro IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Anfragen. Bitte versuche es später erneut.' },
});

// Strengeres Limit für Auth-Endpoints (Brute-Force Schutz)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Login-Versuche. Bitte warte 15 Minuten.' },
});

// ── Middleware ────────────────────────────────────
// Same-Origin: kein CORS nötig (Client + API auf einer Domain)
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/api/', apiLimiter);

// ── API Routes ────────────────────────────────────
// Website-Formulare (öffentlich)
app.use('/api/contact', contactRouter);
app.use('/api/audit', auditRouter);

// Blog (öffentlich + Lotta API)
app.use('/api/blog', blogRouter);

// Auth (mit strengerem Rate-Limit)
app.use('/api/auth', authLimiter, authRouter);

// Admin
app.use('/api/admin/tenants', adminTenantsRouter);
app.use('/api/admin/tools', adminToolsRouter);
app.use('/api/admin/stores', adminStoresRouter);
app.use('/api/admin/gdpr', adminGdprRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/reporting', adminReportingRouter);
app.use('/api/admin/regions', adminRegionsRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/billing', adminBillingRouter);

// Tools
app.use('/api/tools', toolsRouter);
app.use('/api/tools/my-day', myDayRouter);
app.use('/api/tools/sea', storeExcellenceAuditRouter);
app.use('/api/tools/checklisten', checklistenRouter);
app.use('/api/tools/sop', sopRouter);
app.use('/api/tools/vm-compliance', vmComplianceRouter);
app.use('/api/tools/store-standards', storeStandardsRouter);
app.use('/api/tools/kpi', kpiDashboardRouter);
app.use('/api/tools/budget', budgetTrackerRouter);
app.use('/api/tools/forecast', forecastToolRouter);
app.use('/api/tools/loss-prevention', lossPreventionRouter);
app.use('/api/tools/inventory', inventoryRouter);
app.use('/api/tools/live-floor', liveFloorRouter);
app.use('/api/tools/fr-tracking', frTrackingRouter);
app.use('/api/tools/vm-guidelines', vmGuidelinesRouter);
app.use('/api/tools/maintenance', maintenanceRouter);
app.use('/api/tools/training-hub', trainingHubRouter);
app.use('/api/tools/training-hours', trainingHoursRouter);
app.use('/api/tools/challenges', challengesRouter);
app.use('/api/tools/onboarding', onboardingRouter);
app.use('/api/tools/coaching', coachingRouter);
app.use('/api/tools/pdp-pip', pdpPipRouter);
app.use('/api/tools/appraisals', appraisalsRouter);
app.use('/api/tools/shift-planning', shiftPlanningRouter);
app.use('/api/tools/pulse-survey', pulseSurveyRouter);
app.use('/api/tools/wellbeing', wellbeingRouter);
app.use('/api/tools/briefings', briefingsRouter);
app.use('/api/tools/handover', handoverRouter);
app.use('/api/tools/team-push', teamPushRouter);
app.use('/api/tools/newsletter', newsletterRouter);
app.use('/api/tools/fr-conversion', frConversionRouter);
app.use('/api/tools/clienteling', clientelingRouter);
app.use('/api/tools/stock-callouts', stockCalloutsRouter);
app.use('/api/tools/track-trace', trackTraceRouter);
app.use('/api/tools/multi-store', multiStoreRouter);
app.use('/api/tools/rm-dashboard', rmDashboardRouter);
app.use('/api/tools/metrix', metrixRouter);

// Statische Uploads mit Auth-Schutz
const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? path.join(process.cwd(), 'uploads');
app.use('/api/uploads', authenticate, express.static(UPLOAD_DIR));

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'kore-server', mode: NODE_ENV });
});

// ── Production: Client-SPA servieren ─────────────
if (isProduction) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ── Start ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ KORE Server running on port ${PORT} (${NODE_ENV})`);
  console.log(`  SMTP: ${process.env['SMTP_USER'] ? 'configured (Brevo)' : 'not configured (dev mode — mails logged only)'}`);
  // DSGVO-Foto-Retention (DSFA-Maßnahme): tägliche Löschung alter Store-Fotos
  startPhotoRetention();
});
