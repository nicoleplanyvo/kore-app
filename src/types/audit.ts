// Inline-Types aus @kore/types — Store Excellence Audit

export type AuditSessionStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface AuditTemplate {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  version: number;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  categories?: AuditCategory[];
}

export interface AuditCategory {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  weight: number;
  criteria?: AuditCriterion[];
  _count?: { criteria: number };
}

export interface AuditCriterion {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isRequired: boolean;
  photoRequired: boolean;
}

export interface AuditSession {
  id: string;
  tenantId: string;
  storeId: string;
  templateId: string;
  conductedBy: string;
  storeLocation: string | null;
  status: AuditSessionStatus;
  overallScore: number | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template?: AuditTemplate;
  store?: { id: string; name: string; city: string | null };
  responses?: AuditResponse[];
  _count?: { responses: number };
}

export interface AuditResponse {
  id: string;
  sessionId: string;
  criterionId: string;
  scorePercent: number | null;
  passed: boolean | null;
  comment: string | null;
  photoPath: string | null;
  createdAt: string;
  updatedAt: string;
  criterion?: AuditCriterion;
}

export interface AuditSummaryStats {
  totalAudits: number;
  averageScore: number;
  passRate: number;
  recentTrend: 'up' | 'down' | 'stable';
}
