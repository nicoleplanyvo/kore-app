/**
 * KORE Tool Route Registry (kore-web App)
 *
 * Mapping von ToolDefinition.key -> App-Route.
 * Alle Routen sind relativ zu /tools/
 */
export const TOOL_ROUTES: Record<string, string> = {
  'standards.excellence_tracker': '/tools/sea',
  'standards.checklisten': '/tools/checklisten',
  'standards.sop_bibliothek': '/tools/sop',
  'standards.vm_foto_compliance': '/tools/vm-compliance',
  'standards.store_standards': '/tools/store-standards',
  // Performance & Sichtbarkeit
  'performance.kpi_dashboard': '/tools/kpi',
  'performance.budget_tracker': '/tools/budget',
  'performance.forecast': '/tools/forecast',
  'performance.loss_prevention': '/tools/loss-prevention',
  'performance.inventory': '/tools/inventory',
  // Floor in Echtzeit
  'floor.live_floor': '/tools/live-floor',
  'floor.fr_tracking': '/tools/fr-tracking',
  'floor.vm_guidelines': '/tools/vm-guidelines',
  'floor.maintenance': '/tools/maintenance',
  // Training & Entwicklung
  'training.training_hub_lms': '/tools/training-hub',
  'training.training_hours': '/tools/training-hours',
  'training.challenges': '/tools/challenges',
  'training.onboarding': '/tools/onboarding',
  // Coaching & People
  'coaching.one_on_one': '/tools/coaching',
  'coaching.pdp_pip': '/tools/pdp-pip',
  'coaching.appraisals': '/tools/appraisals',
  'coaching.shift_planning': '/tools/shift-planning',
  'coaching.pulse_survey': '/tools/pulse-survey',
  'coaching.wellbeing': '/tools/wellbeing',
  // Kommunikation & Signal
  'komm.briefings': '/tools/briefings',
  'komm.handover': '/tools/handover',
  'komm.team_push': '/tools/team-push',
  'komm.team_newsletter': '/tools/newsletter',
  // Customer, Clienteling & Stock
  'customer.fr_conversion': '/tools/fr-conversion',
  'customer.clienteling_crm': '/tools/clienteling',
  'customer.stock_callouts': '/tools/stock-callouts',
  'customer.track_trace': '/tools/track-trace',
  // Regional Insights
  'regional.multi_store_view': '/tools/multi-store',
  'regional.rm_dashboard': '/tools/rm-dashboard',
};

/**
 * Gibt die App-Route für ein Tool zurück, falls vorhanden.
 */
export function getToolRoute(toolKey: string): string | undefined {
  return TOOL_ROUTES[toolKey];
}
