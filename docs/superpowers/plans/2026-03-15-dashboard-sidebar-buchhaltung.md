# Dashboard, Sidebar & Buchhaltung — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tool-listing homepage with a role-specific activity dashboard, slim down the sidebar to recently-used tools, and add a billing module for kore_admin.

**Architecture:** Three independent changes sharing the same codebase: (1) Sidebar uses localStorage-tracked recent tools instead of listing all 34, (2) Homepage becomes a role-aware dashboard with KPIs and activity panels, (3) New billing CRUD (Prisma models + Express routes + React pages) for invoices/quotes with PDF generation.

**Tech Stack:** React 19, Express, Prisma 7.5 (SQLite), Zustand, React Query, Tailwind CSS, Lucide icons, pdfmake (new dep for PDFs)

**Spec:** `docs/superpowers/specs/2026-03-15-dashboard-sidebar-buchhaltung-design.md`

---

## Chunk 1: Sidebar Redesign + "Alle Tools" Page

### File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `client/src/hooks/useRecentTools.ts` | localStorage tracking of recently used tools |
| Create | `client/src/pages/AllToolsPage.tsx` | Full tool catalog (current ToolsHomePage content) |
| Modify | `client/src/components/AppSidebar.tsx` | Replace 34 tool links with recent-5 + "Alle Tools" |
| Modify | `client/src/App.tsx` | Add `/tools` route, change `/` to new dashboard |
| Modify | `client/src/layouts/AppLayout.tsx` | Hook recent-tools tracking into route changes |

---

### Task 1: useRecentTools Hook

**Files:**
- Create: `client/src/hooks/useRecentTools.ts`

- [ ] **Step 1: Create the hook**

```typescript
// client/src/hooks/useRecentTools.ts
import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'kore_recent_tools';
const MAX_RECENT = 5;

interface RecentTool {
  toolKey: string;
  lastUsed: string; // ISO timestamp
}

// External store for cross-component sync
let listeners: Array<() => void> = [];
function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => { listeners = listeners.filter(l => l !== listener); };
}
function emitChange() {
  listeners.forEach(l => l());
}

function getRecent(): RecentTool[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): string {
  return localStorage.getItem(STORAGE_KEY) || '[]';
}

export function useRecentTools() {
  const raw = useSyncExternalStore(subscribe, getSnapshot);
  const recent: RecentTool[] = JSON.parse(raw);

  const trackTool = useCallback((toolKey: string) => {
    const current = getRecent().filter(t => t.toolKey !== toolKey);
    const updated = [{ toolKey, lastUsed: new Date().toISOString() }, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    emitChange();
  }, []);

  return { recentTools: recent, trackTool };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx tsc --noEmit 2>&1 | grep -i useRecentTools || echo "OK"`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/hooks/useRecentTools.ts
git commit -m "feat: add useRecentTools hook for localStorage-based tool tracking"
```

---

### Task 2: AllToolsPage (move current ToolsHomePage content)

**Files:**
- Create: `client/src/pages/AllToolsPage.tsx`

- [ ] **Step 1: Create AllToolsPage**

Copy the tool-listing portion from `ToolsHomePage.tsx` into a new page. This page shows all tools grouped by category — the content that currently lives on `/`. Remove the greeting header and admin quick-actions (those move to the new dashboard).

```typescript
// client/src/pages/AllToolsPage.tsx
import {
  Wrench,
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen, BarChart3, Wallet,
  LineChart, Package, Monitor, Activity, Palette, GraduationCap,
  Clock, Trophy, UserPlus, MessageSquare, Compass, Star, CalendarDays,
  Heart, Smile, FileText, ArrowLeftRight, Bell, Mail, Navigation,
  Map, LayoutDashboard, PackageSearch, Shield, type LucideIcon,
} from 'lucide-react';
import { useMyTools } from '../hooks/useMyTools';
import { useEffectiveRole } from '../hooks/useEffectiveRole';
import { useNavigate } from 'react-router-dom';
import { TOOL_ROUTES } from '../lib/toolRoutes';
import { CATEGORY_ORDER } from '../lib/moduleCategories';

const iconMap: Record<string, LucideIcon> = {
  ClipboardCheck, Award, TrendingUp, Camera, BookOpen,
  BarChart3, Wallet, LineChart, Shield, Package,
  Monitor, Activity, Palette, Wrench,
  GraduationCap, Clock, Trophy, UserPlus,
  MessageSquare, Compass, Star, CalendarDays, Heart, Smile,
  FileText, ArrowLeftRight, Bell, Mail,
  PackageSearch, Navigation, Map, LayoutDashboard,
};

const categoryLabels: Record<string, string> = {
  STANDARDS_COMPLIANCE: 'Standards & Compliance',
  PERFORMANCE: 'Performance & Sichtbarkeit',
  FLOOR: 'Floor in Echtzeit',
  TRAINING: 'Training & Entwicklung',
  COACHING_PEOPLE: 'Coaching & People',
  KOMMUNIKATION: 'Kommunikation & Signal',
  CUSTOMER_STOCK: 'Customer, Clienteling & Stock',
  REGIONAL_INSIGHTS: 'Regional Insights',
};

export function AllToolsPage() {
  const { isOperator } = useEffectiveRole();
  const { data: myTools, isLoading } = useMyTools();
  const navigate = useNavigate();

  const grouped: Record<string, NonNullable<typeof myTools>> = {};
  for (const assignment of myTools || []) {
    const cat = assignment.tool.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat]!.push(assignment);
  }

  return (
    <div>
      <div className="mb-lg sm:mb-xl">
        <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">
          {isOperator ? 'Meine Tools' : 'Alle Tools'}
        </h1>
        <p className="font-body text-small text-kore-mid mt-xs">
          {isOperator
            ? 'Alle zugewiesenen Tools im Ueberblick'
            : 'Tools konfigurieren & auswerten'}
        </p>
      </div>

      {isLoading ? (
        <div className="py-xl text-center">
          <p className="font-body text-kore-mid">Tools werden geladen...</p>
        </div>
      ) : !myTools || myTools.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center">
          <Wrench size={32} className="text-kore-mid/30 mx-auto mb-md" />
          <p className="font-body text-kore-mid">Keine Tools zugewiesen.</p>
          <p className="font-body text-small text-kore-mid/60 mt-xs">
            Kontaktieren Sie Ihren Administrator, um Tools freizuschalten.
          </p>
        </div>
      ) : (
        <div className="space-y-xl">
          {CATEGORY_ORDER
            .filter((cat) => grouped[cat]?.length)
            .map((category) => (
              <div key={category}>
                <h3 className="font-body text-caption text-kore-mid uppercase tracking-[0.14em] mb-md">
                  {categoryLabels[category] || category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
                  {grouped[category]!.map((assignment) => {
                    const tool = assignment.tool;
                    const Icon = iconMap[tool.icon || ''] || Wrench;
                    const route = TOOL_ROUTES[tool.key];
                    return (
                      <div
                        key={tool.id}
                        className={`bg-kore-white border border-kore-border p-lg flex items-start gap-md transition-colors ${
                          route
                            ? 'cursor-pointer hover:border-kore-brass/40 hover:bg-kore-surface'
                            : 'opacity-60'
                        }`}
                        onClick={() => route && navigate(route)}
                      >
                        <div className="w-[36px] h-[36px] bg-kore-surface flex items-center justify-center flex-shrink-0">
                          <Icon size={18} className="text-kore-ink" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body text-small text-kore-ink font-normal truncate">
                            {tool.name}
                          </p>
                          {tool.description && (
                            <p className="font-body text-[0.65rem] text-kore-mid mt-xs line-clamp-2">
                              {tool.description}
                            </p>
                          )}
                          {!route && (
                            <p className="font-body text-[0.6rem] text-kore-brass mt-xs">
                              Bald verfuegbar
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/pages/AllToolsPage.tsx
git commit -m "feat: add AllToolsPage for /tools route (extracted from ToolsHomePage)"
```

---

### Task 3: Rewrite AppSidebar

**Files:**
- Modify: `client/src/components/AppSidebar.tsx`

- [ ] **Step 1: Rewrite AppSidebar with recent tools + admin/platform sections**

Replace the entire component. Key changes:
- Remove all 34 tool links grouped by category
- Add "Dashboard" as first link (active on `/`)
- Add "Zuletzt verwendet" section showing max 5 recent tools (from `useRecentTools`)
- Add "Alle Tools anzeigen" link → `/tools`
- Keep "Administration" section (store_manager+): Benutzer, Stores, Tools
- Add "Plattform" section (kore_admin only): Kunden, Buchhaltung, Reporting, DSGVO
- Use `useMyTools` to resolve tool names/icons from toolKey
- Fallback when no recent tools: show first 5 assigned tools

The sidebar must use Lucide SVG icons (no emojis), Jost font, brass accent colors, and match the existing dark-theme style.

- [ ] **Step 2: Verify it compiles and renders**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx vite build 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/components/AppSidebar.tsx
git commit -m "refactor: slim sidebar — recent tools + alle tools link + admin/platform sections"
```

---

### Task 4: Wire up routes and track tool usage

**Files:**
- Modify: `client/src/App.tsx` — add `/tools` route with `AllToolsPage`
- Modify: `client/src/layouts/AppLayout.tsx` — track tool usage on route change

- [ ] **Step 1: Add /tools route in App.tsx**

In `App.tsx`, import `AllToolsPage` and add the route inside the protected `AppLayout` routes:

```typescript
import { AllToolsPage } from './pages/AllToolsPage';
// ... inside <Route element={<AppLayout />}>:
<Route path="/tools" element={<AllToolsPage />} />
```

- [ ] **Step 2: Track tool usage in AppLayout**

In `client/src/layouts/AppLayout.tsx`, add a `useEffect` that detects when the user navigates to a `/tools/*` route and calls `trackTool()` with the matching tool key:

```typescript
import { useLocation } from 'react-router-dom';
import { useRecentTools } from '../hooks/useRecentTools';
import { TOOL_ROUTES } from '../lib/toolRoutes';

// Inside the AppLayout component:
const location = useLocation();
const { trackTool } = useRecentTools();

useEffect(() => {
  // Find which tool key matches the current path
  const entry = Object.entries(TOOL_ROUTES).find(([_, route]) =>
    location.pathname.startsWith(route)
  );
  if (entry) {
    trackTool(entry[0]); // entry[0] is the toolKey
  }
}, [location.pathname, trackTool]);
```

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx vite build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/App.tsx client/src/layouts/AppLayout.tsx
git commit -m "feat: wire /tools route and auto-track recent tool usage"
```

---

## Chunk 2: kore_admin Dashboard (Homepage Redesign)

### File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `client/src/pages/DashboardPage.tsx` | Role-aware homepage with KPIs and panels |
| Create | `client/src/hooks/useDashboardData.ts` | React Query hooks for dashboard stats |
| Create | `server/src/routes/admin/dashboard.ts` | API endpoint for dashboard stats |
| Modify | `client/src/App.tsx` | Change `/` route to new DashboardPage |
| Modify | `server/src/index.ts` | Register dashboard routes |

---

### Task 5: Dashboard API endpoint

**Files:**
- Create: `server/src/routes/admin/dashboard.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create the dashboard stats endpoint**

```typescript
// server/src/routes/admin/dashboard.ts
import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate, requireMinRole } from '../../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/admin/dashboard/stats — kore_admin only
router.get('/stats', requireMinRole('kore_admin'), async (_req, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      totalStores,
      activeStores,
      totalToolBookings,
      recentTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),
      prisma.storeToolAssignment.count(),
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { stores: true } } },
      }),
    ]);

    // Calculate MRR from active tool assignments
    const toolAssignments = await prisma.storeToolAssignment.findMany({
      include: { tool: { select: { priceMonthly: true } } },
    });
    const mrr = toolAssignments.reduce((sum, a) => sum + (a.tool.priceMonthly || 0), 0);

    res.json({
      totalTenants,
      activeTenants,
      totalStores,
      activeStores,
      totalToolBookings,
      mrr,
      recentTenants: recentTenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        storeCount: t._count.stores,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

export default router;
```

- [ ] **Step 2: Register in server/src/index.ts**

Add after the existing admin route registrations:

```typescript
import dashboardRouter from './routes/admin/dashboard.js';
// ...
app.use('/api/admin/dashboard', dashboardRouter);
```

- [ ] **Step 3: Verify server compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/server && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add server/src/routes/admin/dashboard.ts server/src/index.ts
git commit -m "feat: add GET /api/admin/dashboard/stats endpoint for kore_admin KPIs"
```

---

### Task 6: useDashboardData hook

**Files:**
- Create: `client/src/hooks/useDashboardData.ts`

- [ ] **Step 1: Create the hook**

```typescript
// client/src/hooks/useDashboardData.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalStores: number;
  activeStores: number;
  totalToolBookings: number;
  mrr: number; // cents
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    storeCount: number;
    createdAt: string;
  }>;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api<DashboardStats>('/api/admin/dashboard/stats'),
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/hooks/useDashboardData.ts
git commit -m "feat: add useDashboardStats hook for dashboard KPI data"
```

---

### Task 7: DashboardPage component

**Files:**
- Create: `client/src/pages/DashboardPage.tsx` (NEW — this is the homepage, NOT the admin dashboard)
- Modify: `client/src/App.tsx` — swap ToolsHomePage for DashboardPage on `/`

- [ ] **Step 1: Create the role-aware DashboardPage**

This page renders different content based on `useEffectiveRole()`:
- **kore_admin**: KPI row (MRR, Kunden, Stores, Buchungen) + 4 panels (Anfragen & Angebote, Offene Rechnungen, System-Status, Neueste Kunden)
- **All other roles (Phase 2)**: Simple placeholder with greeting + "Dein Dashboard wird bald verfuegbar" message + link to "Alle Tools"

Use existing UI components (no new ones needed). Follow KORE CI: Cormorant headings, Jost body text, brass accents, kore-border/surface/white cards.

The KPI row uses 4 cards in a responsive grid. Panels use a 2-column grid with headers and activity lists (matching the mockup at `.superpowers/brainstorm/59840-1773566000/dashboard-ci.html`).

For the kore_admin view, use `useDashboardStats()` to fetch data. Format MRR from cents to EUR with `(mrr / 100).toLocaleString('de-DE')`.

- [ ] **Step 2: Update App.tsx to use DashboardPage on /**

```typescript
import { DashboardPage } from './pages/DashboardPage';
// Change: <Route path="/" element={<ToolsHomePage />} />
// To:     <Route path="/" element={<DashboardPage />} />
```

Keep the `ToolsHomePage` import if still referenced, or remove it if `AllToolsPage` fully replaces it.

- [ ] **Step 3: Verify build passes**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx vite build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/pages/DashboardPage.tsx client/src/App.tsx
git commit -m "feat: role-aware dashboard as homepage (kore_admin KPIs + Phase 2 placeholder)"
```

---

## Chunk 3: Billing Module — Backend

### File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `server/prisma/schema.prisma` | Add Invoice + InvoiceItem models |
| Create | `server/src/routes/admin/billing.ts` | CRUD + generate + PDF endpoints |
| Create | `server/src/lib/invoice-number.ts` | Sequential number generation |
| Create | `server/src/lib/invoice-pdf.ts` | PDF generation with pdfmake |
| Modify | `server/src/index.ts` | Register billing routes |
| Modify | `server/package.json` | Add pdfmake dependency |

---

### Task 8: Prisma schema — Invoice models

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add Invoice and InvoiceItem models**

Add to the end of schema.prisma:

```prisma
model Invoice {
  id          String        @id @default(uuid())
  tenantId    String
  tenant      Tenant        @relation(fields: [tenantId], references: [id])
  createdById String
  number      String        @unique
  type        String        // INVOICE | QUOTE
  status      String        @default("DRAFT") // DRAFT | SENT | ACCEPTED | PAID | OVERDUE | CANCELED
  issueDate   DateTime
  dueDate     DateTime?
  items       InvoiceItem[]
  subtotal    Int           // Cents
  taxRate     Float         @default(0.19)
  taxAmount   Int           // Cents
  total       Int           // Cents
  notes       String?
  paidAt      DateTime?
  sentAt      DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model InvoiceItem {
  id          String  @id @default(uuid())
  invoiceId   String
  invoice     Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Int
  unitPrice   Int     // Cents
  total       Int     // Cents
}
```

Also add `invoices Invoice[]` to the existing Tenant model's relations.

- [ ] **Step 2: Run Prisma migration**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app && npx prisma db push
```

- [ ] **Step 3: Regenerate Prisma client**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app && npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add server/prisma/schema.prisma
git commit -m "feat: add Invoice + InvoiceItem Prisma models"
```

---

### Task 9: Invoice number generator

**Files:**
- Create: `server/src/lib/invoice-number.ts`

- [ ] **Step 1: Create the number generator**

```typescript
// server/src/lib/invoice-number.ts
import { prisma } from './prisma.js';

/**
 * Generates sequential invoice/quote numbers.
 * Format: R-YYYY-NNN (invoices) or A-YYYY-NNN (quotes)
 */
export async function generateInvoiceNumber(type: 'INVOICE' | 'QUOTE'): Promise<string> {
  const prefix = type === 'INVOICE' ? 'R' : 'A';
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { number: { startsWith: `${prefix}-${year}-` } },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  let nextNum = 1;
  if (lastInvoice) {
    const parts = lastInvoice.number.split('-');
    nextNum = parseInt(parts[2], 10) + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/server && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add server/src/lib/invoice-number.ts
git commit -m "feat: add sequential invoice number generator (R-YYYY-NNN / A-YYYY-NNN)"
```

---

### Task 10: Install pdfmake + invoice PDF template

**Files:**
- Modify: `server/package.json` — add pdfmake
- Create: `server/src/lib/invoice-pdf.ts`

- [ ] **Step 1: Install pdfmake**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app/server && npm install pdfmake
```

- [ ] **Step 2: Create PDF generation module**

Create `server/src/lib/invoice-pdf.ts` that:
- Accepts an Invoice with items and tenant info
- Returns a Buffer containing the PDF
- Uses KORE CI: brass (#9E8460) accent color, clean layout
- Includes: KORE header with address, recipient (tenant contact), invoice number, date, due date, items table, subtotal/tax/total, payment terms, notes
- Since custom fonts (Cormorant/Jost) require font files, use Helvetica as fallback (pdfmake built-in) with styling that matches CI proportions

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/server && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add server/src/lib/invoice-pdf.ts server/package.json server/package-lock.json
git commit -m "feat: add invoice PDF generation with pdfmake in KORE CI"
```

---

### Task 11: Billing API routes

**Files:**
- Create: `server/src/routes/admin/billing.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create billing routes**

Create `server/src/routes/admin/billing.ts` with these endpoints (all require `authenticate` + `requireMinRole('kore_admin')`):

1. `GET /` — List invoices with filters (type, status, tenantId) and pagination (page, pageSize)
2. `POST /` — Create invoice/quote with items array
3. `GET /stats` — Billing summary (openQuotes, openInvoices, overdueAmount, mrr)
4. `GET /:id` — Single invoice with items and tenant
5. `PATCH /:id` — Edit content (only DRAFT status)
6. `POST /:id/status` — Status transition with validation (DRAFT→SENT, SENT→PAID, etc.)
7. `DELETE /:id` — Delete (only DRAFT)
8. `GET /:id/pdf` — Generate and return PDF
9. `POST /:id/send` — Send via email (using existing Resend setup) and set status to SENT
10. `POST /generate` — Auto-generate invoices for all active tenants based on tool bookings

Follow existing patterns from `server/src/routes/admin/tenants.ts` for error handling, response format, and Prisma usage.

- [ ] **Step 2: Register in server/src/index.ts**

```typescript
import billingRouter from './routes/admin/billing.js';
// ...
app.use('/api/admin/billing', billingRouter);
```

- [ ] **Step 3: Verify server compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/server && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 4: Test endpoints manually**

```bash
# Start dev server, then test:
curl -s http://localhost:3001/api/admin/billing/stats -H "Authorization: Bearer $TOKEN" | head
```

- [ ] **Step 5: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add server/src/routes/admin/billing.ts server/src/index.ts
git commit -m "feat: complete billing API — CRUD, PDF, email, auto-generate"
```

---

## Chunk 4: Billing Module — Frontend

### File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `client/src/hooks/useBilling.ts` | React Query hooks for billing API |
| Create | `client/src/pages/admin/BillingOverviewPage.tsx` | Billing dashboard with tabs |
| Create | `client/src/pages/admin/InvoiceCreatePage.tsx` | Create/edit invoice form |
| Create | `client/src/pages/admin/InvoiceDetailPage.tsx` | Invoice detail + actions |
| Modify | `client/src/App.tsx` | Add billing routes |

---

### Task 12: useBilling hook

**Files:**
- Create: `client/src/hooks/useBilling.ts`

- [ ] **Step 1: Create the billing hooks**

Follow the pattern from `useTenants.ts`:

```typescript
// client/src/hooks/useBilling.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  tenantId: string;
  tenant?: { id: string; name: string; contactName: string; contactEmail: string };
  number: string;
  type: 'INVOICE' | 'QUOTE';
  status: string;
  issueDate: string;
  dueDate: string | null;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  paidAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface InvoiceListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

interface BillingStats {
  openQuotes: number;
  openInvoices: number;
  overdueAmount: number;
  mrr: number;
}

interface InvoiceListParams {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  tenantId?: string;
}

export function useInvoices(params: InvoiceListParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);
  if (params.tenantId) query.set('tenantId', params.tenantId);
  const qs = query.toString();

  return useQuery({
    queryKey: ['billing', 'invoices', params],
    queryFn: () => api<InvoiceListResponse>(`/api/admin/billing${qs ? `?${qs}` : ''}`),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['billing', 'invoices', id],
    queryFn: () => api<Invoice>(`/api/admin/billing/${id}`),
    enabled: !!id,
  });
}

export function useBillingStats() {
  return useQuery({
    queryKey: ['billing', 'stats'],
    queryFn: () => api<BillingStats>('/api/admin/billing/stats'),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Invoice> & { items: InvoiceItem[] }) =>
      api<Invoice>('/api/admin/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}

export function useUpdateInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Invoice>) =>
      api<Invoice>(`/api/admin/billing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}

export function useUpdateInvoiceStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      api(`/api/admin/billing/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/billing/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}

export function useSendInvoice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api(`/api/admin/billing/${id}/send`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}

export function useGenerateInvoices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api('/api/admin/billing/generate', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['billing'] }),
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/hooks/useBilling.ts
git commit -m "feat: add useBilling React Query hooks for billing API"
```

---

### Task 13: BillingOverviewPage

**Files:**
- Create: `client/src/pages/admin/BillingOverviewPage.tsx`

- [ ] **Step 1: Create the billing overview page**

Structure (following existing admin page patterns from `TenantsListPage.tsx`):

1. **Header**: "Buchhaltung" title + "Neues Angebot" / "Neue Rechnung" buttons
2. **KPI Cards Row**: Offene Angebote, Offene Rechnungen, Ueberfaellig (EUR), MRR (EUR) — using `useBillingStats()`
3. **Tab Bar**: "Alle" | "Angebote" | "Rechnungen" — filters `type` param
4. **Filter Row**: Status-Select (Alle/Entwurf/Gesendet/Bezahlt/Ueberfaellig) + Kunde-Select
5. **Table**: Nr., Kunde, Typ, Betrag, Status (Badge), Datum — with pagination
6. **"Auto-Rechnungen generieren" button** at bottom

Use existing UI components: `Table`, `Thead`, `Tbody`, `Th`, `Tr`, `Td`, `Badge`, `Button`, `Select`.

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/pages/admin/BillingOverviewPage.tsx
git commit -m "feat: add BillingOverviewPage with KPI cards, filters, and invoice table"
```

---

### Task 14: InvoiceCreatePage

**Files:**
- Create: `client/src/pages/admin/InvoiceCreatePage.tsx`

- [ ] **Step 1: Create the invoice creation form**

Structure:
1. **Header**: "Neues Angebot" or "Neue Rechnung" (based on query param `?type=QUOTE|INVOICE`)
2. **Form Fields**: Kunde (Select from `useTenants`), Datum, Zahlungsziel (Tage), Notizen
3. **Items Table**: Beschreibung, Menge, Einzelpreis (EUR), Gesamt — with "Position hinzufuegen" button
4. **"Aus gebuchten Tools befuellen" button**: Fetches tenant's tool assignments and populates items
5. **Summary**: Netto, USt. (19%), Brutto
6. **Actions**: "Als Entwurf speichern" (primary), "Abbrechen"

Use `react-hook-form` for form state. Calculate totals dynamically. On submit, call `useCreateInvoice()` and navigate to `/admin/buchhaltung`.

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/pages/admin/InvoiceCreatePage.tsx
git commit -m "feat: add InvoiceCreatePage with items editor and auto-fill from bookings"
```

---

### Task 15: InvoiceDetailPage

**Files:**
- Create: `client/src/pages/admin/InvoiceDetailPage.tsx`

- [ ] **Step 1: Create the invoice detail page**

Structure:
1. **Header**: Invoice number + Status Badge + Back link
2. **Info Grid**: Kunde, Erstellt am, Gesendet am, Bezahlt am, Zahlungsziel
3. **Items Table**: Read-only view of line items with totals
4. **Notes section** (if present)
5. **Action buttons** (based on current status):
   - DRAFT: "Bearbeiten", "PDF Vorschau", "Senden", "Loeschen"
   - SENT: "PDF herunterladen", "Als bezahlt markieren", "Erneut senden"
   - PAID: "PDF herunterladen" only
   - OVERDUE: "PDF herunterladen", "Als bezahlt markieren", "Erneut senden"

PDF download: `window.open('/api/admin/billing/${id}/pdf')` with auth token handling.

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx tsc --noEmit 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/pages/admin/InvoiceDetailPage.tsx
git commit -m "feat: add InvoiceDetailPage with status actions and PDF download"
```

---

### Task 16: Wire billing routes in App.tsx

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Add billing routes**

Import the 3 new billing pages and add routes inside the kore_admin protected section:

```typescript
import { BillingOverviewPage } from './pages/admin/BillingOverviewPage';
import { InvoiceCreatePage } from './pages/admin/InvoiceCreatePage';
import { InvoiceDetailPage } from './pages/admin/InvoiceDetailPage';

// Inside <Route element={<ProtectedRoute minRole="kore_admin" />}>:
<Route path="/admin/buchhaltung" element={<BillingOverviewPage />} />
<Route path="/admin/buchhaltung/neu" element={<InvoiceCreatePage />} />
<Route path="/admin/buchhaltung/:id" element={<InvoiceDetailPage />} />
```

- [ ] **Step 2: Full build verification**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx vite build 2>&1 | tail -5
cd /Users/nicolemunozbonilla/Desktop/kore-app/server && npx tsc --noEmit 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add client/src/App.tsx
git commit -m "feat: wire billing routes — /admin/buchhaltung, /neu, /:id"
```

---

## Chunk 5: Integration & Verification

### Task 17: End-to-end verification

- [ ] **Step 1: Start dev servers**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app && npm run dev
```

- [ ] **Step 2: Verify sidebar**
- Navigate to `localhost:5173`
- Sidebar should show: Dashboard (active), "Zuletzt verwendet" (empty or fallback), "Alle Tools anzeigen", Administration, Plattform
- Click "Alle Tools anzeigen" → should show full tool catalog at `/tools`
- Click a tool → sidebar "Zuletzt verwendet" should update

- [ ] **Step 3: Verify dashboard**
- Homepage (`/`) should show kore_admin dashboard with KPI cards
- Use "View as" toggle to switch to store_manager → should show Phase 2 placeholder
- Switch back to kore_admin → KPIs should reload

- [ ] **Step 4: Verify billing**
- Navigate to `/admin/buchhaltung` → should show billing overview
- Click "Neue Rechnung" → create form should load
- "Aus gebuchten Tools befuellen" should populate items
- Save as draft → should appear in list with DRAFT badge
- Click invoice → detail page with action buttons

- [ ] **Step 5: Production build**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app/client && npx vite build
cd /Users/nicolemunozbonilla/Desktop/kore-app/server && npx tsc --noEmit
```

- [ ] **Step 6: Final commit**

```bash
cd /Users/nicolemunozbonilla/Desktop/kore-app
git add -A
git commit -m "chore: integration verification — dashboard, sidebar, billing complete"
```
