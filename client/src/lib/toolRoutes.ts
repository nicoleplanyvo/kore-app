/**
 * KORE Tool Route Registry (kore-web App)
 *
 * Mapping von ToolDefinition.key -> App-Route.
 * Alle Routen sind relativ zu /app/tools/
 */
export const TOOL_ROUTES: Record<string, string> = {
  'standards.excellence_tracker': '/app/tools/sea',
  'standards.checklisten': '/app/tools/checklisten',
  'standards.sop_bibliothek': '/app/tools/sop',
  'standards.vm_foto_compliance': '/app/tools/vm-compliance',
  'standards.store_standards': '/app/tools/store-standards',
  // Performance & Sichtbarkeit
  'performance.kpi_dashboard': '/app/tools/kpi',
  'performance.budget_tracker': '/app/tools/budget',
  'performance.forecast': '/app/tools/forecast',
  'performance.loss_prevention': '/app/tools/loss-prevention',
  'performance.inventory': '/app/tools/inventory',
  // Floor in Echtzeit
  'floor.live_floor': '/app/tools/live-floor',
  'floor.fr_tracking': '/app/tools/fr-tracking',
  'floor.vm_guidelines': '/app/tools/vm-guidelines',
  'floor.maintenance': '/app/tools/maintenance',
  // Training & Entwicklung
  'training.training_hub_lms': '/app/tools/training-hub',
  'training.training_hours': '/app/tools/training-hours',
  'training.challenges': '/app/tools/challenges',
  'training.onboarding': '/app/tools/onboarding',
  // Coaching & People
  'coaching.one_on_one': '/app/tools/coaching',
  'coaching.pdp_pip': '/app/tools/pdp-pip',
  'coaching.appraisals': '/app/tools/appraisals',
  'coaching.shift_planning': '/app/tools/shift-planning',
  'coaching.pulse_survey': '/app/tools/pulse-survey',
  'coaching.wellbeing': '/app/tools/wellbeing',
  // Kommunikation & Signal
  'komm.briefings': '/app/tools/briefings',
  'komm.handover': '/app/tools/handover',
  'komm.team_push': '/app/tools/team-push',
  'komm.team_newsletter': '/app/tools/newsletter',
  // Customer, Clienteling & Stock
  'customer.fr_conversion': '/app/tools/fr-conversion',
  'customer.clienteling_crm': '/app/tools/clienteling',
  'customer.stock_callouts': '/app/tools/stock-callouts',
  'customer.track_trace': '/app/tools/track-trace',
  // Regional Insights
  'regional.multi_store_view': '/app/tools/multi-store',
  'regional.rm_dashboard': '/app/tools/rm-dashboard',
};

/**
 * Gibt die App-Route fuer ein Tool zurueck, falls vorhanden.
 */
export function getToolRoute(toolKey: string): string | undefined {
  return TOOL_ROUTES[toolKey];
}
