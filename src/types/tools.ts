// Inline-Types aus @kore/types — Tools & Stores

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
  priceMonthly: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  city: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tools?: StoreToolAssignment[];
  _count?: { tools: number };
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
