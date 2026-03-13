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
// Budget Tracker — Types
// ============================================================

export type BudgetType = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type BudgetCategory = 'REVENUE' | 'COGS' | 'LABOR' | 'RENT' | 'MARKETING' | 'OTHER';

export interface BudgetPeriod {
  id: string;
  tenantId: string;
  storeId: string;
  period: string;
  budgetType: BudgetType;
  revenue: number;
  cogs: number;
  labor: number;
  rent: number;
  marketing: number;
  other: number;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city: string | null };
  actuals?: BudgetActual[];
}

export interface BudgetActual {
  id: string;
  budgetPeriodId: string;
  category: BudgetCategory;
  actualAmount: number;
  date: string;
  description: string | null;
  enteredBy: string;
  createdAt: string;
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
// Challenges — Types
// ============================================================

export type ChallengeType = 'INDIVIDUAL' | 'TEAM' | 'STORE';
export type ChallengeStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface Challenge {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: ChallengeType;
  metric: string | null;
  targetValue: number | null;
  startDate: string;
  endDate: string;
  reward: string | null;
  status: ChallengeStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participants?: ChallengeParticipant[];
  _count?: { participants: number };
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  storeId: string | null;
  currentValue: number;
  rank: number | null;
  completedAt: string | null;
  user?: { id: string; name: string };
  store?: { id: string; name: string } | null;
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

export type CoachingSessionType = 'REGULAR' | 'AD_HOC' | 'FOLLOW_UP';
export type CoachingSessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface CoachingSession {
  id: string;
  tenantId: string;
  storeId: string;
  coachId: string;
  coacheeId: string;
  scheduledAt: string;
  duration: number;
  type: CoachingSessionType;
  status: CoachingSessionStatus;
  notes: string | null;
  actionItems: string | null;
  mood: number | null;
  followUpDate: string | null;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string };
  coach?: { id: string; name: string };
  coachee?: { id: string; name: string };
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
export type AppraisalStatus = 'PENDING' | 'SELF_REVIEW' | 'MANAGER_REVIEW' | 'COMPLETED';

export interface AppraisalCycle {
  id: string;
  tenantId: string;
  name: string;
  period: string | null;
  startDate: string;
  endDate: string;
  status: AppraisalCycleStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { appraisals: number };
}

export interface Appraisal {
  id: string;
  cycleId: string;
  storeId: string | null;
  employeeId: string;
  managerId: string;
  status: AppraisalStatus;
  selfRating: number | null;
  managerRating: number | null;
  overallRating: number | null;
  strengths: string | null;
  improvements: string | null;
  goals: string | null;
  meetingNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  cycle?: { id: string; name: string };
  store?: { id: string; name: string } | null;
  employee?: { id: string; name: string };
  manager?: { id: string; name: string };
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

export type BriefingType = 'MORNING' | 'EVENING' | 'SPECIAL';
export type HandoverStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';
export type MessagePriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type MessageTargetType = 'ALL' | 'STORE' | 'ROLE';
export type NewsletterStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Briefing { id: string; storeId: string; title: string; content: string; date: string; type: BriefingType; createdBy: string; publishedAt: string | null; }
export interface BriefingAcknowledgment { id: string; briefingId: string; userId: string; readAt: string; }
export interface Handover { id: string; storeId: string; fromUserId: string; toUserId: string | null; shiftDate: string; shiftType: string | null; status: HandoverStatus; salesUpdate: string | null; openTasks: string | null; incidents: string | null; customerNotes: string | null; stockNotes: string | null; generalNotes: string | null; }
export interface TeamMessage { id: string; tenantId: string; title: string; body: string; priority: MessagePriority; targetType: MessageTargetType; targetStoreIds: string | null; sentBy: string; }
export interface TeamMessageRead { id: string; messageId: string; userId: string; readAt: string; }
export interface Newsletter { id: string; tenantId: string; title: string; content: string | null; coverImagePath: string | null; status: NewsletterStatus; publishedAt: string | null; createdBy: string; }
export interface NewsletterSection { id: string; newsletterId: string; title: string; content: string; sortOrder: number; }
export interface NewsletterView { id: string; newsletterId: string; userId: string; viewedAt: string; }

// ── Kat.7: Customer, Clienteling & Stock ──────────────

export type ClientInteractionType = 'VISIT' | 'CALL' | 'EMAIL' | 'EVENT';
export type ClientTaskStatus = 'OPEN' | 'DONE' | 'CANCELLED';
export type StockCalloutUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type StockCalloutStatus = 'OPEN' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
export type OrderStatus = 'ORDERED' | 'SHIPPED' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

export interface ConversionGoal { id: string; storeId: string; period: string; targetConversion: number | null; targetAvgBasket: number | null; }
export interface ClientProfile { id: string; storeId: string; firstName: string; lastName: string; email: string | null; phone: string | null; preferences: string | null; vipLevel: string | null; totalPurchases: number; lastVisit: string | null; createdBy: string; }
export interface ClientInteraction { id: string; clientId: string; userId: string; type: ClientInteractionType; date: string; notes: string | null; purchaseAmount: number | null; }
export interface ClientTask { id: string; clientId: string; userId: string; title: string; dueDate: string | null; status: ClientTaskStatus; }
export interface StockCallout { id: string; storeId: string; sku: string; productName: string; currentStock: number; reorderPoint: number; requestedQty: number; urgency: StockCalloutUrgency; status: StockCalloutStatus; reportedBy: string; }
export interface CustomerOrder { id: string; storeId: string; orderNumber: string; customerName: string; customerEmail: string | null; status: OrderStatus; trackingNumber: string | null; carrier: string | null; estimatedDelivery: string | null; createdBy: string; }
export interface OrderStatusUpdate { id: string; orderId: string; status: string; updatedBy: string; notes: string | null; }
