// === User & Auth ===

export type UserRole =
  | 'kore_admin'
  | 'tenant_admin'
  | 'regional_manager'
  | 'multisite_manager'
  | 'store_manager'
  | 'learner';

/** Hierarchie: Index 0 = höchste Berechtigung */
export const ROLE_HIERARCHY: UserRole[] = [
  'kore_admin',
  'tenant_admin',
  'regional_manager',
  'multisite_manager',
  'store_manager',
  'learner',
];

/** Prüft ob roleA ≥ roleB in der Hierarchie */
export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) <= ROLE_HIERARCHY.indexOf(requiredRole);
}

/** Prüft ob creator eine Rolle STRIKT unter sich erstellen kann */
export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY.indexOf(creatorRole) < ROLE_HIERARCHY.indexOf(targetRole);
}

/** Gibt alle Rollen zurück, die ein User erstellen kann (strikt unterhalb) */
export function getCreatableRoles(creatorRole: UserRole): UserRole[] {
  const idx = ROLE_HIERARCHY.indexOf(creatorRole);
  return ROLE_HIERARCHY.slice(idx + 1);
}

export type SubStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';

export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'CHECKLIST';

export type EnrollmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface JWTPayload {
  sub: string;
  tenantId: string | null;
  role: UserRole;
  impersonatedBy?: string; // Original-Admin-ID bei Impersonation
  iat: number;
  exp: number;
}

// === Auth User (Frontend) ===

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  impersonatedBy?: string;
  storeAssignments?: string[]; // Store-IDs
  regionAssignments?: string[]; // Region-IDs (für regional_manager)
}

// === User Store Assignment ===

export interface UserStoreAssignment {
  id: string;
  userId: string;
  storeId: string;
  store?: Store;
  assignedAt: string;
}

// === User Region Assignment ===

export interface UserRegionAssignment {
  id: string;
  userId: string;
  regionId: string;
  region?: Region;
  assignedAt: string;
}

// === Website Forms ===

export interface AuditRequestInput {
  name: string;
  company: string;
  storeCount: string;
  challenge: string;
  email: string;
}

export interface ContactFormInput {
  name: string;
  email: string;
  company?: string;
  message: string;
}

// === KPI (Pulse) ===

export interface KPIEntryInput {
  storeId: string;
  date: string;
  revenue: number;
  transactions: number;
  footfall?: number;
  unitsSold?: number;
  staffHours?: number;
}

// === Tool Categories & Definitions ===

export type ToolCategory =
  | 'STANDARDS_COMPLIANCE'
  | 'PERFORMANCE'
  | 'FLOOR'
  | 'TRAINING'
  | 'COACHING_PEOPLE'
  | 'KOMMUNIKATION'
  | 'CUSTOMER_STOCK'
  | 'REGIONAL_INSIGHTS';

export interface ToolDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: ToolCategory;
  icon: string | null;
  priceMonthly: number; // Cent pro Store pro Monat
  isActive: boolean;
  sortOrder: number;
  learnerAccessible: boolean;
}

// === Region ===

export interface Region {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stores?: Store[];
  _count?: { stores: number };
}

// === Store ===

export interface Store {
  id: string;
  tenantId: string;
  regionId: string | null;
  region?: { id: string; name: string } | null;
  name: string;
  city: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tools?: StoreToolAssignment[];
  _count?: { tools: number; userAssignments?: number };
}

export interface StoreToolAssignment {
  id: string;
  storeId: string;
  toolId: string;
  tool: ToolDefinition;
  isActive: boolean;
  assignedAt: string;
  config: string | null;
}

// === Tenant ===

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: SubStatus;
  contactEmail: string | null;
  contactName: string | null;
  contactPhone: string | null;
  maxUsers: number;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  stores?: Store[];
  _count?: { users: number; stores: number };
}

// === Dashboard ===

export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalStores: number;
  activeStores: number;
  totalToolBookings: number;
  mrr: number; // Monthly Recurring Revenue in Cent
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TenantListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SubStatus;
}

// === GDPR / Audit ===

export interface AuditLogEntry {
  id: string;
  tenantId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface DataProcessingConsent {
  id: string;
  tenantId: string;
  consentType: string;
  grantedAt: string;
  grantedBy: string;
  revokedAt: string | null;
  revokedBy: string | null;
  version: string;
  document: string | null;
}

// === Store User Assignment (reverse direction) ===

export interface StoreUserAssignment {
  id: string;
  userId: string;
  storeId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
  assignedAt: string;
}

// === Reporting Hierarchy ===

export interface ReportingManager {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  stores: { id: string; name: string; city: string | null }[];
}

export interface ReportingStore {
  id: string;
  name: string;
  city: string | null;
  isActive: boolean;
  users: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    assignedAt: string;
  }[];
}

export interface ReportingRegion {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  stores: ReportingStore[];
}

export interface ReportingHierarchy {
  tenant: { id: string; name: string };
  regions: ReportingRegion[];
  stores: ReportingStore[]; // Nicht zugeordnete Stores (regionId: null)
  managers: ReportingManager[];
}

// === Navigation ===

export interface NavItem {
  label: string;
  href: string;
}

// ============================================================
// Store Excellence Audit — Types
// ============================================================

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

// ============================================================
// Checklisten Tool — Types
// ============================================================

export type ChecklistItemType = 'BOOLEAN' | 'TEXT' | 'NUMBER' | 'PHOTO';
export type ChecklistSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ChecklistTemplate {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  version: number;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSection {
  id: string;
  templateId: string;
  name: string;
  sortOrder: number;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  sectionId: string;
  text: string;
  type: ChecklistItemType;
  isRequired: boolean;
  sortOrder: number;
}

export interface ChecklistSession {
  id: string;
  tenantId: string;
  storeId: string;
  templateId: string;
  conductedBy: string;
  status: ChecklistSessionStatus;
  completionRate: number;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface ChecklistEntry {
  id: string;
  sessionId: string;
  itemId: string;
  valueBool: boolean | null;
  valueText: string | null;
  valueNumber: number | null;
  photoPath: string | null;
  comment: string | null;
  answeredAt: string;
}

// ============================================================
// SOP Bibliothek Tool — Types
// ============================================================

export type SopStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface SopCategory {
  id: string;
  tenantId: string | null;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SopDocument {
  id: string;
  tenantId: string | null;
  categoryId: string;
  title: string;
  content: string;
  version: number;
  status: SopStatus;
  createdBy: string;
  attachmentPath: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SopAcknowledgment {
  id: string;
  sopId: string;
  userId: string;
  acknowledgedAt: string;
}

// ============================================================
// VM Foto-Compliance Tool — Types
// ============================================================

export type VmSubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VmGuideline {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  category: string | null;
  referencePhoto: string | null;
  isActive: boolean;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VmSubmission {
  id: string;
  tenantId: string;
  guidelineId: string;
  storeId: string;
  submittedBy: string;
  photoPath: string;
  status: VmSubmissionStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

// ============================================================
// Store Standards Tool — Types
// ============================================================

export type StandardOperator = 'GTE' | 'LTE' | 'EQ' | 'GT' | 'LT';
export type StandardEvaluationStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface StandardCategory {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface StandardDefinition {
  id: string;
  categoryId: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  targetValue: number;
  operator: StandardOperator;
  weight: number;
  isActive: boolean;
  sortOrder: number;
}

export interface StandardEvaluation {
  id: string;
  tenantId: string;
  storeId: string;
  evaluatedBy: string;
  period: string;
  overallScore: number | null;
  notes: string | null;
  status: StandardEvaluationStatus;
  evaluatedAt: string;
  completedAt: string | null;
}

export interface StandardScore {
  id: string;
  evaluationId: string;
  definitionId: string;
  actualValue: number;
  passed: boolean;
  score: number;
  comment: string | null;
}

// ============================================================
// KPI Dashboard (Pulse) — Types
// ============================================================

export interface KpiEntry {
  id: string;
  tenantId: string;
  storeId: string;
  date: string;
  revenue: number;
  transactions: number;
  footfall: number | null;
  unitsSold: number | null;
  staffHours: number | null;
  enteredBy: string;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city: string | null };
}

export interface KpiSummary {
  totalRevenue: number;
  totalTransactions: number;
  totalFootfall: number;
  avgConversion: number;
  avgUPT: number;
  storeCount: number;
}

// ============================================================
// Budget Tracker — Umsatz-Ziel-Tracking Types
// ============================================================

export type RevenuePeriodType = 'YEARLY' | 'QUARTERLY' | 'MONTHLY';
export type RevenueEntryTag = 'NORMAL' | 'AKTION' | 'EVENT';
export type RevenueEntrySource = 'MANUAL' | 'CSV';
export type RevenueChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RevenueConfig {
  id: string;
  tenantId: string;
  currency: string;
  locale: string;
  comparisonYoy: boolean;
  comparisonRank: boolean;
  retentionMonths: number;
  weekdayWeights: Record<string, number>;
}

export interface RevenuePeriod {
  id: string;
  tenantId: string;
  storeId: string;
  periodType: RevenuePeriodType;
  periodKey: string;
  parentId: string | null;
  startDate: string;
  endDate: string;
  targetAmount: number;
  status: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city: string | null };
  entries?: RevenueEntry[];
  children?: RevenuePeriod[];
  dayOverrides?: RevenueDayOverride[];
  changeRequests?: RevenueChangeRequest[];
  // Computed fields (returned by API)
  totalRevenue?: number;
  achievementPct?: number;
  remainingAmount?: number;
  daysLeft?: number;
  dailyNeeded?: number;
  forecast?: number;
}

export interface RevenueDayOverride {
  id: string;
  periodId: string;
  date: string;
  target: number;
}

export interface RevenueEntry {
  id: string;
  periodId: string;
  amount: number;
  date: string;
  time: string | null;
  comment: string | null;
  tag: string | null;
  source: string;
  enteredBy: string;
  createdAt: string;
}

export interface RevenueChangeRequest {
  id: string;
  periodId: string;
  oldTarget: number;
  newTarget: number;
  reason: string | null;
  status: RevenueChangeStatus;
  requestedBy: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  requester?: { id: string; name: string };
  reviewer?: { id: string; name: string };
}

// ============================================================
// Forecast — Types
// ============================================================

export type ForecastType = 'REVENUE' | 'TRANSACTIONS' | 'FOOTFALL';
export type ForecastMethod = 'MANUAL' | 'TREND' | 'AI';

export interface Forecast {
  id: string;
  tenantId: string;
  storeId: string;
  period: string;
  forecastType: ForecastType;
  forecastValue: number;
  actualValue: number | null;
  confidence: number | null;
  method: ForecastMethod;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city: string | null };
}

// ============================================================
// Loss Prevention — Types
// ============================================================

export type LossCategory = 'THEFT' | 'DAMAGE' | 'ADMIN_ERROR' | 'SUPPLIER' | 'OTHER';
export type LossSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LossStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export interface LossIncident {
  id: string;
  tenantId: string;
  storeId: string;
  incidentDate: string;
  category: LossCategory;
  amount: number;
  description: string;
  severity: LossSeverity;
  status: LossStatus;
  resolution: string | null;
  reportedBy: string;
  assignedTo: string | null;
  photoPath: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city: string | null };
}

// ============================================================
// Inventory — Types
// ============================================================

export type InventoryCountType = 'FULL' | 'PARTIAL' | 'CYCLE';
export type InventoryCountStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface InventoryCount {
  id: string;
  tenantId: string;
  storeId: string;
  countDate: string;
  countType: InventoryCountType;
  status: InventoryCountStatus;
  totalItems: number;
  countedItems: number;
  discrepancies: number;
  totalValue: number;
  notes: string | null;
  conductedBy: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city: string | null };
  items?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  countId: string;
  sku: string;
  productName: string;
  category: string | null;
  expectedQty: number;
  actualQty: number;
  unitPrice: number;
  discrepancy: number;
  discrepancyValue: number;
  notes: string | null;
  countedAt: string | null;
}

// ============================================================
// Live Floor — Types
// ============================================================

export type FloorStaffStatus = 'ON_FLOOR' | 'ON_BREAK' | 'OFF_FLOOR' | 'CASHIER';

export interface FloorZone {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string };
  _count?: { positions: number };
}

export interface FloorStaffPosition {
  id: string;
  tenantId: string;
  storeId: string;
  zoneId: string | null;
  userId: string;
  userName: string;
  status: FloorStaffStatus;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  zone?: { id: string; name: string } | null;
  store?: { id: string; name: string };
}

// ============================================================
// FR Tracking — Types
// ============================================================

export interface FootfallEntry {
  id: string;
  tenantId: string;
  storeId: string;
  date: string;
  hour: number | null;
  footfall: number;
  revenue: number | null;
  transactions: number | null;
  conversionRate: number | null;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city: string | null };
}

export interface FootfallSummary {
  totalFootfall: number;
  totalRevenue: number;
  totalTransactions: number;
  avgConversion: number;
  dayCount: number;
}

// ============================================================
// VM Guidelines — Types
// ============================================================

export type VmGuidelineDocStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface VmGuidelineDoc {
  id: string;
  tenantId: string;
  title: string;
  category: string | null;
  content: string;
  version: number;
  status: VmGuidelineDocStatus;
  effectiveFrom: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  images?: VmGuidelineImage[];
  _count?: { images: number };
}

export interface VmGuidelineImage {
  id: string;
  guidelineDocId: string;
  imagePath: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

// ============================================================
// Maintenance — Types
// ============================================================

export type MaintenanceCategory = 'ELECTRICAL' | 'PLUMBING' | 'HVAC' | 'FIXTURE' | 'IT' | 'OTHER';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  storeId: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportedBy: string;
  assignedTo: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  photoPath: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city: string | null };
}

// ============================================================
// Training Hub / LMS — Types
// ============================================================

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type EnrollmentProgressStatus = 'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Course {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  category: string | null;
  durationMinutes: number;
  isRequired: boolean;
  status: CourseStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  modules?: CourseModule[];
  enrollments?: CourseEnrollment[];
  _count?: { modules: number; enrollments: number };
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  content: string | null;
  sortOrder: number;
  durationMinutes: number;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  storeId: string;
  status: EnrollmentProgressStatus;
  progress: number;
  completedAt: string | null;
  certificateId: string | null;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; title: string };
  user?: { id: string; name: string };
  store?: { id: string; name: string };
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  userId: string;
  courseName: string;
  issuedAt: string;
  expiresAt: string | null;
}

// ============================================================
// Training Hours — Types
// ============================================================

export type TrainingCategory = 'PRODUCT' | 'SALES' | 'SERVICE' | 'COMPLIANCE' | 'ONBOARDING' | 'OTHER';

export interface TrainingLog {
  id: string;
  tenantId: string;
  storeId: string;
  userId: string;
  date: string;
  durationMinutes: number;
  category: TrainingCategory;
  topic: string | null;
  notes: string | null;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
  store?: { id: string; name: string };
}

// ============================================================
// Challenges — Gamification & Wettbewerbe Types
// ============================================================

export type ChallengeScope = 'INDIVIDUAL' | 'TEAM';
export type ChallengeScoringType = 'ABSOLUTE' | 'RELATIVE' | 'POINTS';
export type ChallengeStatus = 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'EVALUATION' | 'PUBLISHED' | 'ARCHIVED';
export type ChallengeVisibility = 'PUBLIC' | 'PRIVATE' | 'TOP_N';
export type ChallengeParticipationType = 'AUTO' | 'INVITE' | 'OPTIN';

export interface ChallengeTemplate {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  scope: ChallengeScope;
  scoringType: ChallengeScoringType;
  metric: string | null;
  targetValue: number | null;
  rules: string | null;
  fairnessNote: string | null;
  tags: string | null;
  durationDays: number | null;
  reward: string | null;
  badgeName: string | null;
  createdAt: string;
}

export interface Challenge {
  id: string;
  tenantId: string;
  templateId: string | null;
  title: string;
  description: string | null;
  scope: ChallengeScope;
  scoringType: ChallengeScoringType;
  metric: string | null;
  targetValue: number | null;
  rules: string | null;
  fairnessNote: string | null;
  tags: string | null;
  startDate: string;
  endDate: string;
  reward: string | null;
  badgeName: string | null;
  status: ChallengeStatus;
  visibility: ChallengeVisibility;
  visibleTopN: number | null;
  participationType: ChallengeParticipationType;
  storeIds: string | null;
  regionId: string | null;
  isRecurring: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants?: ChallengeParticipant[];
  entries?: ChallengeEntry[];
  _count?: { participants: number; entries: number };
  // Computed
  daysLeft?: number;
  totalParticipants?: number;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string | null;
  storeId: string | null;
  teamName: string | null;
  currentValue: number;
  handicap: number;
  rank: number | null;
  accepted: boolean;
  completedAt: string | null;
  user?: { id: string; name: string };
  store?: { id: string; name: string } | null;
  entries?: ChallengeEntry[];
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  participantId: string;
  value: number;
  note: string | null;
  enteredBy: string;
  createdAt: string;
}

// ============================================================
// Onboarding — Types
// ============================================================

export type OnboardingJourneyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type OnboardingProgressStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface OnboardingTemplate {
  id: string;
  tenantId: string;
  name: string;
  role: string | null;
  durationDays: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: OnboardingStep[];
  _count?: { steps: number; journeys: number };
}

export interface OnboardingStep {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  category: string | null;
  dayNumber: number;
  sortOrder: number;
  isRequired: boolean;
}

export interface OnboardingJourney {
  id: string;
  templateId: string;
  tenantId: string;
  storeId: string;
  userId: string;
  mentorId: string | null;
  startDate: string;
  status: OnboardingJourneyStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template?: { id: string; name: string };
  user?: { id: string; name: string };
  mentor?: { id: string; name: string } | null;
  store?: { id: string; name: string };
  progress?: OnboardingProgress[];
}

export interface OnboardingProgress {
  id: string;
  journeyId: string;
  stepId: string;
  status: OnboardingProgressStatus;
  completedAt: string | null;
  notes: string | null;
  verifiedBy: string | null;
  step?: OnboardingStep;
}

// ============================================================
// Coaching — 1:1 Coaching — Types
// ============================================================

export type CoachingSessionType = 'ONE_ON_ONE' | 'FLOOR' | 'GROUP';
export type CoachingSessionStatus = 'PLANNED' | 'SELF_ASSESSMENT' | 'PREPARATION' | 'IN_PROGRESS' | 'DOCUMENTATION' | 'CONFIRMATION' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED' | 'NO_SHOW';
export type CoachingActionItemStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type CoachingActionItemPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type CoachingTemplateSectionType = 'RATING' | 'TEXT' | 'CHECKBOX' | 'COMPETENCY';

export interface CoachingSession {
  id: string;
  tenantId: string;
  storeId: string;
  coachId: string;
  coacheeId: string;
  templateId: string | null;
  scheduledAt: string;
  completedAt: string | null;
  duration: number;
  type: CoachingSessionType;
  status: CoachingSessionStatus;
  title: string | null;
  location: string | null;
  notes: string | null;
  privateNotes: string | null;
  selfAssessmentNotes: string | null;
  managerSummary: string | null;
  coacheeConfirmation: boolean;
  coacheeComment: string | null;
  mood: number | null;
  overallRating: number | null;
  followUpDate: string | null;
  cancelCount: number;
  escalated: boolean;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string };
  coach?: { id: string; name: string };
  coachee?: { id: string; name: string };
  template?: CoachingTemplate;
  sections?: CoachingSessionSection[];
  actionItems?: CoachingActionItem[];
  feedback?: CoachingFeedback[];
}

export interface CoachingTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: CoachingSessionType;
  isDefault: boolean;
  isActive: boolean;
  ratingScale: number;
  ratingLabels: string | null;
  defaultDuration: number;
  defaultGoals: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  sections?: CoachingTemplateSection[];
}

export interface CoachingTemplateSection {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  type: CoachingTemplateSectionType;
  competencies: string | null;
  weight: number;
  sortOrder: number;
  isRequired: boolean;
  createdAt: string;
}

export interface CoachingSessionSection {
  id: string;
  sessionId: string;
  templateSectionId: string | null;
  title: string;
  type: string;
  managerRating: number | null;
  selfRating: number | null;
  managerComment: string | null;
  selfComment: string | null;
  checkboxValue: boolean | null;
  textValue: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoachingActionItem {
  id: string;
  sessionId: string;
  tenantId: string;
  title: string;
  description: string | null;
  assigneeId: string;
  status: CoachingActionItemStatus;
  priority: CoachingActionItemPriority;
  dueDate: string | null;
  completedAt: string | null;
  linkedPlanId: string | null;
  linkedCourseId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoachingFeedback {
  id: string;
  sessionId: string;
  rating: number;
  comment: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

export interface CoachingSettings {
  id: string;
  tenantId: string;
  ratingScale: number;
  ratingLabels: string | null;
  defaultFrequencyDays: number;
  escalationThreshold: number;
  reminderDaysBefore: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// PDP / PIP — Types
// ============================================================

export type DevelopmentPlanType = 'PDP' | 'PIP';
export type DevelopmentPlanStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type DevelopmentGoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface DevelopmentPlan {
  id: string;
  tenantId: string;
  storeId: string | null;
  userId: string;
  managerId: string;
  type: DevelopmentPlanType;
  title: string;
  status: DevelopmentPlanStatus;
  startDate: string;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
  manager?: { id: string; name: string };
  store?: { id: string; name: string } | null;
  goals?: DevelopmentGoal[];
  reviews?: DevelopmentReview[];
}

export interface DevelopmentGoal {
  id: string;
  planId: string;
  title: string;
  measureOfSuccess: string | null;
  targetDate: string | null;
  status: DevelopmentGoalStatus;
  progress: number;
}

export interface DevelopmentReview {
  id: string;
  planId: string;
  reviewedBy: string;
  reviewDate: string;
  overallProgress: number;
  comments: string | null;
  reviewer?: { id: string; name: string };
}

// ============================================================
// Appraisals — Types
// ============================================================

export type AppraisalCycleStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';
export type AppraisalStatus = 'OPEN' | 'SELF_ASSESSMENT' | 'MANAGER_REVIEW' | 'RELEASED' | 'CONFIRMED' | 'ARCHIVED';
export type AppraisalGoalStatus = 'OPEN' | 'IN_PROGRESS' | 'ACHIEVED' | 'MISSED';

export interface AppraisalTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  ratingScale: number;
  ratingLabels: string | null; // JSON string array
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: AppraisalTemplateCategory[];
  defaultGoals?: AppraisalTemplateGoal[];
  _count?: { cycles: number };
}

export interface AppraisalTemplateCategory {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  weight: number;
  sortOrder: number;
}

export interface AppraisalTemplateGoal {
  id: string;
  templateId: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

export interface AppraisalCycle {
  id: string;
  tenantId: string;
  templateId: string | null;
  name: string;
  period: string | null;
  startDate: string;
  endDate: string;
  status: AppraisalCycleStatus;
  retentionMonths: number;
  createdAt: string;
  updatedAt: string;
  template?: { id: string; name: string } | null;
  categories?: AppraisalCycleCategory[];
  _count?: { appraisals: number };
}

export interface AppraisalCycleCategory {
  id: string;
  cycleId: string;
  name: string;
  description: string | null;
  weight: number;
  sortOrder: number;
}

export interface Appraisal {
  id: string;
  cycleId: string;
  storeId: string | null;
  employeeId: string;
  managerId: string;
  status: AppraisalStatus;
  weightedScore: number | null;
  strengths: string | null;
  improvements: string | null;
  meetingNotes: string | null;
  employeeComment: string | null;
  managerSummary: string | null;
  releasedAt: string | null;
  confirmedAt: string | null;
  archivedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  cycle?: { id: string; name: string };
  store?: { id: string; name: string } | null;
  employee?: { id: string; name: string };
  manager?: { id: string; name: string };
  ratings?: AppraisalRating[];
  goals?: AppraisalGoal[];
}

export interface AppraisalRating {
  id: string;
  appraisalId: string;
  categoryId: string;
  selfRating: number | null;
  managerRating: number | null;
  selfComment: string | null;
  managerComment: string | null;
  category?: AppraisalCycleCategory;
}

export interface AppraisalGoal {
  id: string;
  appraisalId: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  status: AppraisalGoalStatus;
  sortOrder: number;
}

export interface AppraisalCalibrationNote {
  id: string;
  cycleId: string;
  fromUserId: string;
  toUserId: string;
  storeId: string | null;
  message: string;
  createdAt: string;
  fromUser?: { id: string; name: string };
  toUser?: { id: string; name: string };
}

// ============================================================
// Shift Planning — Types
// ============================================================

export type ShiftEntryStatus = 'PLANNED' | 'CONFIRMED' | 'SWAPPED' | 'CANCELLED';
export type ShiftSwapStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ShiftTemplate {
  id: string;
  storeId: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  minStaff: number;
  role: string | null;
}

export interface ShiftEntry {
  id: string;
  storeId: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string | null;
  status: ShiftEntryStatus;
  createdBy: string | null;
  user?: { id: string; name: string };
  store?: { id: string; name: string };
}

export interface ShiftSwapRequest {
  id: string;
  shiftEntryId: string;
  requestedBy: string;
  swapWithUserId: string | null;
  status: ShiftSwapStatus;
  approvedBy: string | null;
  requester?: { id: string; name: string };
}

// ============================================================
// Pulse Survey — Types
// ============================================================

export type PulseSurveyStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type PulseQuestionType = 'RATING' | 'TEXT' | 'CHOICE';

export interface PulseSurvey {
  id: string;
  tenantId: string;
  title: string;
  status: PulseSurveyStatus;
  startDate: string | null;
  endDate: string | null;
  isAnonymous: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  questions?: PulseQuestion[];
  _count?: { questions: number; responses: number };
}

export interface PulseQuestion {
  id: string;
  surveyId: string;
  text: string;
  type: PulseQuestionType;
  options: string | null;
  sortOrder: number;
}

export interface PulseResponse {
  id: string;
  surveyId: string;
  storeId: string | null;
  respondentId: string | null;
  submittedAt: string;
  answers?: PulseAnswer[];
}

export interface PulseAnswer {
  id: string;
  responseId: string;
  questionId: string;
  valueRating: number | null;
  valueText: string | null;
  valueChoice: string | null;
}

// ============================================================
// Wellbeing — Types
// ============================================================

export interface WellbeingCheckIn {
  id: string;
  tenantId: string;
  storeId: string | null;
  userId: string | null;
  date: string;
  moodScore: number;
  energyLevel: number;
  stressLevel: number;
  workloadRating: number;
  notes: string | null;
  isAnonymous: boolean;
  createdAt: string;
  user?: { id: string; name: string } | null;
  store?: { id: string; name: string } | null;
}

export interface WellbeingResource {
  id: string;
  tenantId: string;
  title: string;
  category: string | null;
  description: string | null;
  url: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Kat.6: Kommunikation & Signal ─────────────────────

export type BriefingScope = 'STORE' | 'COMPANY';
export type BriefingPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type BriefingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface BriefingTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sections?: BriefingTemplateSection[];
  createdAt: string;
  updatedAt: string;
}

export interface BriefingTemplateSection {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  placeholder: string | null;
  isRequired: boolean;
  sortOrder: number;
}

export interface Briefing {
  id: string;
  tenantId: string;
  storeId: string | null;
  store?: { id: string; name: string } | null;
  templateId: string | null;
  template?: BriefingTemplate | null;
  scope: BriefingScope;
  title: string;
  content: string;
  priority: BriefingPriority;
  status: BriefingStatus;
  targetRoles: string | null;
  targetRegionId: string | null;
  createdBy: string;
  creator?: { id: string; name: string };
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
  updatedContentAt: string | null;
  sections?: BriefingSection[];
  attachments?: BriefingAttachment[];
  tasks?: BriefingTask[];
  acknowledgments?: BriefingAcknowledgment[];
  questions?: BriefingQuestion[];
  _count?: { acknowledgments: number };
  createdAt: string;
  updatedAt: string;
}

export interface BriefingSection {
  id: string;
  briefingId: string;
  name: string;
  content: string;
  sortOrder: number;
}

export interface BriefingAttachment {
  id: string;
  briefingId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  linkPreview: string | null;
  sortOrder: number;
}

export interface BriefingTask {
  id: string;
  briefingId: string;
  title: string;
  isCompleted: boolean;
  completedBy: string | null;
  completedAt: string | null;
  completer?: { id: string; name: string } | null;
  sortOrder: number;
}

export interface BriefingAcknowledgment {
  id: string;
  briefingId: string;
  userId: string;
  user?: { id: string; name: string };
  readAt: string;
}

export interface BriefingQuestion {
  id: string;
  briefingId: string;
  askerId: string;
  asker?: { id: string; name: string };
  question: string;
  answer: string | null;
  answeredBy: string | null;
  answerer?: { id: string; name: string } | null;
  answeredAt: string | null;
  createdAt: string;
}

export type HandoverStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
export type MessagePriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type MessageTargetType = 'ALL' | 'STORE' | 'ROLE';
export type NewsletterStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export interface Handover { id: string; storeId: string; fromUserId: string; toUserId: string | null; shiftDate: string; shiftType: string | null; status: HandoverStatus; salesUpdate: string | null; openTasks: string | null; incidents: string | null; customerNotes: string | null; stockNotes: string | null; generalNotes: string | null; }
export interface TeamMessage { id: string; tenantId: string; title: string; body: string; priority: MessagePriority; targetType: MessageTargetType; targetStoreIds: string | null; sentBy: string; }
export interface TeamMessageRead { id: string; messageId: string; userId: string; readAt: string; }
export interface Newsletter { id: string; tenantId: string; title: string; content: string | null; coverImagePath: string | null; status: NewsletterStatus; publishedAt: string | null; createdBy: string; }
export interface NewsletterSection { id: string; newsletterId: string; title: string; content: string; sortOrder: number; }
export interface NewsletterView { id: string; newsletterId: string; userId: string; viewedAt: string; }

// ── Kat.7: Customer, Clienteling & Stock ──────────────

export type ClientInteractionType = 'VISIT' | 'CALL' | 'EMAIL' | 'EVENT' | 'PURCHASE' | 'COMPLAINT' | 'RETURN';
export type ClientTaskStatus = 'OPEN' | 'DONE' | 'CANCELLED';
export type ClientTaskType = 'MANUAL' | 'AUTO';
export type ClientTaskPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type ClientNoteType = 'GENERAL' | 'CONSULTATION' | 'COMPLAINT' | 'WISH';
export type ClientOccasionType = 'BIRTHDAY' | 'ANNIVERSARY' | 'CUSTOM';
export type ClientPreferredChannel = 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'SMS';
export type CrmHistoryMode = 'CLIENT' | 'STORE';
export type StockCalloutUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type StockCalloutStatus = 'OPEN' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
export type OrderStatus = 'ORDERED' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

export interface ConversionGoal { id: string; storeId: string; period: string; targetConversion: number | null; targetAvgBasket: number | null; }
export interface ClientProfile { id: string; storeId: string; firstName: string; lastName: string; email: string | null; phone: string | null; dateOfBirth: string | null; gender: string | null; address: string | null; company: string | null; preferences: string | null; preferredChannel: string | null; wishlist: string | null; tags: string | null; vipLevel: string | null; totalPurchases: number; totalRevenue: number; avgBasket: number; visitCount: number; lastVisit: string | null; activityScore: number; primaryAdvisorId: string | null; consentProfile: boolean; consentMarketing: boolean; consentBirthday: boolean; selfRegistered: boolean; customFields: string | null; isArchived: boolean; archivedAt: string | null; createdBy: string; }
export interface ClientInteraction { id: string; clientId: string; userId: string; type: ClientInteractionType; date: string; notes: string | null; purchaseAmount: number | null; items: string | null; category: string | null; paymentMethod: string | null; }
export interface ClientTask { id: string; clientId: string; userId: string; title: string; description: string | null; type: ClientTaskType; priority: ClientTaskPriority; dueDate: string | null; status: ClientTaskStatus; completedAt: string | null; }
export interface ClientNote { id: string; clientId: string; userId: string; content: string; type: ClientNoteType; isPinned: boolean; mentionedUserIds: string | null; parentInteractionId: string | null; }
export interface ClientOccasion { id: string; clientId: string; type: ClientOccasionType; title: string; date: string; reminderDays: number; isRecurring: boolean; }
export interface ClientSegment { id: string; storeId: string | null; tenantId: string; name: string; filters: string; createdBy: string; }
export interface CrmSettings { id: string; storeId: string; selfRegistrationEnabled: boolean; selfRegistrationToken: string | null; vipTiers: string | null; autoArchiveDays: number | null; historyMode: CrmHistoryMode; }
export interface StockCallout { id: string; storeId: string; sku: string; productName: string; currentStock: number; reorderPoint: number; requestedQty: number; urgency: StockCalloutUrgency; status: StockCalloutStatus; reportedBy: string; }
export interface CustomerOrder { id: string; storeId: string; orderNumber: string; customerName: string; customerEmail: string | null; status: OrderStatus; trackingNumber: string | null; carrier: string | null; estimatedDelivery: string | null; createdBy: string; }
export interface OrderStatusUpdate { id: string; orderId: string; status: string; updatedBy: string; notes: string | null; }
