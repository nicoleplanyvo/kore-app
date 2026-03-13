// Tool-Kategorien gemaess KORE Akquisepapier
export const TOOL_CATEGORIES: Record<string, { label: string; description: string; icon: string }> = {
  STANDARDS_COMPLIANCE: {
    label: 'Standards & Compliance',
    description: 'Checklisten, Store Standards, Foto-Compliance und SOPs',
    icon: 'ClipboardCheck',
  },
  PERFORMANCE: {
    label: 'Performance & Sichtbarkeit',
    description: 'KPI Dashboard, Budget, Forecast und Loss Prevention',
    icon: 'BarChart3',
  },
  FLOOR: {
    label: 'Floor in Echtzeit',
    description: 'Live Floor, FR Tracking, VM Guidelines und Maintenance',
    icon: 'Monitor',
  },
  TRAINING: {
    label: 'Training & Entwicklung',
    description: 'Training Hub/LMS, Training Hours, Challenges und Onboarding',
    icon: 'GraduationCap',
  },
  COACHING_PEOPLE: {
    label: 'Coaching & People',
    description: '1:1 Coaching, PDP/PIP, Appraisals, Shift Planning und Wellbeing',
    icon: 'Heart',
  },
  KOMMUNIKATION: {
    label: 'Kommunikation & Signal',
    description: 'Briefings, Handover, Team Push und Team Newsletter',
    icon: 'MessageSquare',
  },
  CUSTOMER_STOCK: {
    label: 'Customer, Clienteling & Stock',
    description: 'FR Conversion, Clienteling/CRM, Stock Callouts und Track & Trace',
    icon: 'Users',
  },
  REGIONAL_INSIGHTS: {
    label: 'Regional Insights',
    description: 'Multi-Store View und RM Dashboard',
    icon: 'Map',
  },
};

export const CATEGORY_ORDER = [
  'STANDARDS_COMPLIANCE',
  'PERFORMANCE',
  'FLOOR',
  'TRAINING',
  'COACHING_PEOPLE',
  'KOMMUNIKATION',
  'CUSTOMER_STOCK',
  'REGIONAL_INSIGHTS',
];
