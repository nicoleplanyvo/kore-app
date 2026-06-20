import { Router, type Router as RouterType } from 'express';
import { collectPilotMetrics } from '../lib/pilot-report.js';
import { generatePilotReportPdf } from '../lib/pilot-report-pdf.js';

export const reportingRouter: RouterType = Router();

// GET /pilot-report.pdf?from=YYYY-MM-DD&to=YYYY-MM-DD[&tenantId=...]
// Pilot-Ergebnisbericht als PDF. tenantId aus JWT; kore_admin darf via Query wählen.
reportingRouter.get('/pilot-report.pdf', async (req, res) => {
  try {
    const tenantId = (req.user!.tenantId ?? (req.query['tenantId'] as string | undefined)) || '';
    if (!tenantId) return res.status(400).json({ error: 'tenantId erforderlich.' });

    const now = Date.now();
    const to = req.query['to'] ? new Date(`${req.query['to']}T23:59:59`) : new Date(now);
    const from = req.query['from']
      ? new Date(`${req.query['from']}T00:00:00`)
      : new Date(now - 28 * 24 * 60 * 60 * 1000); // Standard: 4 Wochen
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ error: 'Ungültiger Zeitraum.' });
    }

    const report = await collectPilotMetrics(tenantId, from, to);
    const pdf = await generatePilotReportPdf(report);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="KORE-Pilot-Report-${report.from}_${report.to}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('pilot-report error:', err);
    res.status(500).json({ error: 'Report konnte nicht erstellt werden.' });
  }
});
