import { z } from 'zod';

// === Website Forms ===

export const auditRequestSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  company: z.string().min(2, 'Unternehmen muss mindestens 2 Zeichen haben').max(100),
  storeCount: z.string().min(1, 'Bitte Store-Anzahl angeben'),
  challenge: z.string().min(10, 'Bitte beschreiben Sie Ihre Herausforderung (min. 10 Zeichen)').max(1000),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  company: z.string().max(100).optional(),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen haben').max(2000),
});

// === Auth ===

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// === Courses (Train) — Legacy ===

export const legacyCourseCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  estimatedMins: z.number().int().min(1).max(600).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const moduleCreateSchema = z.object({
  title: z.string().min(2).max(100),
  order: z.number().int().min(0),
});

export const lessonCreateSchema = z.object({
  title: z.string().min(2).max(100),
  type: z.enum(['VIDEO', 'TEXT', 'QUIZ', 'CHECKLIST']),
  content: z.record(z.unknown()),
  order: z.number().int().min(0),
  durationMins: z.number().int().min(1).max(120).optional(),
});

// === KPI (Pulse) ===

export const kpiEntrySchema = z.object({
  storeId: z.string().cuid(),
  date: z.string().date(),
  revenue: z.number().min(0),
  transactions: z.number().int().min(0),
  footfall: z.number().int().min(0).optional(),
  unitsSold: z.number().int().min(0).optional(),
  staffHours: z.number().min(0).optional(),
});

// === Tenant Management (Dashboard) ===

export const tenantCreateSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  slug: z
    .string()
    .min(2, 'Slug muss mindestens 2 Zeichen haben')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'),
  contactEmail: z.string().email('Bitte gültige E-Mail-Adresse eingeben').optional().or(z.literal('')),
  contactName: z.string().max(100).optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional().or(z.literal('')),
  maxUsers: z.number().int().min(1).max(10000).optional(),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

// === Region Management ===

export const regionCreateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  sortOrder: z.number().int().min(0).optional(),
});

export const regionUpdateSchema = regionCreateSchema.omit({ tenantId: true }).partial();

export const regionStoreAssignSchema = z.object({
  storeIds: z.array(z.string().min(1)),
});

// === Store Management ===

export const storeCreateSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  city: z.string().max(100).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  regionId: z.string().min(1).optional().or(z.literal('')),
});

export const storeUpdateSchema = storeCreateSchema.omit({ tenantId: true }).partial();

export const storeToolAssignSchema = z.object({
  storeId: z.string().min(1),
  toolId: z.string().min(1),
});

// === User Management ===

const userRoleEnum = z.enum([
  'kore_admin',
  'tenant_admin',
  'regional_manager',
  'multisite_manager',
  'store_manager',
  'learner',
]);

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  email: z.string().email('Bitte gültige E-Mail-Adresse eingeben'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  role: userRoleEnum,
  tenantId: z.string().min(1).optional(), // Required für alle außer kore_admin
  storeIds: z.array(z.string().min(1)).optional(),
  regionIds: z.array(z.string().min(1)).optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: userRoleEnum.optional(),
  isActive: z.boolean().optional(),
  storeIds: z.array(z.string().min(1)).optional(),
  regionIds: z.array(z.string().min(1)).optional(),
});

export const userStoreAssignSchema = z.object({
  storeIds: z.array(z.string().min(1)),
});

export const userRegionAssignSchema = z.object({
  regionIds: z.array(z.string().min(1)),
});

export const storeUserAssignSchema = z.object({
  userIds: z.array(z.string().min(1)),
});

// ============================================================
// Store Excellence Audit — Validators
// ============================================================

export const auditCriterionSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
  photoRequired: z.boolean().optional(),
});

export const auditCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  weight: z.number().min(0).max(100).optional(),
  criteria: z.array(auditCriterionSchema).optional(),
});

export const auditTemplateCreateSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben').max(100),
  description: z.string().max(500).optional(),
  categories: z.array(auditCategorySchema).optional(),
});

export const auditTemplateUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const auditSessionCreateSchema = z.object({
  storeId: z.string().min(1, 'Store muss ausgewählt werden'),
  templateId: z.string().min(1, 'Template muss ausgewählt werden'),
  storeLocation: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const auditResponseSchema = z.object({
  scorePercent: z.number().int().min(0).max(100).optional().nullable(),
  passed: z.boolean().optional().nullable(),
  comment: z.string().max(1000).optional().nullable(),
});

// === Type Exports ===

export type AuditRequestInput = z.infer<typeof auditRequestSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LegacyCourseCreateInput = z.infer<typeof legacyCourseCreateSchema>;
export type KPIEntryInput = z.infer<typeof kpiEntrySchema>;
export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
export type RegionCreateInput = z.infer<typeof regionCreateSchema>;
export type RegionUpdateInput = z.infer<typeof regionUpdateSchema>;
export type RegionStoreAssignInput = z.infer<typeof regionStoreAssignSchema>;
export type StoreCreateInput = z.infer<typeof storeCreateSchema>;
export type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;
export type StoreToolAssignInput = z.infer<typeof storeToolAssignSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserStoreAssignInput = z.infer<typeof userStoreAssignSchema>;
export type StoreUserAssignInput = z.infer<typeof storeUserAssignSchema>;
export type AuditTemplateCreateInput = z.infer<typeof auditTemplateCreateSchema>;
export type AuditTemplateUpdateInput = z.infer<typeof auditTemplateUpdateSchema>;
export type AuditSessionCreateInput = z.infer<typeof auditSessionCreateSchema>;
export type AuditResponseInput = z.infer<typeof auditResponseSchema>;

// ============================================================
// Checklisten Tool — Validators
// ============================================================

export const checklistTemplateCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  sections: z.array(z.object({
    name: z.string().min(1).max(100),
    sortOrder: z.number().int().min(0).default(0),
    items: z.array(z.object({
      text: z.string().min(1).max(500),
      type: z.enum(['BOOLEAN', 'TEXT', 'NUMBER', 'PHOTO']).default('BOOLEAN'),
      isRequired: z.boolean().default(false),
      sortOrder: z.number().int().min(0).default(0),
    })),
  })).min(1),
});

export const checklistTemplateUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const checklistSessionCreateSchema = z.object({
  storeId: z.string().min(1),
  templateId: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

export const checklistEntrySchema = z.object({
  valueBool: z.boolean().nullable().optional(),
  valueText: z.string().max(2000).nullable().optional(),
  valueNumber: z.number().nullable().optional(),
  comment: z.string().max(1000).nullable().optional(),
});

// ============================================================
// SOP Bibliothek — Validators
// ============================================================

export const sopCategoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).default(0),
});

export const sopCreateSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(2).max(200),
  content: z.string().min(1),
});

export const sopUpdateSchema = z.object({
  categoryId: z.string().min(1).optional(),
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(1).optional(),
});

// === Type Exports (Checklisten + SOP) ===

export type ChecklistTemplateCreateInput = z.infer<typeof checklistTemplateCreateSchema>;
export type ChecklistTemplateUpdateInput = z.infer<typeof checklistTemplateUpdateSchema>;
export type ChecklistSessionCreateInput = z.infer<typeof checklistSessionCreateSchema>;
export type ChecklistEntryInput = z.infer<typeof checklistEntrySchema>;
export type SopCategoryCreateInput = z.infer<typeof sopCategoryCreateSchema>;
export type SopCreateInput = z.infer<typeof sopCreateSchema>;
export type SopUpdateInput = z.infer<typeof sopUpdateSchema>;

// ============================================================
// VM Foto-Compliance — Validators
// ============================================================

export const vmGuidelineCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
});

export const vmGuidelineUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const vmSubmissionCreateSchema = z.object({
  guidelineId: z.string().min(1),
  storeId: z.string().min(1),
});

export const vmReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().max(1000).optional(),
});

// ============================================================
// Store Standards — Validators
// ============================================================

export const standardCategoryCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const standardCategoryUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const standardDefinitionCreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2).max(200),
  description: z.string().max(500).optional(),
  unit: z.string().max(20).optional(),
  targetValue: z.number(),
  operator: z.enum(['GTE', 'LTE', 'EQ', 'GT', 'LT']).default('GTE'),
  weight: z.number().min(0).default(1),
  sortOrder: z.number().int().min(0).default(0),
});

export const standardDefinitionUpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(500).optional(),
  unit: z.string().max(20).optional(),
  targetValue: z.number().optional(),
  operator: z.enum(['GTE', 'LTE', 'EQ', 'GT', 'LT']).optional(),
  weight: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const standardEvaluationCreateSchema = z.object({
  storeId: z.string().min(1),
  period: z.string().min(1).max(20),
  notes: z.string().max(2000).optional(),
});

export const standardScoreSchema = z.object({
  actualValue: z.number(),
  comment: z.string().max(1000).optional(),
});

// === Type Exports (VM + Standards) ===

export type VmGuidelineCreateInput = z.infer<typeof vmGuidelineCreateSchema>;
export type VmGuidelineUpdateInput = z.infer<typeof vmGuidelineUpdateSchema>;
export type VmSubmissionCreateInput = z.infer<typeof vmSubmissionCreateSchema>;
export type VmReviewInput = z.infer<typeof vmReviewSchema>;
export type StandardCategoryCreateInput = z.infer<typeof standardCategoryCreateSchema>;
export type StandardCategoryUpdateInput = z.infer<typeof standardCategoryUpdateSchema>;
export type StandardDefinitionCreateInput = z.infer<typeof standardDefinitionCreateSchema>;
export type StandardDefinitionUpdateInput = z.infer<typeof standardDefinitionUpdateSchema>;
export type StandardEvaluationCreateInput = z.infer<typeof standardEvaluationCreateSchema>;
export type StandardScoreInput = z.infer<typeof standardScoreSchema>;

// ============================================================
// KPI Dashboard (Pulse) — Validators
// ============================================================

export const kpiEntryUpsertSchema = z.object({
  storeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  revenue: z.number().min(0),
  transactions: z.number().int().min(0),
  footfall: z.number().int().min(0).optional(),
  unitsSold: z.number().int().min(0).optional(),
  staffHours: z.number().min(0).optional(),
});

// ============================================================
// Budget Tracker — Validators
// ============================================================

export const budgetPeriodCreateSchema = z.object({
  storeId: z.string().min(1),
  period: z.string().min(1).max(20),
  budgetType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  revenue: z.number().min(0).default(0),
  cogs: z.number().min(0).default(0),
  labor: z.number().min(0).default(0),
  rent: z.number().min(0).default(0),
  marketing: z.number().min(0).default(0),
  other: z.number().min(0).default(0),
  notes: z.string().max(2000).optional(),
});

export const budgetPeriodUpdateSchema = budgetPeriodCreateSchema.omit({ storeId: true, period: true, budgetType: true }).partial();

export const budgetActualCreateSchema = z.object({
  category: z.enum(['REVENUE', 'COGS', 'LABOR', 'RENT', 'MARKETING', 'OTHER']),
  actualAmount: z.number(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(500).optional(),
});

// ============================================================
// Forecast — Validators
// ============================================================

export const forecastCreateSchema = z.object({
  storeId: z.string().min(1),
  period: z.string().min(1).max(20),
  forecastType: z.enum(['REVENUE', 'TRANSACTIONS', 'FOOTFALL']).default('REVENUE'),
  forecastValue: z.number(),
  confidence: z.number().min(0).max(100).optional(),
  method: z.enum(['MANUAL', 'TREND', 'AI']).default('MANUAL'),
  notes: z.string().max(2000).optional(),
});

export const forecastUpdateSchema = z.object({
  forecastValue: z.number().optional(),
  actualValue: z.number().optional(),
  confidence: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

// ============================================================
// Loss Prevention — Validators
// ============================================================

export const lossIncidentCreateSchema = z.object({
  storeId: z.string().min(1),
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(['THEFT', 'DAMAGE', 'ADMIN_ERROR', 'SUPPLIER', 'OTHER']),
  amount: z.number().min(0),
  description: z.string().min(5).max(2000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

export const lossIncidentUpdateSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  resolution: z.string().max(2000).optional(),
  assignedTo: z.string().min(1).optional(),
});

// ============================================================
// Inventory — Validators
// ============================================================

export const inventoryCountCreateSchema = z.object({
  storeId: z.string().min(1),
  countDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  countType: z.enum(['FULL', 'PARTIAL', 'CYCLE']).default('FULL'),
  notes: z.string().max(2000).optional(),
});

export const inventoryItemUpsertSchema = z.object({
  sku: z.string().min(1).max(50),
  productName: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  expectedQty: z.number().int().min(0),
  actualQty: z.number().int().min(0),
  unitPrice: z.number().min(0),
  notes: z.string().max(500).optional(),
});

// === Type Exports (Performance) ===

export type KpiEntryUpsertInput = z.infer<typeof kpiEntryUpsertSchema>;
export type BudgetPeriodCreateInput = z.infer<typeof budgetPeriodCreateSchema>;
export type BudgetPeriodUpdateInput = z.infer<typeof budgetPeriodUpdateSchema>;
export type BudgetActualCreateInput = z.infer<typeof budgetActualCreateSchema>;
export type ForecastCreateInput = z.infer<typeof forecastCreateSchema>;
export type ForecastUpdateInput = z.infer<typeof forecastUpdateSchema>;
export type LossIncidentCreateInput = z.infer<typeof lossIncidentCreateSchema>;
export type LossIncidentUpdateInput = z.infer<typeof lossIncidentUpdateSchema>;
export type InventoryCountCreateInput = z.infer<typeof inventoryCountCreateSchema>;
export type InventoryItemUpsertInput = z.infer<typeof inventoryItemUpsertSchema>;

// ============================================================
// Live Floor — Validators
// ============================================================

export const floorZoneCreateSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).default(0),
});

export const floorZoneUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const floorPositionCreateSchema = z.object({
  storeId: z.string().min(1),
  zoneId: z.string().min(1).optional(),
  userId: z.string().min(1),
  userName: z.string().min(1).max(100),
  status: z.enum(['ON_FLOOR', 'ON_BREAK', 'OFF_FLOOR', 'CASHIER']).default('ON_FLOOR'),
  notes: z.string().max(500).optional(),
});

export const floorPositionUpdateSchema = z.object({
  zoneId: z.string().min(1).nullable().optional(),
  status: z.enum(['ON_FLOOR', 'ON_BREAK', 'OFF_FLOOR', 'CASHIER']).optional(),
  notes: z.string().max(500).optional(),
  endedAt: z.string().optional(),
});

// ============================================================
// FR Tracking — Validators
// ============================================================

export const footfallUpsertSchema = z.object({
  storeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour: z.number().int().min(0).max(23).optional(),
  footfall: z.number().int().min(0),
  revenue: z.number().min(0).optional(),
  transactions: z.number().int().min(0).optional(),
});

// ============================================================
// VM Guidelines — Validators
// ============================================================

export const vmGuidelineDocCreateSchema = z.object({
  title: z.string().min(2).max(200),
  category: z.string().max(50).optional(),
  content: z.string().min(1),
  effectiveFrom: z.string().optional(),
});

export const vmGuidelineDocUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  category: z.string().max(50).optional(),
  content: z.string().min(1).optional(),
  effectiveFrom: z.string().optional(),
});

// ============================================================
// Maintenance — Validators
// ============================================================

export const maintenanceRequestCreateSchema = z.object({
  storeId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  category: z.enum(['ELECTRICAL', 'PLUMBING', 'HVAC', 'FIXTURE', 'IT', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export const maintenanceRequestUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(5).max(2000).optional(),
  category: z.enum(['ELECTRICAL', 'PLUMBING', 'HVAC', 'FIXTURE', 'IT', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().min(1).optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  resolution: z.string().max(2000).optional(),
});

// === Type Exports (Floor) ===

export type FloorZoneCreateInput = z.infer<typeof floorZoneCreateSchema>;
export type FloorZoneUpdateInput = z.infer<typeof floorZoneUpdateSchema>;
export type FloorPositionCreateInput = z.infer<typeof floorPositionCreateSchema>;
export type FloorPositionUpdateInput = z.infer<typeof floorPositionUpdateSchema>;
export type FootfallUpsertInput = z.infer<typeof footfallUpsertSchema>;
export type VmGuidelineDocCreateInput = z.infer<typeof vmGuidelineDocCreateSchema>;
export type VmGuidelineDocUpdateInput = z.infer<typeof vmGuidelineDocUpdateSchema>;
export type MaintenanceRequestCreateInput = z.infer<typeof maintenanceRequestCreateSchema>;
export type MaintenanceRequestUpdateInput = z.infer<typeof maintenanceRequestUpdateSchema>;

// ============================================================
// Training Hub / LMS — Validators
// ============================================================

export const courseCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
  durationMinutes: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(false),
});

export const courseUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(50).optional(),
  durationMinutes: z.number().int().min(0).optional(),
  isRequired: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const courseModuleCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  durationMinutes: z.number().int().min(0).default(0),
});

export const enrollmentCreateSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1),
  storeId: z.string().min(1),
});

export const enrollmentProgressSchema = z.object({
  progress: z.number().int().min(0).max(100),
  status: z.enum(['ENROLLED', 'IN_PROGRESS', 'COMPLETED']).optional(),
});

// ============================================================
// Training Hours — Validators
// ============================================================

export const trainingLogCreateSchema = z.object({
  storeId: z.string().min(1),
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().min(1).max(480),
  category: z.enum(['PRODUCT', 'SALES', 'SERVICE', 'COMPLIANCE', 'ONBOARDING', 'OTHER']).default('OTHER'),
  topic: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const trainingLogUpdateSchema = z.object({
  durationMinutes: z.number().int().min(1).max(480).optional(),
  category: z.enum(['PRODUCT', 'SALES', 'SERVICE', 'COMPLIANCE', 'ONBOARDING', 'OTHER']).optional(),
  topic: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  verifiedBy: z.string().min(1).optional(),
});

// ============================================================
// Challenges — Validators
// ============================================================

export const challengeCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['INDIVIDUAL', 'TEAM', 'STORE']).default('INDIVIDUAL'),
  metric: z.string().max(100).optional(),
  targetValue: z.number().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reward: z.string().max(500).optional(),
});

export const challengeUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  targetValue: z.number().optional(),
  reward: z.string().max(500).optional(),
});

export const challengeProgressSchema = z.object({
  currentValue: z.number(),
});

// ============================================================
// Onboarding — Validators
// ============================================================

export const onboardingTemplateCreateSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.string().max(50).optional(),
  durationDays: z.number().int().min(1).max(365).default(30),
  isDefault: z.boolean().default(false),
  steps: z.array(z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    category: z.string().max(50).optional(),
    dayNumber: z.number().int().min(1).default(1),
    sortOrder: z.number().int().min(0).default(0),
    isRequired: z.boolean().default(true),
  })).optional(),
});

export const onboardingJourneyCreateSchema = z.object({
  templateId: z.string().min(1),
  storeId: z.string().min(1),
  userId: z.string().min(1),
  mentorId: z.string().min(1).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const onboardingStepUpdateSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
  notes: z.string().max(2000).optional(),
  verifiedBy: z.string().min(1).optional(),
});

// === Type Exports (Training) ===

export type CourseCreateInput2 = z.infer<typeof courseCreateSchema>;
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;
export type CourseModuleCreateInput = z.infer<typeof courseModuleCreateSchema>;
export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>;
export type EnrollmentProgressInput = z.infer<typeof enrollmentProgressSchema>;
export type TrainingLogCreateInput = z.infer<typeof trainingLogCreateSchema>;
export type TrainingLogUpdateInput = z.infer<typeof trainingLogUpdateSchema>;
export type ChallengeCreateInput = z.infer<typeof challengeCreateSchema>;
export type ChallengeUpdateInput = z.infer<typeof challengeUpdateSchema>;
export type ChallengeProgressInput = z.infer<typeof challengeProgressSchema>;
export type OnboardingTemplateCreateInput = z.infer<typeof onboardingTemplateCreateSchema>;
export type OnboardingJourneyCreateInput = z.infer<typeof onboardingJourneyCreateSchema>;
export type OnboardingStepUpdateInput = z.infer<typeof onboardingStepUpdateSchema>;

// ============================================================
// 1:1 Coaching — Validators
// ============================================================

export const coachingSessionCreateSchema = z.object({
  storeId: z.string().min(1),
  coacheeId: z.string().min(1),
  scheduledAt: z.string().min(1),
  duration: z.number().int().min(5).max(480).default(30),
  type: z.enum(['REGULAR', 'AD_HOC', 'FOLLOW_UP']).default('REGULAR'),
  notes: z.string().max(5000).optional(),
  actionItems: z.string().max(5000).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  followUpDate: z.string().optional(),
});

export const coachingSessionUpdateSchema = z.object({
  scheduledAt: z.string().optional(),
  duration: z.number().int().min(5).max(480).optional(),
  type: z.enum(['REGULAR', 'AD_HOC', 'FOLLOW_UP']).optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().max(5000).optional(),
  actionItems: z.string().max(5000).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  followUpDate: z.string().optional(),
});

// ============================================================
// PDP / PIP — Validators
// ============================================================

export const developmentPlanCreateSchema = z.object({
  storeId: z.string().optional(),
  userId: z.string().min(1),
  type: z.enum(['PDP', 'PIP']),
  title: z.string().min(2).max(200),
  targetDate: z.string().optional(),
});

export const developmentGoalCreateSchema = z.object({
  title: z.string().min(2).max(200),
  measureOfSuccess: z.string().max(500).optional(),
  targetDate: z.string().optional(),
});

export const developmentGoalUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  measureOfSuccess: z.string().max(500).optional(),
  targetDate: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const developmentReviewCreateSchema = z.object({
  overallProgress: z.number().int().min(0).max(100).default(0),
  comments: z.string().max(5000).optional(),
});

// ============================================================
// Appraisals — Validators
// ============================================================

export const appraisalCycleCreateSchema = z.object({
  name: z.string().min(2).max(200),
  period: z.string().max(50).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const appraisalCreateSchema = z.object({
  cycleId: z.string().min(1),
  storeId: z.string().optional(),
  employeeId: z.string().min(1),
  managerId: z.string().min(1),
});

export const appraisalUpdateSchema = z.object({
  status: z.enum(['PENDING', 'SELF_REVIEW', 'MANAGER_REVIEW', 'COMPLETED']).optional(),
  selfRating: z.number().int().min(1).max(5).optional(),
  managerRating: z.number().int().min(1).max(5).optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  strengths: z.string().max(5000).optional(),
  improvements: z.string().max(5000).optional(),
  goals: z.string().max(5000).optional(),
  meetingNotes: z.string().max(5000).optional(),
});

// ============================================================
// Shift Planning — Validators
// ============================================================

export const shiftTemplateCreateSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1).max(100),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  minStaff: z.number().int().min(1).default(1),
  role: z.string().max(50).optional(),
});

export const shiftEntryCreateSchema = z.object({
  storeId: z.string().min(1),
  userId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  role: z.string().max(50).optional(),
});

export const shiftEntryUpdateSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  role: z.string().max(50).optional(),
  status: z.enum(['PLANNED', 'CONFIRMED', 'SWAPPED', 'CANCELLED']).optional(),
});

export const shiftSwapRequestSchema = z.object({
  swapWithUserId: z.string().optional(),
});

// ============================================================
// Pulse Survey — Validators
// ============================================================

export const pulseSurveyCreateSchema = z.object({
  title: z.string().min(2).max(200),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isAnonymous: z.boolean().default(true),
});

export const pulseQuestionCreateSchema = z.object({
  text: z.string().min(2).max(500),
  type: z.enum(['RATING', 'TEXT', 'CHOICE']).default('RATING'),
  options: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const pulseRespondSchema = z.object({
  storeId: z.string().optional(),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    valueRating: z.number().int().min(1).max(5).optional(),
    valueText: z.string().max(2000).optional(),
    valueChoice: z.string().max(500).optional(),
  })),
});

// ============================================================
// Wellbeing — Validators
// ============================================================

export const wellbeingCheckInCreateSchema = z.object({
  storeId: z.string().optional(),
  moodScore: z.number().int().min(1).max(5),
  energyLevel: z.number().int().min(1).max(5),
  stressLevel: z.number().int().min(1).max(5),
  workloadRating: z.number().int().min(1).max(5),
  notes: z.string().max(2000).optional(),
  isAnonymous: z.boolean().default(false),
});

export const wellbeingResourceCreateSchema = z.object({
  title: z.string().min(2).max(200),
  category: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().max(500).optional(),
});

export const wellbeingResourceUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  category: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  url: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================
// Kat.6: Kommunikation & Signal — Validators
// ============================================================

export const briefingCreateSchema = z.object({ title: z.string().min(1), content: z.string().min(1), date: z.string().min(1), type: z.enum(['MORNING', 'EVENING', 'SPECIAL']).optional() });
export type BriefingCreateInput = z.infer<typeof briefingCreateSchema>;

export const briefingUpdateSchema = z.object({ title: z.string().min(1).optional(), content: z.string().min(1).optional(), type: z.enum(['MORNING', 'EVENING', 'SPECIAL']).optional() });

export const handoverCreateSchema = z.object({ toUserId: z.string().optional(), shiftDate: z.string().min(1), shiftType: z.string().optional(), salesUpdate: z.string().optional(), openTasks: z.string().optional(), incidents: z.string().optional(), customerNotes: z.string().optional(), stockNotes: z.string().optional(), generalNotes: z.string().optional() });
export type HandoverCreateInput = z.infer<typeof handoverCreateSchema>;

export const handoverUpdateSchema = z.object({ toUserId: z.string().optional(), status: z.enum(['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED']).optional(), salesUpdate: z.string().optional(), openTasks: z.string().optional(), incidents: z.string().optional(), customerNotes: z.string().optional(), stockNotes: z.string().optional(), generalNotes: z.string().optional() });

export const teamMessageCreateSchema = z.object({ title: z.string().min(1), body: z.string().min(1), priority: z.enum(['NORMAL', 'HIGH', 'URGENT']).optional(), targetType: z.enum(['ALL', 'STORE', 'ROLE']).optional(), targetStoreIds: z.string().optional() });
export type TeamMessageCreateInput = z.infer<typeof teamMessageCreateSchema>;

export const newsletterCreateSchema = z.object({ title: z.string().min(1), content: z.string().optional() });
export type NewsletterCreateInput = z.infer<typeof newsletterCreateSchema>;

export const newsletterUpdateSchema = z.object({ title: z.string().min(1).optional(), content: z.string().optional(), status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional() });

export const newsletterSectionSchema = z.object({ title: z.string().min(1), content: z.string().min(1), sortOrder: z.number().int().optional() });

// ── Kat.7: Customer, Clienteling & Stock Validators ───

export const conversionGoalSchema = z.object({ period: z.string().min(1), targetConversion: z.number().optional(), targetAvgBasket: z.number().optional() });

export const clientProfileCreateSchema = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional(), preferences: z.string().optional(), vipLevel: z.string().optional() });

export const clientProfileUpdateSchema = z.object({ firstName: z.string().min(1).optional(), lastName: z.string().min(1).optional(), email: z.string().email().optional(), phone: z.string().optional(), preferences: z.string().optional(), vipLevel: z.string().optional(), totalPurchases: z.number().optional(), lastVisit: z.string().optional() });

export const clientInteractionSchema = z.object({ type: z.enum(['VISIT', 'CALL', 'EMAIL', 'EVENT']).optional(), notes: z.string().optional(), purchaseAmount: z.number().optional() });

export const clientTaskSchema = z.object({ title: z.string().min(1), dueDate: z.string().optional(), status: z.enum(['OPEN', 'DONE', 'CANCELLED']).optional() });

export const stockCalloutCreateSchema = z.object({ sku: z.string().min(1), productName: z.string().min(1), currentStock: z.number().int().optional(), reorderPoint: z.number().int().optional(), requestedQty: z.number().int().min(1), urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional() });

export const stockCalloutUpdateSchema = z.object({ status: z.enum(['OPEN', 'ORDERED', 'RECEIVED', 'CANCELLED']).optional(), currentStock: z.number().int().optional(), requestedQty: z.number().int().optional(), urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional() });

export const customerOrderCreateSchema = z.object({ orderNumber: z.string().min(1), customerName: z.string().min(1), customerEmail: z.string().email().optional(), trackingNumber: z.string().optional(), carrier: z.string().optional(), estimatedDelivery: z.string().optional() });

export const customerOrderUpdateSchema = z.object({ status: z.enum(['ORDERED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED']).optional(), trackingNumber: z.string().optional(), carrier: z.string().optional(), estimatedDelivery: z.string().optional() });

export const orderStatusUpdateSchema = z.object({ status: z.string().min(1), notes: z.string().optional() });
