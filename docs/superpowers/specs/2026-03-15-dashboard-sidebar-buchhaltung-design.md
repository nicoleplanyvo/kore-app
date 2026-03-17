# Dashboard, Sidebar & Buchhaltung — Design Spec

## Problem

Die KORE-App hat drei UX-Probleme:

1. **Sidebar überfüllt** — 34 Tool-Links plus Admin-Bereich, schwer navigierbar
2. **Startseite informationsarm** — zeigt nur eine Tool-Auflistung statt relevanter Aktivitäten
3. **Buchhaltung fehlt** — kein Ort für Angebote, Rechnungen, Tracking (kore_admin)

## Entscheidungen

- Tools leben in der Sidebar als "Zuletzt verwendet" (max 5) + "Alle Tools"-Link
- Startseite (`/`) wird zum rollenspezifischen Activity-Dashboard
- Bisherige Tool-Übersicht wandert nach `/tools` (erreichbar via "Alle Tools")
- Buchhaltung als neuer kore_admin-Bereich mit automatischer Rechnungsstellung

---

## 1. Sidebar-Redesign

### Struktur (von oben nach unten)

```
KORE
Retail Platform
─────────────────
[aktiv] Dashboard

ZULETZT VERWENDET
  Checklisten
  KPI Dashboard
  1:1 Coaching
  Shift Planning
  Training Hub

  [ Alle Tools anzeigen → ]

ADMINISTRATION          (store_manager+)
  Benutzer
  Stores
  Tools                 (regional_manager+)

PLATTFORM              (kore_admin only)
  Kunden
  Buchhaltung
  Reporting             (tenant_admin+)
  DSGVO                 (tenant_admin+)
─────────────────
Nicole Muñoz Bonilla
nicole@kore-retail.de
[Abmelden]
```

### Rollenbasierte Sichtbarkeit

| Bereich | Rollen |
|---------|--------|
| Dashboard | alle |
| Zuletzt verwendet | alle |
| Alle Tools | alle |
| Administration | store_manager+ |
| Benutzer/Stores | store_manager+ |
| Tools (Konfiguration) | regional_manager+ |
| Plattform | kore_admin |
| Reporting/DSGVO | tenant_admin+ |
| Kunden/Buchhaltung | kore_admin |

### "Zuletzt verwendet" Tracking

- Speicherung in `localStorage` unter Key `kore_recent_tools`
- Array von `{ toolKey: string, lastUsed: ISO-Timestamp }`
- Max 5 Einträge, sortiert nach `lastUsed` DESC
- Wird aktualisiert wenn User eine Tool-Route betritt
- Fallback bei leerem State: erste 5 zugewiesene Tools anzeigen

### "Alle Tools" Seite

- Route: `/tools`
- Inhalt: die bisherige `ToolsHomePage` (Tool-Cards gruppiert nach Kategorie)
- Rollenbasierte Anzeige bleibt (isConfigurator etc.)

---

## 2. Rollenspezifisches Dashboard

Die Startseite (`/`) zeigt je nach Rolle unterschiedliche Inhalte.

### kore_admin Dashboard

**KPI-Reihe (4 Cards):**
- MRR (€) mit Veränderung vs. Vormonat
- Aktive Kunden (Anzahl) mit Neuzugängen
- Stores (Anzahl) mit Veränderung
- Tool-Buchungen (Anzahl) mit aktiven Tools

**4 Panels (2x2 Grid):**

1. **Kunden-Anfragen & Angebote** — Liste mit Status-Dots (brass=neu, warning=wartend, success=angenommen). Link: "Alle anzeigen" → `/admin/buchhaltung`
2. **Offene Rechnungen** — Mini-Tabelle mit Nr., Kunde, Betrag, Status (Überfällig/Offen/Bezahlt). Link: "Buchhaltung" → `/admin/buchhaltung`
3. **System-Status** — API-Health, DB-Größe, E-Mail-Kontingent
4. **Neueste Kunden** — Letzte 3 Tenants mit Store-Anzahl und Status

**Datenquelle:** Neuer Endpoint `GET /api/admin/dashboard/stats` (kombiniert Tenant-Stats, Billing-Stats und System-Health).

### tenant_admin Dashboard (Phase 2 — zunächst Platzhalter)

**KPI-Reihe (4 Cards):**
- Aktive Stores
- Aktive User
- Gebuchte Tools
- Offene Aufgaben

**Panels:**
1. **Ausstehende Konfigurationen** — Tools die noch konfiguriert werden müssen
2. **Letzte Aktivitäten** — Neue User-Registrierungen, Store-Änderungen
3. **Store-Performance** — Top/Bottom 3 Stores nach Checklisten-Compliance

### regional_manager / multisite_manager Dashboard (Phase 2 — zunächst Platzhalter)

**KPI-Reihe:**
- Zugewiesene Stores
- Offene Audits
- Team-Größe
- Durchschnittliche Compliance-Rate

**Panels:**
1. **Offene Audits & Checklisten** — Überfällige Items pro Store
2. **Store-Vergleich** — Quick-View der wichtigsten KPIs

### store_manager Dashboard (Phase 2 — zunächst Platzhalter)

**KPI-Reihe:**
- Offene Aufgaben
- Heutige Checklisten
- Team-Mitglieder
- Compliance-Score

**Panels:**
1. **Heute zu erledigen** — Offene Checklisten, Briefings, Audits
2. **Team-Status** — Anwesende Mitarbeiter, nächste Schichten
3. **Letzte Eingänge** — Neue Briefings, Nachrichten, Updates

### learner Dashboard (Phase 2 — zunächst Platzhalter)

**Einfachere Ansicht (kein KPI-Row):**

**Panels:**
1. **Meine Aufgaben** — Offene Checklisten, zugewiesene Trainings
2. **Nächste Trainings** — Anstehende Schulungen mit Datum
3. **Nachrichten** — Letzte Team-Push-Nachrichten und Briefings

---

## 3. Buchhaltungs-Modul

### Route-Struktur

```
/admin/buchhaltung                → Übersicht (Dashboard mit offenen Positionen)
/admin/buchhaltung/angebote       → Angebote-Liste
/admin/buchhaltung/angebote/neu   → Neues Angebot erstellen
/admin/buchhaltung/angebote/:id   → Angebot Detail/Bearbeiten
/admin/buchhaltung/rechnungen     → Rechnungen-Liste
/admin/buchhaltung/rechnungen/:id → Rechnung Detail
```

### Datenmodell

**Neue Prisma-Models:**

```prisma
model Invoice {
  id            String    @id @default(uuid())
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  createdById   String    // User-ID des Erstellers (Audit-Trail)
  number        String    @unique  // Globaler Nummernkreis: "R-2026-001" / "A-2026-001"
  type          String    // "INVOICE" | "QUOTE"
  status        String    // "DRAFT" | "SENT" | "ACCEPTED" | "PAID" | "OVERDUE" | "CANCELED"
  issueDate     DateTime
  dueDate       DateTime?
  items         InvoiceItem[]
  subtotal      Int       // Cents
  taxRate       Float     @default(0.19)
  taxAmount     Int       // Cents
  total         Int       // Cents
  notes         String?
  paidAt        DateTime?
  sentAt        DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Int       // Ganzzahl, keine Proratierung (out of scope)
  unitPrice   Int      // Cents
  total       Int      // Cents
}
```

**Hinweis:** `Invoice.number` ist global `@unique` (nicht per-Tenant), da KORE der Rechnungsaussteller ist. Die Tenant-Relation auf `Tenant` erfordert ein `invoices Invoice[]` Feld im bestehenden Tenant-Model.

### Automatische Rechnungsstellung

- Monatlicher Trigger (manuell oder via Cron): `POST /api/admin/billing/generate-invoices`
- Für jeden aktiven Tenant:
  - Ermittelt gebuchte Tools × Anzahl Stores × `priceMonthly`
  - Erstellt Invoice mit Status "DRAFT"
  - Admin prüft und sendet manuell
- Basiert auf `ToolDefinition.priceMonthly` (bereits in DB) und `StoreToolAssignment`

### PDF-Generierung

- Server-seitig mit `pdfmake` (kein Chromium-Binary nötig, leichtgewichtig für Plesk-Deploy)
- KORE CI: Cormorant-Headings, Jost-Body, Brass-Akzente (#9E8460), kore-retail.de Branding
- Template-Felder: Absender (KORE), Empfänger (Tenant), Positionen, Summen, Zahlungsziel, USt-ID
- Endpoint: `GET /api/admin/billing/invoices/:id/pdf`

### API-Endpoints

```
GET    /api/admin/billing/invoices             — Liste (Filter: type, status, tenantId; Pagination: page, pageSize)
POST   /api/admin/billing/invoices             — Erstellen (Angebot oder Rechnung)
GET    /api/admin/billing/invoices/:id          — Detail
PATCH  /api/admin/billing/invoices/:id          — Inhalt bearbeiten (nur DRAFT: Items, Notes, Datum)
POST   /api/admin/billing/invoices/:id/status   — Status-Transition (DRAFT→SENT, SENT→PAID, etc.)
DELETE /api/admin/billing/invoices/:id          — Löschen (nur DRAFT)
GET    /api/admin/billing/invoices/:id/pdf      — PDF Download
POST   /api/admin/billing/invoices/:id/send     — Per E-Mail senden (Status → SENT)
POST   /api/admin/billing/generate             — Auto-Rechnungen generieren
GET    /api/admin/billing/stats                — Offene Summe, MRR, Überfällige
```

**Status-Transitionen:** DRAFT → SENT → PAID (oder OVERDUE). QUOTE: DRAFT → SENT → ACCEPTED (oder CANCELED). Nur gültige Transitionen erlaubt.

### Frontend-Seiten

1. **Buchhaltung Übersicht** (`/admin/buchhaltung`)
   - KPI-Cards: Offene Angebote, Offene Rechnungen, Überfällig, MRR
   - Tabs: Angebote | Rechnungen
   - Tabelle mit Filter (Status, Kunde, Zeitraum)
   - Button: "Auto-Rechnungen generieren"

2. **Angebot/Rechnung erstellen** (`/admin/buchhaltung/angebote/neu`)
   - Formular: Kunde (Select), Typ (Angebot/Rechnung), Datum, Zahlungsziel
   - Positionen hinzufügen (Beschreibung, Menge, Einzelpreis)
   - "Aus gebuchten Tools befüllen" Button (auto-fill)
   - Vorschau, Speichern als Entwurf, Senden

3. **Detail-Ansicht** (`/admin/buchhaltung/rechnungen/:id`)
   - Vollständige Ansicht mit Status-History
   - Aktionen: Bearbeiten, PDF herunterladen, Per E-Mail senden, Als bezahlt markieren

---

## 4. Technische Umsetzung

### Neue Dateien

**Server:**
- `server/src/routes/admin/billing.ts` — API-Routes
- `server/src/lib/invoice-pdf.ts` — PDF-Template & Generation
- `server/src/lib/invoice-number.ts` — Nummernkreis-Verwaltung

**Client:**
- `client/src/pages/DashboardPage.tsx` — Neue rollenspezifische Startseite (ersetzt ToolsHomePage auf `/`)
- `client/src/pages/AllToolsPage.tsx` — Bisherige ToolsHomePage, jetzt unter `/tools`
- `client/src/pages/admin/BillingOverviewPage.tsx`
- `client/src/pages/admin/InvoiceCreatePage.tsx`
- `client/src/pages/admin/InvoiceDetailPage.tsx`
- `client/src/hooks/useBilling.ts` — React Query Hooks
- `client/src/hooks/useRecentTools.ts` — localStorage-basiertes Tracking
- `client/src/hooks/useDashboardData.ts` — Rollenspezifische Dashboard-Daten

**Prisma:**
- Migration: `Invoice` + `InvoiceItem` Models

### Geänderte Dateien

- `client/src/components/AppSidebar.tsx` — Komplett neu: Zuletzt verwendet + Alle Tools + Admin/Plattform
- `client/src/App.tsx` — Neue Routes: `/tools`, `/admin/buchhaltung/*`
- `server/src/index.ts` — Billing-Routes registrieren
- `prisma/schema.prisma` — Invoice Models

### Geänderte Models

- `prisma/schema.prisma` — `Tenant` Model braucht `invoices Invoice[]` Relation

### Dependencies

- `pdfmake` — PDF-Generierung ohne Chromium (leichtgewichtig für Plesk)
- Keine weiteren neuen Dependencies nötig

---

## 5. Nicht im Scope

- Zahlungsabwicklung (Stripe, PayPal etc.) — Rechnungen werden manuell als bezahlt markiert
- Mahnwesen-Automatisierung — überfällige Status wird angezeigt, kein Auto-Mailing
- Steuererklärung / DATEV-Export — kann später ergänzt werden
- Multi-Währung — nur EUR
- Dashboard-Widgets für tenant_admin/store_manager/learner werden als Phase 2 implementiert (Struktur vorbereitet, aber zunächst Platzhalter-Inhalte)
