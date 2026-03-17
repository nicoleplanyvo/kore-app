import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { hashSync } from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({
  url: process.env['DATABASE_URL'] || 'file:../data/dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Kore Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'nicole@kore-retail.de' },
    update: {},
    create: {
      email: 'nicole@kore-retail.de',
      name: 'Nicole Muñoz Bonilla',
      passwordHash: hashSync('admin1234', 12),
      role: 'kore_admin',
    },
  });
  console.log(`✓ Admin User erstellt: ${admin.email}`);

  // Demo-Tenants (ohne Plan)
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'modehouse-mueller' },
    update: {},
    create: {
      name: 'Modehouse Müller',
      slug: 'modehouse-mueller',
      status: 'ACTIVE',
      contactEmail: 'info@modehouse-mueller.de',
      contactName: 'Thomas Müller',
      contactPhone: '+49 211 1234567',
      maxUsers: 50,
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'boutique-schmidt' },
    update: {},
    create: {
      name: 'Boutique Schmidt',
      slug: 'boutique-schmidt',
      status: 'ACTIVE',
      contactEmail: 'kontakt@boutique-schmidt.de',
      contactName: 'Anna Schmidt',
      contactPhone: '+49 221 7654321',
      maxUsers: 15,
    },
  });

  const tenant3 = await prisma.tenant.upsert({
    where: { slug: 'luxus-retail-gmbh' },
    update: {},
    create: {
      name: 'Luxus Retail GmbH',
      slug: 'luxus-retail-gmbh',
      status: 'TRIALING',
      contactEmail: 'management@luxus-retail.de',
      contactName: 'Dr. Markus Weber',
      contactPhone: '+49 89 9876543',
      maxUsers: 200,
    },
  });

  console.log(`✓ Demo-Tenants erstellt: ${tenant1.name}, ${tenant2.name}, ${tenant3.name}`);

  // === Demo-Stores ===
  const stores: { tenantId: string; name: string; city: string; address: string }[] = [
    // Modehouse Müller — 3 Filialen
    { tenantId: tenant1.id, name: 'Düsseldorf Kö', city: 'Düsseldorf', address: 'Königsallee 42' },
    { tenantId: tenant1.id, name: 'Köln Schildergasse', city: 'Köln', address: 'Schildergasse 88' },
    { tenantId: tenant1.id, name: 'Essen Limbecker', city: 'Essen', address: 'Limbecker Platz 1' },
    // Boutique Schmidt — 1 Filiale
    { tenantId: tenant2.id, name: 'Flagship Ehrenfeld', city: 'Köln', address: 'Venloer Str. 201' },
    // Luxus Retail GmbH — 5 Filialen
    { tenantId: tenant3.id, name: 'München Maximilianstr.', city: 'München', address: 'Maximilianstr. 10' },
    { tenantId: tenant3.id, name: 'Berlin KaDeWe', city: 'Berlin', address: 'Tauentzienstr. 21' },
    { tenantId: tenant3.id, name: 'Hamburg Neuer Wall', city: 'Hamburg', address: 'Neuer Wall 35' },
    { tenantId: tenant3.id, name: 'Frankfurt Goethestr.', city: 'Frankfurt', address: 'Goethestr. 12' },
    { tenantId: tenant3.id, name: 'Stuttgart Königstr.', city: 'Stuttgart', address: 'Königstr. 28' },
  ];

  const storeRecords = [];
  for (const s of stores) {
    const existing = await prisma.store.findFirst({
      where: { tenantId: s.tenantId, name: s.name },
    });
    if (existing) {
      storeRecords.push(existing);
    } else {
      const created = await prisma.store.create({ data: s });
      storeRecords.push(created);
    }
  }
  console.log(`✓ ${storeRecords.length} Stores erstellt`);

  // === 34 Tool-Definitionen mit Preisen aus dem Akquisepapier ===
  // priceMonthly in Cent (z.B. 1500 = 15€)
  const tools = [
    // STANDARDS & COMPLIANCE
    { key: 'standards.checklisten', name: 'Checklisten', category: 'STANDARDS_COMPLIANCE', description: 'Standardisierte Checklisten für Store-Visits und Audits', icon: 'ClipboardCheck', priceMonthly: 1500, sortOrder: 1, learnerAccessible: true },
    { key: 'standards.store_standards', name: 'Store Standards', category: 'STANDARDS_COMPLIANCE', description: 'Store-Standards definieren, messen und benchmarken', icon: 'Award', priceMonthly: 1500, sortOrder: 2 },
    { key: 'standards.excellence_tracker', name: 'Excellence Tracker', category: 'STANDARDS_COMPLIANCE', description: 'Store Excellence Audit mit Foto-Proof und Scoring', icon: 'TrendingUp', priceMonthly: 1900, sortOrder: 3 },
    { key: 'standards.vm_foto_compliance', name: 'VM Foto-Compliance', category: 'STANDARDS_COMPLIANCE', description: 'Foto-basierte VM-Compliance-Checks mit KI-Unterstützung', icon: 'Camera', priceMonthly: 1900, sortOrder: 4 },
    { key: 'standards.sop_bibliothek', name: 'SOP Bibliothek', category: 'STANDARDS_COMPLIANCE', description: 'Zentrale Verwaltung aller Standard Operating Procedures', icon: 'BookOpen', priceMonthly: 1500, sortOrder: 5 },

    // PERFORMANCE & SICHTBARKEIT
    { key: 'performance.kpi_dashboard', name: 'KPI Dashboard', category: 'PERFORMANCE', description: 'Echtzeit-KPI-Dashboard mit allen relevanten Kennzahlen', icon: 'BarChart3', priceMonthly: 1900, sortOrder: 1 },
    { key: 'performance.budget_tracker', name: 'Budget Tracker', category: 'PERFORMANCE', description: 'Umsatz-Ziele verfolgen und Fortschritt pro Store messen', icon: 'Target', priceMonthly: 1500, sortOrder: 2 },
    { key: 'performance.forecast', name: 'Forecast', category: 'PERFORMANCE', description: 'Umsatz- und Performance-Prognosen mit KI', icon: 'LineChart', priceMonthly: 2500, sortOrder: 3 },
    { key: 'performance.loss_prevention', name: 'Loss Prevention', category: 'PERFORMANCE', description: 'Schwund-Erkennung und Verlustprävention', icon: 'Shield', priceMonthly: 1500, sortOrder: 4 },
    { key: 'performance.inventory', name: 'Inventory', category: 'PERFORMANCE', description: 'Bestandsmanagement und Inventur-Automatisierung', icon: 'Package', priceMonthly: 1900, sortOrder: 5 },

    // FLOOR IN ECHTZEIT
    { key: 'floor.live_floor', name: 'Live Floor', category: 'FLOOR', description: 'Echtzeit-Überblick über Verkaufsfläche und Personal', icon: 'Monitor', priceMonthly: 1900, sortOrder: 1 },
    { key: 'floor.fr_tracking', name: 'FR Tracking', category: 'FLOOR', description: 'Footfall & Revenue Tracking in Echtzeit', icon: 'Activity', priceMonthly: 1900, sortOrder: 2 },
    { key: 'floor.vm_guidelines', name: 'VM Guidelines', category: 'FLOOR', description: 'Visual-Merchandising-Richtlinien digital verwalten', icon: 'Palette', priceMonthly: 1500, sortOrder: 3 },
    { key: 'floor.maintenance', name: 'Maintenance', category: 'FLOOR', description: 'Store-Wartung und Reparatur-Management', icon: 'Wrench', priceMonthly: 1000, sortOrder: 4 },

    // TRAINING & ENTWICKLUNG
    { key: 'training.training_hub_lms', name: 'Training Hub / LMS', category: 'TRAINING', description: 'Learning-Management-System mit Kursen und Zertifikaten', icon: 'GraduationCap', priceMonthly: 2500, sortOrder: 1, learnerAccessible: true },
    { key: 'training.training_hours', name: 'Training Hours', category: 'TRAINING', description: 'Trainingszeiten erfassen und analysieren', icon: 'Clock', priceMonthly: 1000, sortOrder: 2 },
    { key: 'training.challenges', name: 'Challenges', category: 'TRAINING', description: 'Team-Challenges und Gamification für Mitarbeiter', icon: 'Trophy', priceMonthly: 1900, sortOrder: 3, learnerAccessible: true },
    { key: 'training.onboarding', name: 'Onboarding', category: 'TRAINING', description: 'Strukturiertes Onboarding neuer Mitarbeiter', icon: 'UserPlus', priceMonthly: 1900, sortOrder: 4, learnerAccessible: true },

    // COACHING & PEOPLE
    { key: 'coaching.one_on_one', name: '1:1 Coaching', category: 'COACHING_PEOPLE', description: 'Strukturierte 1:1-Coaching-Sessions dokumentieren', icon: 'MessageSquare', priceMonthly: 1900, sortOrder: 1 },
    { key: 'coaching.pdp_pip', name: 'PDP / PIP', category: 'COACHING_PEOPLE', description: 'Personal Development & Performance Improvement Plans', icon: 'Compass', priceMonthly: 1500, sortOrder: 2 },
    { key: 'coaching.appraisals', name: 'Appraisals', category: 'COACHING_PEOPLE', description: 'Mitarbeitergespräche und Leistungsbeurteilungen', icon: 'Star', priceMonthly: 1500, sortOrder: 3 },
    { key: 'coaching.shift_planning', name: 'Shift Planning', category: 'COACHING_PEOPLE', description: 'Intelligente Schichtplanung und Personalabdeckung', icon: 'CalendarDays', priceMonthly: 2500, sortOrder: 4 },
    { key: 'coaching.pulse_survey', name: 'Pulse Survey', category: 'COACHING_PEOPLE', description: 'Regelmäßige Mitarbeiter-Pulsbefragungen', icon: 'Heart', priceMonthly: 1500, sortOrder: 5 },
    { key: 'coaching.wellbeing', name: 'Wellbeing', category: 'COACHING_PEOPLE', description: 'Mitarbeiter-Wellbeing-Tracking und Ressourcen', icon: 'Smile', priceMonthly: 1500, sortOrder: 6 },

    // KOMMUNIKATION & SIGNAL
    { key: 'komm.briefings', name: 'Briefings', category: 'KOMMUNIKATION', description: 'Tägliche Store-Briefings digital verteilen', icon: 'FileText', priceMonthly: 1000, sortOrder: 1, learnerAccessible: true },
    { key: 'komm.handover', name: 'Handover', category: 'KOMMUNIKATION', description: 'Schichtübergabe-Protokolle digital abbilden', icon: 'ArrowLeftRight', priceMonthly: 1000, sortOrder: 2 },
    { key: 'komm.team_push', name: 'Team Push', category: 'KOMMUNIKATION', description: 'Push-Nachrichten an Store-Teams senden', icon: 'Bell', priceMonthly: 1000, sortOrder: 3 },
    { key: 'komm.team_newsletter', name: 'Team Newsletter', category: 'KOMMUNIKATION', description: 'Interne Newsletter für Teams erstellen', icon: 'Mail', priceMonthly: 1500, sortOrder: 4 },

    // CUSTOMER, CLIENTELING & STOCK
    { key: 'customer.fr_conversion', name: 'FR Conversion', category: 'CUSTOMER_STOCK', description: 'Footfall-to-Revenue Conversion optimieren', icon: 'TrendingUp', priceMonthly: 1900, sortOrder: 1 },
    { key: 'customer.clienteling_crm', name: 'Clienteling / CRM', category: 'CUSTOMER_STOCK', description: 'Kundenbeziehungsmanagement und VIP-Betreuung', icon: 'Users', priceMonthly: 2500, sortOrder: 2 },
    { key: 'customer.stock_callouts', name: 'Stock Callouts', category: 'CUSTOMER_STOCK', description: 'Bestandsmeldungen und Nachbestellungen', icon: 'PackageSearch', priceMonthly: 1500, sortOrder: 3 },
    { key: 'customer.track_trace', name: 'Track & Trace', category: 'CUSTOMER_STOCK', description: 'Warenverfolgung und Lieferstatus für Kunden', icon: 'Navigation', priceMonthly: 1900, sortOrder: 4 },

    // REGIONAL INSIGHTS
    { key: 'regional.multi_store_view', name: 'Multi-Store View', category: 'REGIONAL_INSIGHTS', description: 'Vergleichende Ansicht aller Stores einer Region', icon: 'Map', priceMonthly: 3500, sortOrder: 1 },
    { key: 'regional.rm_dashboard', name: 'RM Dashboard', category: 'REGIONAL_INSIGHTS', description: 'Regional-Manager-Dashboard mit aggregierten KPIs', icon: 'LayoutDashboard', priceMonthly: 2500, sortOrder: 2 },
  ];

  for (const t of tools) {
    const { learnerAccessible, ...rest } = t as typeof t & { learnerAccessible?: boolean };
    await prisma.toolDefinition.upsert({
      where: { key: t.key },
      update: { name: t.name, description: t.description, category: t.category, icon: t.icon, priceMonthly: t.priceMonthly, sortOrder: t.sortOrder, learnerAccessible: learnerAccessible ?? false },
      create: { ...rest, learnerAccessible: learnerAccessible ?? false },
    });
  }
  console.log(`✓ ${tools.length} Tool-Definitionen erstellt`);

  // === Demo-Tool-Zuweisungen pro Store ===
  const allTools = await prisma.toolDefinition.findMany();
  const toolMap = Object.fromEntries(allTools.map((t) => [t.key, t.id]));

  // Modehouse Müller Stores — mittleres Paket (14 Tools pro Store)
  const muellerToolKeys = [
    'standards.checklisten', 'standards.store_standards', 'standards.excellence_tracker',
    'standards.vm_foto_compliance', 'standards.sop_bibliothek',
    'performance.kpi_dashboard', 'performance.budget_tracker',
    'floor.live_floor', 'floor.vm_guidelines',
    'training.training_hub_lms', 'training.training_hours', 'training.challenges',
    'coaching.one_on_one', 'coaching.shift_planning', 'coaching.appraisals',
    'komm.briefings',
    'customer.clienteling_crm',
  ];

  // Boutique Schmidt — kleines Paket (5 Tools)
  const schmidtToolKeys = [
    'standards.checklisten',
    'performance.kpi_dashboard',
    'training.training_hub_lms',
    'coaching.shift_planning',
    'komm.briefings',
  ];

  // Luxus Retail — großes Paket (20+ Tools pro Store)
  const luxusToolKeys = [
    'standards.checklisten', 'standards.store_standards', 'standards.excellence_tracker', 'standards.vm_foto_compliance', 'standards.sop_bibliothek',
    'performance.kpi_dashboard', 'performance.budget_tracker', 'performance.forecast', 'performance.inventory',
    'floor.live_floor', 'floor.fr_tracking', 'floor.vm_guidelines',
    'training.training_hub_lms', 'training.challenges', 'training.onboarding',
    'coaching.one_on_one', 'coaching.appraisals', 'coaching.shift_planning', 'coaching.pulse_survey',
    'customer.clienteling_crm', 'customer.fr_conversion', 'customer.stock_callouts',
    'regional.multi_store_view', 'regional.rm_dashboard',
  ];

  async function assignTools(storeIds: string[], toolKeys: string[]) {
    for (const storeId of storeIds) {
      for (const key of toolKeys) {
        const toolId = toolMap[key];
        if (!toolId) continue;
        const existing = await prisma.storeToolAssignment.findUnique({
          where: { storeId_toolId: { storeId, toolId } },
        });
        if (!existing) {
          await prisma.storeToolAssignment.create({
            data: { storeId, toolId },
          });
        }
      }
    }
  }

  const muellerStoreIds = storeRecords.filter((s) => s.tenantId === tenant1.id).map((s) => s.id);
  const schmidtStoreIds = storeRecords.filter((s) => s.tenantId === tenant2.id).map((s) => s.id);
  const luxusStoreIds = storeRecords.filter((s) => s.tenantId === tenant3.id).map((s) => s.id);

  await assignTools(muellerStoreIds, muellerToolKeys);
  await assignTools(schmidtStoreIds, schmidtToolKeys);
  await assignTools(luxusStoreIds, luxusToolKeys);

  console.log('✓ Store-Tool-Zuweisungen erstellt');

  // === Demo-User für alle Rollen (Modehouse Müller) ===
  const demoPassword = hashSync('demo1234', 12);

  const demoUsers = [
    {
      email: 'ta@modehouse.de',
      name: 'Thomas Müller (Admin)',
      role: 'tenant_admin',
      tenantId: tenant1.id,
      storeIds: muellerStoreIds, // alle 3 Stores
    },
    {
      email: 'rm@modehouse.de',
      name: 'Regina Meyer (Regional)',
      role: 'regional_manager',
      tenantId: tenant1.id,
      storeIds: muellerStoreIds, // alle 3 Stores
    },
    {
      email: 'mm@modehouse.de',
      name: 'Marco Müller (Multisite)',
      role: 'multisite_manager',
      tenantId: tenant1.id,
      storeIds: muellerStoreIds.slice(0, 2), // 2 Stores
    },
    {
      email: 'sm@modehouse.de',
      name: 'Sarah Klein (Store)',
      role: 'store_manager',
      tenantId: tenant1.id,
      storeIds: muellerStoreIds.slice(0, 1), // 1 Store
    },
    {
      email: 'learner@modehouse.de',
      name: 'Lisa Becker (Mitarbeiter)',
      role: 'learner',
      tenantId: tenant1.id,
      storeIds: muellerStoreIds.slice(0, 1), // 1 Store
    },
  ];

  for (const du of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: du.email },
      update: {},
      create: {
        email: du.email,
        name: du.name,
        passwordHash: demoPassword,
        role: du.role,
        tenantId: du.tenantId,
      },
    });

    // Store-Zuweisungen
    for (const storeId of du.storeIds) {
      const existing = await prisma.userStoreAssignment.findUnique({
        where: { userId_storeId: { userId: user.id, storeId } },
      });
      if (!existing) {
        await prisma.userStoreAssignment.create({
          data: { userId: user.id, storeId },
        });
      }
    }
  }

  console.log(`✓ ${demoUsers.length} Demo-User erstellt (ta/rm/mm/sm/learner @modehouse.de, Passwort: demo1234)`);

  // === Regionen für Modehouse Müller ===
  const regionNRW = await prisma.region.upsert({
    where: { id: 'region-nrw-mueller' },
    update: {},
    create: {
      id: 'region-nrw-mueller',
      tenantId: tenant1.id,
      name: 'NRW',
      description: 'Nordrhein-Westfalen — Düsseldorf, Köln, Essen',
      sortOrder: 0,
    },
  });

  const regionBayern = await prisma.region.upsert({
    where: { id: 'region-bayern-mueller' },
    update: {},
    create: {
      id: 'region-bayern-mueller',
      tenantId: tenant1.id,
      name: 'Bayern',
      description: 'Bayern — zukünftige Expansion',
      sortOrder: 1,
    },
  });

  console.log(`✓ Regionen erstellt: ${regionNRW.name}, ${regionBayern.name}`);

  // Stores den Regionen zuordnen (alle 3 Müller-Stores → NRW)
  for (const storeId of muellerStoreIds) {
    await prisma.store.update({
      where: { id: storeId },
      data: { regionId: regionNRW.id },
    });
  }
  console.log('✓ Müller-Stores der Region NRW zugeordnet');

  // UserRegionAssignment für rm@modehouse.de → NRW
  const rmUser = await prisma.user.findUnique({ where: { email: 'rm@modehouse.de' } });
  if (rmUser) {
    const existingRegionAssignment = await prisma.userRegionAssignment.findUnique({
      where: { userId_regionId: { userId: rmUser.id, regionId: regionNRW.id } },
    });
    if (!existingRegionAssignment) {
      await prisma.userRegionAssignment.create({
        data: { userId: rmUser.id, regionId: regionNRW.id },
      });
    }
    console.log('✓ Region-Zuweisung: rm@modehouse.de → NRW');
  }

  // ============================================================
  // Store Excellence Audit — KORE Default-Template
  // ============================================================

  const existingTemplate = await prisma.auditTemplate.findFirst({
    where: { isDefault: true, name: 'KORE Store Excellence Standard' },
  });

  if (!existingTemplate) {
    await prisma.auditTemplate.create({
      data: {
        name: 'KORE Store Excellence Standard',
        description: 'KORE Standard-Template für Store Excellence Audits. Deckt alle wesentlichen Bereiche eines Premium-Retail-Stores ab.',
        tenantId: null,
        isDefault: true,
        createdBy: admin.id,
        categories: {
          create: [
            {
              name: 'Kundenansprache & Service',
              description: 'Begrüßung, Beratungsqualität, Verabschiedung',
              sortOrder: 0,
              weight: 1.5,
              criteria: {
                create: [
                  { name: 'Aktive Begrüßung innerhalb 30 Sekunden', sortOrder: 0, isRequired: true, photoRequired: false },
                  { name: 'Bedarfsanalyse durchgeführt', sortOrder: 1, isRequired: true, photoRequired: false },
                  { name: 'Produktwissen demonstriert', sortOrder: 2, isRequired: true, photoRequired: false },
                  { name: 'Cross-Selling / Up-Selling angeboten', sortOrder: 3, isRequired: false, photoRequired: false },
                  { name: 'Freundliche Verabschiedung', sortOrder: 4, isRequired: true, photoRequired: false },
                ],
              },
            },
            {
              name: 'Visual Merchandising',
              description: 'Schaufenster, Warenpräsentation, Beschilderung',
              sortOrder: 1,
              weight: 1.2,
              criteria: {
                create: [
                  { name: 'Schaufenster aktuell und ansprechend', sortOrder: 0, isRequired: true, photoRequired: true },
                  { name: 'Eingangsbereich einladend', sortOrder: 1, isRequired: true, photoRequired: true },
                  { name: 'Warenpräsentation nach VM-Guideline', sortOrder: 2, isRequired: true, photoRequired: true },
                  { name: 'Preisauszeichnung vollständig', sortOrder: 3, isRequired: true, photoRequired: false },
                  { name: 'Kampagnen-Material korrekt platziert', sortOrder: 4, isRequired: false, photoRequired: true },
                ],
              },
            },
            {
              name: 'Sauberkeit & Ordnung',
              description: 'Verkaufsfläche, Umkleide, Kassenbereich',
              sortOrder: 2,
              weight: 1.0,
              criteria: {
                create: [
                  { name: 'Verkaufsfläche sauber und aufgeräumt', sortOrder: 0, isRequired: true, photoRequired: false },
                  { name: 'Umkleidekabinen ordentlich', sortOrder: 1, isRequired: true, photoRequired: true },
                  { name: 'Kassenbereich aufgeräumt', sortOrder: 2, isRequired: true, photoRequired: false },
                  { name: 'Lagerbereich organisiert', sortOrder: 3, isRequired: false, photoRequired: false },
                ],
              },
            },
            {
              name: 'Team & Erscheinungsbild',
              description: 'Dresscode, Namensschilder, Teamverhalten',
              sortOrder: 3,
              weight: 0.8,
              criteria: {
                create: [
                  { name: 'Dresscode eingehalten', sortOrder: 0, isRequired: true, photoRequired: false },
                  { name: 'Namensschilder getragen', sortOrder: 1, isRequired: true, photoRequired: false },
                  { name: 'Professionelles Auftreten', sortOrder: 2, isRequired: true, photoRequired: false },
                  { name: 'Ausreichend Personal auf der Fläche', sortOrder: 3, isRequired: true, photoRequired: false },
                ],
              },
            },
            {
              name: 'Operative Prozesse',
              description: 'Kasse, Retouren, Warenwirtschaft',
              sortOrder: 4,
              weight: 1.0,
              criteria: {
                create: [
                  { name: 'Kassenprozess effizient', sortOrder: 0, isRequired: true, photoRequired: false },
                  { name: 'Retouren-Prozess korrekt', sortOrder: 1, isRequired: true, photoRequired: false },
                  { name: 'Wareneingang zeitnah verarbeitet', sortOrder: 2, isRequired: false, photoRequired: false },
                  { name: 'Inventur-Differenzen im Rahmen', sortOrder: 3, isRequired: false, photoRequired: false },
                  { name: 'Briefing / Handover dokumentiert', sortOrder: 4, isRequired: true, photoRequired: false },
                ],
              },
            },
            {
              name: 'KPI-Awareness',
              description: 'Kenntnis und Kommunikation der Store-KPIs',
              sortOrder: 5,
              weight: 0.5,
              criteria: {
                create: [
                  { name: 'Tagesumsatz-Ziel bekannt', sortOrder: 0, isRequired: true, photoRequired: false },
                  { name: 'Conversion-Rate bewusst', sortOrder: 1, isRequired: false, photoRequired: false },
                  { name: 'UPT-Ziel kommuniziert', sortOrder: 2, isRequired: false, photoRequired: false },
                  { name: 'Team-Challenges aktiv', sortOrder: 3, isRequired: false, photoRequired: false },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✓ KORE Store Excellence Default-Template erstellt (6 Kategorien, 27 Kriterien)');
  } else {
    console.log('✓ KORE Store Excellence Default-Template bereits vorhanden');
  }

  // ============================================================
  // Checklisten — KORE Default-Template "Store Visit Checklist"
  // ============================================================

  const existingChecklist = await prisma.checklistTemplate.findFirst({
    where: { isDefault: true, name: 'Store Visit Checklist' },
  });

  if (!existingChecklist) {
    await prisma.checklistTemplate.create({
      data: {
        name: 'Store Visit Checklist',
        description: 'KORE Standard-Checkliste für regelmäßige Store-Visits. Deckt Sauberkeit, VM und Personal ab.',
        tenantId: null,
        isDefault: true,
        createdBy: admin.id,
        sections: {
          create: [
            {
              name: 'Sauberkeit & Ordnung',
              sortOrder: 0,
              items: {
                create: [
                  { text: 'Eingangsbereiche sauber', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Regale aufgeräumt', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Umkleidekabinen geprüft', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                  { text: 'Toiletten sauber', type: 'BOOLEAN', isRequired: false, sortOrder: 3 },
                  { text: 'Lagerraum ordentlich', type: 'BOOLEAN', isRequired: false, sortOrder: 4 },
                ],
              },
            },
            {
              name: 'Visual Merchandising',
              sortOrder: 1,
              items: {
                create: [
                  { text: 'Schaufenster aktuell', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Produktpräsentation korrekt', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Preisauszeichnung vollständig', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                  { text: 'Beleuchtung funktioniert', type: 'BOOLEAN', isRequired: false, sortOrder: 3 },
                ],
              },
            },
            {
              name: 'Personal & Service',
              sortOrder: 2,
              items: {
                create: [
                  { text: 'Alle Mitarbeiter in Uniform', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Personalstärke planmäßig', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Begrüßung an der Tür', type: 'BOOLEAN', isRequired: false, sortOrder: 2 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✓ KORE Checklisten Default-Template erstellt (3 Sektionen, 12 Items)');
  } else {
    console.log('✓ KORE Checklisten Default-Template bereits vorhanden');
  }

  // ============================================================
  // SOP Bibliothek — KORE Default-Kategorien und SOPs
  // ============================================================

  const existingSopCat = await prisma.sopCategory.findFirst({
    where: { isActive: true, tenantId: null, name: 'Abläufe' },
  });

  if (!existingSopCat) {
    const catAblaeufe = await prisma.sopCategory.create({
      data: { name: 'Abläufe', sortOrder: 0, tenantId: null },
    });
    const catKundenservice = await prisma.sopCategory.create({
      data: { name: 'Kundenservice', sortOrder: 1, tenantId: null },
    });
    const catSicherheit = await prisma.sopCategory.create({
      data: { name: 'Sicherheit', sortOrder: 2, tenantId: null },
    });

    await prisma.sop.create({
      data: {
        title: 'Kassenabschluss',
        categoryId: catAblaeufe.id,
        tenantId: null,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: admin.id,
        content: `# Kassenabschluss — Standard Operating Procedure

## Ziel
Sicherstellen, dass der tägliche Kassenabschluss korrekt, vollständig und nachvollziehbar durchgeführt wird.

## Verantwortlich
Store Manager oder Schichtleiter

## Ablauf

### 1. Vorbereitung
- Letzte Transaktion abwarten
- Kasse auf "Abschluss" setzen

### 2. Zählung
- Bargeld zählen und mit Kassenbericht abgleichen
- EC-/Kreditkarten-Summen prüfen
- Differenzen dokumentieren

### 3. Dokumentation
- Kassenabschlussbericht drucken
- Unterschrift des Verantwortlichen
- Bei Differenz > 5€: Meldung an Regional Manager

### 4. Sicherung
- Bargeld im Tresor einschließen
- Kassenlade leeren und offen lassen
- Kassenbericht ablegen`,
      },
    });

    await prisma.sop.create({
      data: {
        title: 'Reklamationsbearbeitung',
        categoryId: catKundenservice.id,
        tenantId: null,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: admin.id,
        content: `# Reklamationsbearbeitung — Standard Operating Procedure

## Ziel
Kundenreklamationen professionell, fair und effizient bearbeiten.

## Verantwortlich
Alle Mitarbeiter (Eskalation an Store Manager)

## Ablauf

### 1. Annahme
- Kunden freundlich begrüßen und ausreden lassen
- Kaufbeleg und Ware prüfen
- Reklamationsgrund dokumentieren

### 2. Prüfung
- Ware innerhalb der Rückgabefrist? (14 Tage Standard)
- Originalzustand? Etiketten vorhanden?
- Bei Mängeln: Fotos anfertigen

### 3. Entscheidung
- **Umtausch:** Bevorzugte Lösung anbieten
- **Gutschein:** Bei fehlendem Beleg möglich
- **Rückerstattung:** Auf Original-Zahlungsweg
- **Ablehnung:** Nur bei getragener/beschädigter Ware, freundlich erklären

### 4. Dokumentation
- Im System erfassen
- Bei Serienreklamation: Meldung an Einkauf`,
      },
    });

    await prisma.sop.create({
      data: {
        title: 'Notfallplan',
        categoryId: catSicherheit.id,
        tenantId: null,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: admin.id,
        content: `# Notfallplan — Standard Operating Procedure

## Ziel
Sicherstellen, dass alle Mitarbeiter im Notfall richtig reagieren.

## Verantwortlich
Alle Mitarbeiter, Koordination durch Store Manager

## Notfälle

### Brand
1. Feueralarm auslösen
2. Kunden und Mitarbeiter zum Notausgang leiten
3. Feuerwehr rufen (112)
4. Sammelplatz aufsuchen
5. Anwesenheitskontrolle durchführen

### Medizinischer Notfall
1. Situation einschätzen
2. Rettungsdienst rufen (112)
3. Erste Hilfe leisten (Ersthelfer aus dem Team)
4. Bereich absichern
5. Vorfall dokumentieren

### Diebstahl / Überfall
1. Eigene Sicherheit geht vor
2. Anweisungen des Täters folgen
3. Nach Möglichkeit: Beschreibung merken
4. Polizei rufen (110) sobald sicher
5. Nichts verändern bis Polizei eintrifft

### Evakuierung
1. Durchsage oder Signal beachten
2. Ruhig aber bestimmt Kunden zum Ausgang leiten
3. Aufzüge NICHT benutzen
4. Sammelplatz aufsuchen
5. Store Manager meldet Vollständigkeit`,
      },
    });

    console.log('✓ SOP Bibliothek: 3 Kategorien + 3 Default-SOPs erstellt');
  } else {
    console.log('✓ SOP Bibliothek Default-Daten bereits vorhanden');
  }

  // ============================================================
  // Store Standards — KORE Default-Kategorie + Definitionen
  // ============================================================

  const existingStdCat = await prisma.standardCategory.findFirst({
    where: { isActive: true, tenantId: null, name: 'Basis Standards' },
  });

  if (!existingStdCat) {
    const basisCat = await prisma.standardCategory.create({
      data: {
        name: 'Basis Standards',
        description: 'Grundlegende Store-Standards, die für alle Filialen gelten.',
        sortOrder: 0,
        tenantId: null,
      },
    });

    const definitions = [
      { name: 'Sauberkeits-Score', description: 'Mindest-Score bei Sauberkeits-Checks', unit: '%', targetValue: 85, operator: 'GTE', weight: 1.5, sortOrder: 0 },
      { name: 'VM-Compliance', description: 'Visual-Merchandising-Compliance-Rate', unit: '%', targetValue: 90, operator: 'GTE', weight: 1.0, sortOrder: 1 },
      { name: 'Wartezeit Kasse', description: 'Maximale durchschnittliche Wartezeit an der Kasse', unit: 'min', targetValue: 3, operator: 'LTE', weight: 1.0, sortOrder: 2 },
      { name: 'Personaldeckung', description: 'Mindest-Personaldeckung gemäß Schichtplan', unit: '%', targetValue: 95, operator: 'GTE', weight: 1.2, sortOrder: 3 },
      { name: 'Mystery-Shopper-Score', description: 'Mindest-Score bei Mystery-Shopping-Bewertungen', unit: '%', targetValue: 80, operator: 'GTE', weight: 1.5, sortOrder: 4 },
    ];

    for (const def of definitions) {
      await prisma.standardDefinition.create({
        data: {
          ...def,
          categoryId: basisCat.id,
          tenantId: null,
        },
      });
    }

    console.log('✓ Store Standards: Kategorie "Basis Standards" + 5 Definitionen erstellt');
  } else {
    console.log('✓ Store Standards Default-Daten bereits vorhanden');
  }

  // ============================================================
  // VM Foto-Compliance — Default-Guidelines für Modehouse Müller
  // ============================================================

  const existingVmGuideline = await prisma.vmGuideline.findFirst({
    where: { tenantId: tenant1.id, name: 'Schaufenster Haupteingang' },
  });

  if (!existingVmGuideline) {
    const vmGuidelines = [
      { name: 'Schaufenster Haupteingang', description: 'Aktuelle Kampagne im Hauptschaufenster korrekt umgesetzt', category: 'Schaufenster', sortOrder: 0 },
      { name: 'Schaufenster Seite', description: 'Seitliches Schaufenster mit saisonaler Dekoration', category: 'Schaufenster', sortOrder: 1 },
      { name: 'Eingangsbereich', description: 'Welcome-Table und Saison-Highlights am Eingang', category: 'Eingang', sortOrder: 2 },
      { name: 'Kassenzone', description: 'Impulskauf-Artikel und Kampagnen-Material an der Kasse', category: 'Kasse', sortOrder: 3 },
      { name: 'Warenträger A-Zone', description: 'Hauptverkaufsfläche: Premium-Warenträger nach VM-Plan', category: 'Verkaufsfläche', sortOrder: 4 },
      { name: 'Umkleide-Bereich', description: 'Sauberkeit und Spiegel-Qualität im Umkleidebereich', category: 'Umkleide', sortOrder: 5 },
    ];

    for (const g of vmGuidelines) {
      await prisma.vmGuideline.create({
        data: { ...g, tenantId: tenant1.id, createdBy: admin.id },
      });
    }
    console.log('✓ VM Foto-Compliance: 6 Default-Guidelines erstellt');
  } else {
    console.log('✓ VM Foto-Compliance Default-Guidelines bereits vorhanden');
  }

  // ============================================================
  // VM Guidelines — Default-Dokumente für Modehouse Müller
  // ============================================================

  const existingVmDoc = await prisma.vmGuidelineDoc.findFirst({
    where: { tenantId: tenant1.id, title: 'Frühjahr/Sommer Kampagne' },
  });

  if (!existingVmDoc) {
    await prisma.vmGuidelineDoc.create({
      data: {
        tenantId: tenant1.id,
        title: 'Frühjahr/Sommer Kampagne',
        category: 'Kampagnen',
        content: `# Frühjahr/Sommer Kampagne — VM Guideline

## Kampagnen-Zeitraum
März bis August

## Schaufenster
- Helle, frische Farben verwenden
- Maximal 3 Outfits pro Schaufenster
- Accessoires auf Podest-Ebene platzieren
- Beleuchtung: warmweiß, 3000K

## Eingangsbereich
- Welcome-Table mit Kampagnen-Highlight
- Max. 2 Outfits auf Torso-Mannequins
- Frische Blumen oder Grünpflanzen

## A-Zone (Hauptverkaufsfläche)
- Farb-Blockung: hell nach dunkel von vorne nach hinten
- Neue Kollektion immer auf Augenhöhe
- Cross-Merchandising mit Accessoires

## Warenträger
- Maximal 20 Teile pro Ständer
- Größen-Sortierung: S-M-L-XL
- Bügel einheitlich ausgerichtet`,
        version: 1,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: admin.id,
      },
    });

    await prisma.vmGuidelineDoc.create({
      data: {
        tenantId: tenant1.id,
        title: 'Mannequin-Styling Guide',
        category: 'Mannequins',
        content: `# Mannequin-Styling Guide

## Grundregeln
- Immer komplette Outfits (Ober- + Unterteil + Schuhe)
- Accessoires: max. 2 pro Mannequin
- Wöchentlich neue Outfits

## Positionierung
- Gruppen von 2-3 Mannequins bilden
- Verschiedene Posen innerhalb einer Gruppe
- Blickrichtung zum Kundenfluss

## Preisauszeichnung
- Preisschilder NICHT am Mannequin
- Preisliste auf separatem Aufsteller daneben`,
        version: 1,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdBy: admin.id,
      },
    });
    console.log('✓ VM Guidelines: 2 Default-Dokumente erstellt');
  } else {
    console.log('✓ VM Guidelines Default-Dokumente bereits vorhanden');
  }

  // ============================================================
  // Live Floor — Default-Zonen für Modehouse Müller Stores
  // ============================================================

  const existingFloorZone = await prisma.floorZone.findFirst({
    where: { tenantId: tenant1.id, name: 'Eingang & Welcome' },
  });

  if (!existingFloorZone) {
    const zoneNames = [
      { name: 'Eingang & Welcome', description: 'Eingangsbereich und Begrüßungszone' },
      { name: 'Damen Oberbekleidung', description: 'Damen Tops, Blusen, Jacken' },
      { name: 'Damen Unterbekleidung', description: 'Damen Hosen, Röcke, Kleider' },
      { name: 'Herren', description: 'Herren-Abteilung komplett' },
      { name: 'Accessoires', description: 'Taschen, Schmuck, Schals' },
      { name: 'Kasse', description: 'Kassenbereich und Verpackung' },
      { name: 'Umkleide', description: 'Umkleidekabinen-Bereich' },
      { name: 'Lager', description: 'Lager und Warenannahme' },
    ];

    for (const store of storeRecords.filter((s) => s.tenantId === tenant1.id)) {
      for (let i = 0; i < zoneNames.length; i++) {
        await prisma.floorZone.create({
          data: {
            tenantId: tenant1.id,
            storeId: store.id,
            name: zoneNames[i].name,
            description: zoneNames[i].description,
            sortOrder: i,
          },
        });
      }
    }
    console.log('✓ Live Floor: Floor-Zonen für alle Müller-Stores erstellt');
  } else {
    console.log('✓ Live Floor Default-Zonen bereits vorhanden');
  }

  // ============================================================
  // Training Hub / LMS — Default-Kurse für Modehouse Müller
  // ============================================================

  const existingCourse = await prisma.course.findFirst({
    where: { tenantId: tenant1.id, title: 'Willkommen bei Modehouse' },
  });

  if (!existingCourse) {
    const course1 = await prisma.course.create({
      data: {
        tenantId: tenant1.id,
        title: 'Willkommen bei Modehouse',
        description: 'Einführungskurs für neue Mitarbeiter — Markenphilosophie, Standards und erste Schritte.',
        category: 'Onboarding',
        durationMinutes: 120,
        isRequired: true,
        status: 'PUBLISHED',
        createdBy: admin.id,
        modules: {
          create: [
            { title: 'Unsere Geschichte', content: '# Unsere Geschichte\n\nModehouse Müller wurde 1975 gegründet und steht seit fast 50 Jahren für Premium-Mode in NRW.\n\n## Unsere Werte\n- Qualität vor Quantität\n- Persönliche Beratung\n- Nachhaltigkeit\n- Teamgeist', sortOrder: 0, durationMinutes: 15 },
            { title: 'Dresscode & Auftreten', content: '# Dresscode & Auftreten\n\n## Allgemeine Regeln\n- Business Casual (schwarz/dunkelblau)\n- Namensschild immer sichtbar tragen\n- Gepflegtes Erscheinungsbild\n- Dezenter Schmuck\n\n## Was vermeiden\n- Sportschuhe\n- Jeans (außer Premium-Denim)\n- Auffällige Logos anderer Marken', sortOrder: 1, durationMinutes: 10 },
            { title: 'Kundenservice-Standards', content: '# Kundenservice-Standards\n\n## Die 4-Schritte-Methode\n1. **Begrüßen** — Innerhalb von 30 Sekunden\n2. **Beraten** — Bedarfsanalyse durchführen\n3. **Begeistern** — Cross-Selling anbieten\n4. **Bedanken** — Freundliche Verabschiedung\n\n## Umgang mit Reklamationen\n- Immer zuhören\n- Verständnis zeigen\n- Lösung anbieten\n- Bei Unsicherheit: Store Manager hinzuziehen', sortOrder: 2, durationMinutes: 25 },
            { title: 'Kassensystem Grundlagen', content: '# Kassensystem Grundlagen\n\n## Tägliche Aufgaben\n- Kasse öffnen und Wechselgeld prüfen\n- Transaktionen korrekt abwickeln\n- Kassenabschluss durchführen\n\n## Zahlungsarten\n- Bar, EC-Karte, Kreditkarte\n- Apple Pay / Google Pay\n- Gutscheine und Rabattcodes', sortOrder: 3, durationMinutes: 30 },
            { title: 'Visual Merchandising Basics', content: '# Visual Merchandising Basics\n\n## Warenträger\n- Max. 20 Teile pro Ständer\n- Größen sortiert: S → XL\n- Bügel einheitlich ausgerichtet\n\n## Farbsortierung\n- Hell nach dunkel (vorne nach hinten)\n- Farbgruppen bilden\n- Akzentfarben als Eye-Catcher', sortOrder: 4, durationMinutes: 20 },
            { title: 'Sicherheit & Notfälle', content: '# Sicherheit & Notfälle\n\n## Notausgänge\n- Standorte kennen und freihalten\n- Sammelplatz: siehe Aushang\n\n## Bei Diebstahl\n- NICHT verfolgen\n- Beschreibung merken\n- Store Manager informieren\n\n## Erste Hilfe\n- Verbandskasten: Lager (rechts)\n- Ersthelfer: siehe Aushang\n- Notruf: 112', sortOrder: 5, durationMinutes: 20 },
          ],
        },
      },
    });

    const course2 = await prisma.course.create({
      data: {
        tenantId: tenant1.id,
        title: 'Produktwissen: Premium-Stoffe',
        description: 'Lerne die wichtigsten Stoffe und Materialien kennen — für kompetente Beratung.',
        category: 'Produktwissen',
        durationMinutes: 60,
        isRequired: false,
        status: 'PUBLISHED',
        createdBy: admin.id,
        modules: {
          create: [
            { title: 'Naturfasern', content: '# Naturfasern\n\n## Baumwolle\n- Weich, atmungsaktiv, pflegeleicht\n- Bio-Baumwolle: GOTS-zertifiziert\n\n## Wolle\n- Merinowolle: fein, nicht kratzend\n- Kaschmir: Premium-Segment\n\n## Seide\n- Empfindlich, Handwäsche\n- Glanz und Tragekomfort', sortOrder: 0, durationMinutes: 20 },
            { title: 'Kunstfasern & Mischgewebe', content: '# Kunstfasern & Mischgewebe\n\n## Polyester\n- Knitterfrei, schnelltrocknend\n- Recyceltes Polyester (rPET)\n\n## Elasthan/Lycra\n- Stretch-Anteil für Komfort\n- Meist 2-5% Beimischung\n\n## Tencel/Lyocell\n- Nachhaltig aus Holzfasern\n- Weich wie Seide, robust wie Baumwolle', sortOrder: 1, durationMinutes: 20 },
            { title: 'Pflegehinweise beraten', content: '# Pflegehinweise\n\n## Waschsymbole erklären\n- Temperatur, Schleudern, Trockner\n- Bügeltemperatur\n\n## Häufige Kundenfragen\n- "Läuft das ein?" — Vorwäsche empfehlen\n- "Kann ich das bügeln?" — Pflegeetikett prüfen\n- "Ist das nachhaltig?" — Zertifikate kennen (GOTS, OEKO-TEX, BCI)', sortOrder: 2, durationMinutes: 20 },
          ],
        },
      },
    });

    const course3 = await prisma.course.create({
      data: {
        tenantId: tenant1.id,
        title: 'Verkaufstechniken für Profis',
        description: 'Fortgeschrittene Verkaufstechniken: Cross-Selling, Upselling und Kundenbindung.',
        category: 'Verkauf',
        durationMinutes: 90,
        isRequired: false,
        status: 'PUBLISHED',
        createdBy: admin.id,
        modules: {
          create: [
            { title: 'Bedarfsanalyse meistern', content: '# Bedarfsanalyse meistern\n\n## Offene Fragen stellen\n- "Für welchen Anlass suchen Sie etwas?"\n- "Welche Farben tragen Sie am liebsten?"\n- "Haben Sie bereits etwas Bestimmtes im Sinn?"\n\n## Aktives Zuhören\n- Nicken und Blickkontakt\n- Zusammenfassen: "Wenn ich richtig verstehe..."', sortOrder: 0, durationMinutes: 30 },
            { title: 'Cross-Selling Strategien', content: '# Cross-Selling Strategien\n\n## Passende Ergänzungen\n- Blazer → Bluse, Tuch, Tasche\n- Kleid → Schuhe, Schmuck, Jacke\n- Hose → Gürtel, Top, Sneaker\n\n## Der richtige Zeitpunkt\n- Nach der Hauptentscheidung\n- "Dazu passt übrigens perfekt..."', sortOrder: 1, durationMinutes: 30 },
            { title: 'Kundenbindung', content: '# Kundenbindung\n\n## Stammkunden erkennen\n- Namen merken und verwenden\n- Präferenzen notieren (CRM)\n- Exklusive Vorschauen anbieten\n\n## Follow-Up\n- Dankes-Nachricht nach großem Kauf\n- Info über neue Kollektion\n- Geburtstagsgruß', sortOrder: 2, durationMinutes: 30 },
          ],
        },
      },
    });

    console.log(`✓ Training Hub: 3 Default-Kurse erstellt (${course1.title}, ${course2.title}, ${course3.title})`);
  } else {
    console.log('✓ Training Hub Default-Kurse bereits vorhanden');
  }

  // ============================================================
  // Onboarding — Default-Template für Modehouse Müller
  // ============================================================

  const existingOnboarding = await prisma.onboardingTemplate.findFirst({
    where: { tenantId: tenant1.id, name: 'Verkaufsberater Onboarding' },
  });

  if (!existingOnboarding) {
    await prisma.onboardingTemplate.create({
      data: {
        tenantId: tenant1.id,
        name: 'Verkaufsberater Onboarding',
        role: 'learner',
        durationDays: 30,
        isDefault: true,
        steps: {
          create: [
            // Woche 1
            { title: 'Team-Vorstellung', description: 'Alle Teammitglieder und den Store Manager kennenlernen', category: 'Tag 1', dayNumber: 1, sortOrder: 0 },
            { title: 'Store-Rundgang', description: 'Alle Bereiche, Notausgänge und Lager kennenlernen', category: 'Tag 1', dayNumber: 1, sortOrder: 1 },
            { title: 'IT-Einrichtung', description: 'Login-Daten, KORE-App, E-Mail-Zugang einrichten', category: 'Tag 1', dayNumber: 1, sortOrder: 2 },
            { title: 'Dresscode besprechen', description: 'Kleiderordnung und Erscheinungsbild klären', category: 'Tag 1', dayNumber: 1, sortOrder: 3 },
            { title: 'Kurs: Willkommen bei Modehouse', description: 'Einführungskurs in der KORE Training Hub absolvieren', category: 'Woche 1', dayNumber: 2, sortOrder: 4 },
            { title: 'Kassensystem-Schulung', description: 'Praxis-Einführung am Kassensystem', category: 'Woche 1', dayNumber: 3, sortOrder: 5 },
            { title: 'VM-Grundlagen-Einweisung', description: 'Visual Merchandising Basics vor Ort lernen', category: 'Woche 1', dayNumber: 4, sortOrder: 6 },
            { title: 'Erster Kundenkontakt (begleitet)', description: 'Ersten Kunden unter Anleitung beraten', category: 'Woche 1', dayNumber: 5, sortOrder: 7 },
            // Woche 2
            { title: 'Produktwissen: Stoffe & Materialien', description: 'Kurs in Training Hub absolvieren', category: 'Woche 2', dayNumber: 8, sortOrder: 8 },
            { title: 'Wareneingang bearbeiten', description: 'Wareneingangs-Prozess lernen und durchführen', category: 'Woche 2', dayNumber: 9, sortOrder: 9 },
            { title: 'SOPs lesen und bestätigen', description: 'Alle relevanten SOPs in der KORE-App durchlesen', category: 'Woche 2', dayNumber: 10, sortOrder: 10 },
            // Woche 3-4
            { title: 'Eigenständige Kundenberatung', description: '5 eigenständige Beratungsgespräche führen', category: 'Woche 3', dayNumber: 15, sortOrder: 11 },
            { title: 'Cross-Selling üben', description: 'Mindestens 3 erfolgreiche Cross-Selling-Versuche', category: 'Woche 3', dayNumber: 18, sortOrder: 12 },
            { title: '1:1 Feedback-Gespräch', description: 'Erstes formelles Feedback mit dem Mentor', category: 'Woche 4', dayNumber: 22, sortOrder: 13 },
            { title: 'Abschluss-Gespräch', description: 'Onboarding-Abschluss mit Store Manager', category: 'Woche 4', dayNumber: 30, sortOrder: 14, isRequired: true },
          ],
        },
      },
    });

    await prisma.onboardingTemplate.create({
      data: {
        tenantId: tenant1.id,
        name: 'Store Manager Onboarding',
        role: 'store_manager',
        durationDays: 60,
        isDefault: true,
        steps: {
          create: [
            { title: 'Regional Manager Einführungsgespräch', description: 'Ziele, Erwartungen und KPIs besprechen', category: 'Tag 1', dayNumber: 1, sortOrder: 0 },
            { title: 'Team kennenlernen', description: 'Einzelgespräche mit jedem Teammitglied', category: 'Woche 1', dayNumber: 2, sortOrder: 1 },
            { title: 'Store-Prozesse verstehen', description: 'Alle operativen Prozesse durchgehen', category: 'Woche 1', dayNumber: 3, sortOrder: 2 },
            { title: 'KORE-Plattform Einführung', description: 'Alle relevanten Tools und Dashboards kennenlernen', category: 'Woche 1', dayNumber: 4, sortOrder: 3 },
            { title: 'Budget & KPIs Review', description: 'Aktuelle Zahlen, Budgets und Ziele analysieren', category: 'Woche 2', dayNumber: 8, sortOrder: 4 },
            { title: 'Schichtplanung übernehmen', description: 'Erste eigene Schichtplanung erstellen', category: 'Woche 2', dayNumber: 10, sortOrder: 5 },
            { title: 'VM-Audit durchführen', description: 'Ersten Store Excellence Audit eigenständig durchführen', category: 'Woche 3', dayNumber: 15, sortOrder: 6 },
            { title: 'Coaching-Sessions starten', description: 'Erste 1:1 Coaching-Sessions mit dem Team', category: 'Woche 4', dayNumber: 22, sortOrder: 7 },
            { title: '30-Tage Review', description: 'Halbzeit-Review mit Regional Manager', category: 'Monat 1', dayNumber: 30, sortOrder: 8 },
            { title: '60-Tage Abschluss', description: 'Finales Assessment und Zielvereinbarung', category: 'Monat 2', dayNumber: 60, sortOrder: 9, isRequired: true },
          ],
        },
      },
    });
    console.log('✓ Onboarding: 2 Default-Templates erstellt (Verkaufsberater + Store Manager)');
  } else {
    console.log('✓ Onboarding Default-Templates bereits vorhanden');
  }

  // ============================================================
  // Shift Planning — Default-Templates für Modehouse Müller Stores
  // ============================================================

  const existingShiftTemplate = await prisma.shiftTemplate.findFirst({
    where: { storeId: muellerStoreIds[0], name: 'Frühschicht' },
  });

  if (!existingShiftTemplate) {
    const shiftTemplates = [
      { name: 'Frühschicht', startTime: '09:00', endTime: '14:00', minStaff: 2, role: 'Verkauf' },
      { name: 'Mittelschicht', startTime: '11:00', endTime: '17:00', minStaff: 2, role: 'Verkauf' },
      { name: 'Spätschicht', startTime: '14:00', endTime: '20:00', minStaff: 2, role: 'Verkauf' },
      { name: 'Kasse Früh', startTime: '09:30', endTime: '14:30', minStaff: 1, role: 'Kasse' },
      { name: 'Kasse Spät', startTime: '14:30', endTime: '20:00', minStaff: 1, role: 'Kasse' },
      { name: 'Store Manager', startTime: '09:00', endTime: '18:00', minStaff: 1, role: 'Management' },
    ];

    for (const storeId of muellerStoreIds) {
      for (let dayOfWeek = 1; dayOfWeek <= 6; dayOfWeek++) { // Mo-Sa
        for (const tmpl of shiftTemplates) {
          await prisma.shiftTemplate.create({
            data: { storeId, dayOfWeek, ...tmpl },
          });
        }
      }
    }
    console.log('✓ Shift Planning: Default-Schicht-Templates für Müller-Stores erstellt');
  } else {
    console.log('✓ Shift Planning Default-Templates bereits vorhanden');
  }

  // ============================================================
  // Pulse Survey — Default-Umfrage-Template für Modehouse Müller
  // ============================================================

  const existingSurvey = await prisma.pulseSurvey.findFirst({
    where: { tenantId: tenant1.id, title: 'Monatliche Mitarbeiterbefragung' },
  });

  if (!existingSurvey) {
    await prisma.pulseSurvey.create({
      data: {
        tenantId: tenant1.id,
        title: 'Monatliche Mitarbeiterbefragung',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isAnonymous: true,
        createdBy: admin.id,
        questions: {
          create: [
            { text: 'Wie zufrieden bist du aktuell mit deiner Arbeit?', type: 'RATING', sortOrder: 0 },
            { text: 'Fühlst du dich von deinem Team unterstützt?', type: 'RATING', sortOrder: 1 },
            { text: 'Wie gut kommuniziert dein Store Manager?', type: 'RATING', sortOrder: 2 },
            { text: 'Hast du das Gefühl, dass du dich weiterentwickeln kannst?', type: 'RATING', sortOrder: 3 },
            { text: 'Wie bewertst du die Work-Life-Balance?', type: 'RATING', sortOrder: 4 },
            { text: 'Was läuft gut in deinem Store?', type: 'TEXT', sortOrder: 5 },
            { text: 'Was könnte verbessert werden?', type: 'TEXT', sortOrder: 6 },
            { text: 'Wie wahrscheinlich würdest du Modehouse als Arbeitgeber empfehlen? (1-10)', type: 'RATING', sortOrder: 7 },
          ],
        },
      },
    });
    console.log('✓ Pulse Survey: Default-Umfrage mit 8 Fragen erstellt');
  } else {
    console.log('✓ Pulse Survey Default-Daten bereits vorhanden');
  }

  // ============================================================
  // Wellbeing — Default-Ressourcen für Modehouse Müller
  // ============================================================

  const existingWellbeing = await prisma.wellbeingResource.findFirst({
    where: { tenantId: tenant1.id, title: 'Stressbewältigung im Retail' },
  });

  if (!existingWellbeing) {
    const resources = [
      { title: 'Stressbewältigung im Retail', category: 'Mental Health', description: '5 bewährte Techniken gegen Stress im Einzelhandel: Atemübungen, Micro-Breaks, Priorisierung, Kommunikation und Grenzen setzen.' },
      { title: 'Ergonomie am Arbeitsplatz', category: 'Körperliche Gesundheit', description: 'Tipps für richtiges Stehen, Heben und Bewegen — speziell für den stationären Handel.' },
      { title: 'Konfliktlösung im Team', category: 'Teamkultur', description: 'Wie du Konflikte konstruktiv ansprichst und gemeinsam Lösungen findest.' },
      { title: 'Mitarbeiter-Hotline', category: 'Unterstützung', description: 'Vertrauliche Beratung bei persönlichen oder beruflichen Herausforderungen. 24/7 erreichbar.', url: 'tel:+4980012345678' },
      { title: 'Achtsamkeits-Übungen (5 Min)', category: 'Mental Health', description: 'Kurze Achtsamkeitsübungen für die Pause — ideal für zwischendurch.' },
    ];

    for (const r of resources) {
      await prisma.wellbeingResource.create({
        data: { ...r, tenantId: tenant1.id },
      });
    }
    console.log('✓ Wellbeing: 5 Default-Ressourcen erstellt');
  } else {
    console.log('✓ Wellbeing Default-Ressourcen bereits vorhanden');
  }

  // ============================================================
  // Appraisals — Default-Zyklus für Modehouse Müller
  // ============================================================

  const existingCycle = await prisma.appraisalCycle.findFirst({
    where: { tenantId: tenant1.id, name: 'H1 2026 Performance Review' },
  });

  if (!existingCycle) {
    await prisma.appraisalCycle.create({
      data: {
        tenantId: tenant1.id,
        name: 'H1 2026 Performance Review',
        period: 'H1 2026',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-30'),
        status: 'ACTIVE',
      },
    });
    console.log('✓ Appraisals: Default-Zyklus "H1 2026 Performance Review" erstellt');
  } else {
    console.log('✓ Appraisals Default-Zyklus bereits vorhanden');
  }

  // ============================================================
  // Challenges — Default-Challenge für Modehouse Müller
  // ============================================================

  const existingChallenge = await prisma.challenge.findFirst({
    where: { tenantId: tenant1.id, title: 'Cross-Selling Meister' },
  });

  if (!existingChallenge) {
    const taUser = await prisma.user.findUnique({ where: { email: 'ta@modehouse.de' } });

    if (taUser) {
      // Template erstellen
      await prisma.challengeTemplate.create({
        data: {
          tenantId: tenant1.id,
          title: 'Monats-Verkaufs-Challenge',
          description: 'Standard-Template für monatliche Verkaufswettbewerbe.',
          scope: 'INDIVIDUAL',
          scoringType: 'ABSOLUTE',
          metric: 'Verkaufsabschlüsse',
          targetValue: 30,
          reward: '50 EUR Gutschein',
          tags: 'Verkauf,Monatlich',
          createdBy: taUser.id,
        },
      });

      const challenge1 = await prisma.challenge.create({
        data: {
          tenantId: tenant1.id,
          title: 'Cross-Selling Meister',
          description: 'Wer schafft die meisten Cross-Selling-Abschlüsse in diesem Monat? Mindestens 2 Artikel pro Kauf zählen als Cross-Selling.',
          scope: 'INDIVIDUAL',
          scoringType: 'ABSOLUTE',
          metric: 'cross_selling_count',
          targetValue: 50,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reward: '50 EUR Gutschein + Ehrenplatz im Team-Newsletter',
          rules: 'Mindestens 2 Artikel pro Kauf zählen als Cross-Selling. Retouren werden abgezogen.',
          status: 'ACTIVE',
          visibility: 'PUBLIC',
          participationType: 'OPTIN',
          tags: 'Verkauf,Cross-Selling',
          createdBy: taUser.id,
        },
      });

      const challenge2 = await prisma.challenge.create({
        data: {
          tenantId: tenant1.id,
          title: 'Store-Sauberkeits-Challenge',
          description: 'Welcher Store erreicht den höchsten Sauberkeits-Score bei den nächsten 4 Checklist-Besuchen?',
          scope: 'TEAM',
          scoringType: 'RELATIVE',
          metric: 'cleanliness_score',
          targetValue: 95,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          reward: 'Team-Frühstück für den Gewinner-Store',
          rules: 'Durchschnitt der nächsten 4 Checklist-Scores. Mindestens 3 Bewertungen nötig.',
          status: 'ACTIVE',
          visibility: 'PUBLIC',
          participationType: 'AUTO',
          tags: 'Sauberkeit,Stores',
          createdBy: taUser.id,
        },
      });

      // Demo-Teilnehmer für Challenge 1
      const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
      const learnerUser = await prisma.user.findUnique({ where: { email: 'learner@modehouse.de' } });
      if (smUser && learnerUser) {
        const p1 = await prisma.challengeParticipant.create({
          data: { challengeId: challenge1.id, userId: smUser.id, storeId: muellerStoreIds[0], accepted: true, currentValue: 32, handicap: 1.0 },
        });
        const p2 = await prisma.challengeParticipant.create({
          data: { challengeId: challenge1.id, userId: learnerUser.id, storeId: muellerStoreIds[0], accepted: true, currentValue: 18, handicap: 1.0 },
        });

        // Demo-Einträge
        for (let i = 0; i < 5; i++) {
          const date = new Date();
          date.setDate(date.getDate() - i * 2);
          await prisma.challengeEntry.create({
            data: { challengeId: challenge1.id, participantId: p1.id, value: 5 + Math.round(Math.random() * 3), note: `Tag ${i + 1}`, enteredBy: taUser.id },
          });
          await prisma.challengeEntry.create({
            data: { challengeId: challenge1.id, participantId: p2.id, value: 2 + Math.round(Math.random() * 4), enteredBy: taUser.id },
          });
        }

        // Demo-Teilnehmer für Challenge 2 (Team-Challenge per Store)
        await prisma.challengeParticipant.create({
          data: { challengeId: challenge2.id, storeId: muellerStoreIds[0], teamName: 'Düsseldorf Kö', accepted: true, currentValue: 88, handicap: 1.0 },
        });
        await prisma.challengeParticipant.create({
          data: { challengeId: challenge2.id, storeId: muellerStoreIds[1], teamName: 'Köln Schildergasse', accepted: true, currentValue: 92, handicap: 1.0 },
        });
        if (muellerStoreIds[2]) {
          await prisma.challengeParticipant.create({
            data: { challengeId: challenge2.id, storeId: muellerStoreIds[2], teamName: 'Essen Limbecker', accepted: true, currentValue: 85, handicap: 1.0 },
          });
        }
      }
    }
    console.log('✓ Challenges: 1 Template + 2 Challenges + Teilnehmer + Einträge erstellt');
  } else {
    console.log('✓ Challenges Default-Daten bereits vorhanden');
  }

  // ============================================================
  // FR Conversion — Default-Conversion-Goals für Modehouse Müller Stores
  // ============================================================

  const existingGoal = await prisma.conversionGoal.findFirst({
    where: { storeId: muellerStoreIds[0] },
  });

  if (!existingGoal) {
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-03"
    for (const storeId of muellerStoreIds) {
      await prisma.conversionGoal.create({
        data: {
          storeId,
          period: currentMonth,
          targetConversion: 28.0,
          targetAvgBasket: 85.0,
        },
      });
    }
    console.log('✓ FR Conversion: Default-Goals für Müller-Stores erstellt');
  } else {
    console.log('✓ FR Conversion Default-Goals bereits vorhanden');
  }

  // ============================================================
  // KPI Dashboard — Demo-KPI-Daten (letzte 14 Tage)
  // ============================================================

  const existingKpi = await prisma.kpiEntry.findFirst({
    where: { tenantId: tenant1.id },
  });

  if (!existingKpi) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    if (smUser) {
      const now = new Date();
      for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
        const date = new Date(now);
        date.setDate(date.getDate() - dayOffset);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) continue; // Sonntag überspringen

        for (const storeId of muellerStoreIds) {
          const baseRevenue = dayOfWeek === 6 ? 8500 : 5500; // Samstag höher
          const variance = Math.random() * 2000 - 1000;
          const revenue = Math.round((baseRevenue + variance) * 100) / 100;
          const transactions = Math.round(revenue / 75 + Math.random() * 10);
          const footfall = Math.round(transactions * (3 + Math.random()));
          const unitsSold = Math.round(transactions * (1.5 + Math.random()));
          const staffHours = dayOfWeek === 6 ? 48 : 32;

          await prisma.kpiEntry.upsert({
            where: { storeId_date: { storeId, date: dateStr } },
            update: {},
            create: {
              tenantId: tenant1.id,
              storeId,
              date: dateStr,
              revenue,
              transactions,
              footfall,
              unitsSold,
              staffHours,
              enteredBy: smUser.id,
            },
          });
        }
      }
    }
    console.log('✓ KPI Dashboard: 14 Tage Demo-KPI-Daten erstellt');
  } else {
    console.log('✓ KPI Dashboard Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Budget Tracker — Demo-Umsatzziele und Einträge
  // ============================================================

  const existingRevenue = await prisma.revenuePeriod.findFirst({
    where: { tenantId: tenant1.id },
  });

  if (!existingRevenue) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    if (smUser) {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const currentYear = now.getFullYear().toString();
      const currentQuarter = `${currentYear}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Config erstellen
      await prisma.revenueConfig.upsert({
        where: { tenantId: tenant1.id },
        update: {},
        create: {
          tenantId: tenant1.id,
          currency: 'EUR',
          comparisonYoy: true,
          comparisonRank: true,
          retentionMonths: 24,
          weekdayWeights: JSON.stringify({ mon: 0.8, tue: 0.9, wed: 1.0, thu: 1.0, fri: 1.3, sat: 1.5, sun: 0.5 }),
        },
      });

      for (const storeId of muellerStoreIds) {
        // Jahres-Periode
        const yearPeriod = await prisma.revenuePeriod.create({
          data: {
            tenantId: tenant1.id,
            storeId,
            periodType: 'YEARLY',
            periodKey: currentYear,
            startDate: `${currentYear}-01-01`,
            endDate: `${currentYear}-12-31`,
            targetAmount: 1800000,
            createdBy: smUser.id,
          },
        });

        // Quartals-Periode
        const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const qEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        const quarterPeriod = await prisma.revenuePeriod.create({
          data: {
            tenantId: tenant1.id,
            storeId,
            periodType: 'QUARTERLY',
            periodKey: currentQuarter,
            parentId: yearPeriod.id,
            startDate: qStart.toISOString().slice(0, 10),
            endDate: qEnd.toISOString().slice(0, 10),
            targetAmount: 450000,
            createdBy: smUser.id,
          },
        });

        // Monats-Periode
        const monthPeriod = await prisma.revenuePeriod.create({
          data: {
            tenantId: tenant1.id,
            storeId,
            periodType: 'MONTHLY',
            periodKey: currentMonth,
            parentId: quarterPeriod.id,
            startDate: `${currentMonth}-01`,
            endDate: monthEnd.toISOString().slice(0, 10),
            targetAmount: 150000,
            createdBy: smUser.id,
          },
        });

        // Demo-Einträge: bisherige Tage des Monats
        const dayOfMonth = now.getDate();
        for (let d = 1; d < dayOfMonth; d++) {
          const date = `${currentMonth}-${d.toString().padStart(2, '0')}`;
          const dayOfWeek = new Date(date).getDay();
          // Wochenende weniger, Freitag/Samstag mehr
          const baseRevenue = 5000;
          const multiplier = dayOfWeek === 0 ? 0.4 : dayOfWeek === 6 ? 1.6 : dayOfWeek === 5 ? 1.3 : 1.0;
          const variance = 0.8 + Math.random() * 0.4; // ±20%
          const amount = Math.round(baseRevenue * multiplier * variance);

          await prisma.revenueEntry.create({
            data: {
              periodId: monthPeriod.id,
              amount,
              date,
              tag: Math.random() > 0.85 ? 'AKTION' : 'NORMAL',
              source: 'MANUAL',
              enteredBy: smUser.id,
            },
          });
        }
      }
    }
    console.log('✓ Budget Tracker: Demo-Umsatzziele und Einträge erstellt');
  } else {
    console.log('✓ Budget Tracker Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Forecast — Demo-Forecasts für kommende Monate
  // ============================================================

  const existingForecast = await prisma.forecast.findFirst({
    where: { tenantId: tenant1.id },
  });

  if (!existingForecast) {
    const taUser = await prisma.user.findUnique({ where: { email: 'ta@modehouse.de' } });
    if (taUser) {
      const now = new Date();
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
        const period = date.toISOString().slice(0, 7);
        const growthFactor = 1 + monthOffset * 0.05;

        for (const storeId of muellerStoreIds) {
          await prisma.forecast.upsert({
            where: { storeId_period_forecastType: { storeId, period, forecastType: 'REVENUE' } },
            update: {},
            create: {
              tenantId: tenant1.id,
              storeId,
              period,
              forecastType: 'REVENUE',
              forecastValue: Math.round(165000 * growthFactor),
              confidence: 75 - monthOffset * 10,
              method: 'TREND',
              createdBy: taUser.id,
            },
          });
          await prisma.forecast.upsert({
            where: { storeId_period_forecastType: { storeId, period, forecastType: 'FOOTFALL' } },
            update: {},
            create: {
              tenantId: tenant1.id,
              storeId,
              period,
              forecastType: 'FOOTFALL',
              forecastValue: Math.round(4500 * growthFactor),
              confidence: 70 - monthOffset * 10,
              method: 'TREND',
              createdBy: taUser.id,
            },
          });
        }
      }
    }
    console.log('✓ Forecast: Demo-Forecasts für 3 Monate erstellt');
  } else {
    console.log('✓ Forecast Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // FR Tracking — Demo-Footfall-Daten (letzte 7 Tage)
  // ============================================================

  const existingFootfall = await prisma.footfallEntry.findFirst({
    where: { tenantId: tenant1.id },
  });

  if (!existingFootfall) {
    const now = new Date();
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0) continue;

      for (const storeId of muellerStoreIds) {
        // Aggregated daily entry (hour=0 used as daily aggregate)
        const baseFootfall = dayOfWeek === 6 ? 320 : 180;
        const footfall = baseFootfall + Math.round(Math.random() * 60 - 30);
        const transactions = Math.round(footfall * (0.25 + Math.random() * 0.1));
        const revenue = Math.round(transactions * (70 + Math.random() * 30) * 100) / 100;
        const conversionRate = Math.round((transactions / footfall) * 10000) / 100;

        const existing = await prisma.footfallEntry.findFirst({
          where: { storeId, date: dateStr, hour: null },
        });
        if (!existing) {
          await prisma.footfallEntry.create({
            data: {
              tenantId: tenant1.id,
              storeId,
              date: dateStr,
              footfall,
              revenue,
              transactions,
              conversionRate,
              enteredBy: admin.id,
            },
          });
        }
      }
    }
    console.log('✓ FR Tracking: 7 Tage Demo-Footfall-Daten erstellt');
  } else {
    console.log('✓ FR Tracking Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Maintenance — Demo-Wartungsanfragen
  // ============================================================

  const existingMaintenance = await prisma.maintenanceRequest.findFirst({
    where: { tenantId: tenant1.id },
  });

  if (!existingMaintenance) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    if (smUser) {
      const maintenanceItems = [
        { title: 'Beleuchtung Schaufenster defekt', description: 'Zwei LED-Spots im Hauptschaufenster ausgefallen. Ersatz benötigt.', category: 'ELECTRICAL', priority: 'HIGH', status: 'OPEN' },
        { title: 'Klimaanlage macht Geräusche', description: 'Seit gestern rattert die Klimaanlage auf der Verkaufsfläche.', category: 'HVAC', priority: 'MEDIUM', status: 'IN_PROGRESS' },
        { title: 'Umkleide-Tür klemmt', description: 'Tür von Kabine 3 lässt sich schwer öffnen/schließen.', category: 'FIXTURE', priority: 'LOW', status: 'WAITING_PARTS' },
        { title: 'Kassenterminal Neustart', description: 'Terminal 2 hängt sich regelmäßig auf, braucht täglichen Neustart.', category: 'IT', priority: 'MEDIUM', status: 'OPEN' },
      ];

      for (const item of maintenanceItems) {
        await prisma.maintenanceRequest.create({
          data: {
            ...item,
            tenantId: tenant1.id,
            storeId: muellerStoreIds[0],
            reportedBy: smUser.id,
          },
        });
      }
    }
    console.log('✓ Maintenance: 4 Demo-Wartungsanfragen erstellt');
  } else {
    console.log('✓ Maintenance Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Loss Prevention — Demo-Vorfälle
  // ============================================================

  const existingLoss = await prisma.lossIncident.findFirst({
    where: { tenantId: tenant1.id },
  });

  if (!existingLoss) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    if (smUser) {
      const lossItems = [
        { incidentDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], category: 'THEFT', amount: 189.90, description: 'Diebstahl einer Handtasche (Marke XY). Verdächtige Person von Kamera erfasst.', severity: 'HIGH', status: 'INVESTIGATING' },
        { incidentDate: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0], category: 'DAMAGE', amount: 45.00, description: 'Kunde hat Rotwein auf weißes Kleid verschüttet. Artikel nicht mehr verkaufbar.', severity: 'LOW', status: 'RESOLVED', resolution: 'Artikel abgeschrieben, Versicherung informiert.' },
        { incidentDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], category: 'ADMIN_ERROR', amount: 120.00, description: 'Doppelte Gutschrift auf Kundenkarte — Fehler bei Retoure.', severity: 'MEDIUM', status: 'OPEN' },
      ];

      for (const item of lossItems) {
        await prisma.lossIncident.create({
          data: {
            ...item,
            tenantId: tenant1.id,
            storeId: muellerStoreIds[0],
            reportedBy: smUser.id,
          },
        });
      }
    }
    console.log('✓ Loss Prevention: 3 Demo-Vorfälle erstellt');
  } else {
    console.log('✓ Loss Prevention Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Briefings — Demo-Briefings
  // ============================================================

  const existingBriefing = await prisma.briefing.findFirst({
    where: { storeId: muellerStoreIds[0] },
  });

  if (!existingBriefing) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    if (smUser) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      await prisma.briefing.create({
        data: {
          tenantId: tenant1.id,
          storeId: muellerStoreIds[0],
          scope: 'STORE',
          title: 'Morgen-Briefing',
          content: `Guten Morgen Team!

Tageszielen:
- Umsatzziel: 5.800 EUR
- Conversion-Ziel: 28%
- UPT-Ziel: 1.8

Wichtige Infos:
- Neue Kollektion "Summer Breeze" ist eingetroffen, bitte heute einräumen
- Kampagnen-Poster im Eingangsbereich austauschen
- Mystery Shopper ist diese Woche angekündigt

Team heute:
- Sarah (Früh), Marco (Mittel), Lisa (Spät)
- Kasse: Lisa (vormittags), Marco (nachmittags)

Fokus des Tages:
Cross-Selling! Jede Beratung sollte mindestens ein Accessoire beinhalten.`,
          priority: 'NORMAL',
          status: 'PUBLISHED',
          createdBy: smUser.id,
          publishedAt: new Date(),
        },
      });

      await prisma.briefing.create({
        data: {
          tenantId: tenant1.id,
          storeId: muellerStoreIds[0],
          scope: 'COMPANY',
          title: 'Neue Kollektion: Summer Breeze Launch',
          content: `Liebe Store Manager,

die neue Kollektion "Summer Breeze" ist ab sofort in allen Stores verfügbar.

Bitte beachten:
- VM-Richtlinien im VM Guidelines Tool beachten
- Schaufenster bis Freitag umstellen
- Verkaufstraining im Training Hub absolvieren

Bei Fragen wendet euch an euren Regional Manager.`,
          priority: 'IMPORTANT',
          status: 'PUBLISHED',
          createdBy: smUser.id,
          publishedAt: new Date(),
        },
      });
    }
    console.log('✓ Briefings: 2 Demo-Briefings erstellt');
  } else {
    console.log('✓ Briefings Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Handover — Demo-Übergabe
  // ============================================================

  const existingHandover = await prisma.handover.findFirst({
    where: { storeId: muellerStoreIds[0] },
  });

  if (!existingHandover) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    const learnerUser = await prisma.user.findUnique({ where: { email: 'learner@modehouse.de' } });
    if (smUser && learnerUser) {
      await prisma.handover.create({
        data: {
          storeId: muellerStoreIds[0],
          fromUserId: smUser.id,
          toUserId: learnerUser.id,
          shiftDate: new Date().toISOString().split('T')[0],
          shiftType: 'EARLY_TO_LATE',
          status: 'SUBMITTED',
          salesUpdate: 'Guter Vormittag. €3.200 bisher. 3 größere Beratungen laufen.',
          openTasks: '- Wareneingang noch nicht komplett eingeräumt (2 von 5 Kartons)\n- Preisschilder für Sale-Artikel drucken',
          incidents: 'Keine Vorfälle.',
          customerNotes: 'Frau Weber kommt um 16 Uhr für Blazer-Anpassung (liegt im Lager, Haken 3).',
          stockNotes: 'Größe 38 in "Summer Breeze Kleid" ist ausverkauft → Nachbestellung läuft.',
          generalNotes: 'Samstag-Team ist komplett bestätigt.',
        },
      });
    }
    console.log('✓ Handover: 1 Demo-Übergabe erstellt');
  } else {
    console.log('✓ Handover Demo-Daten bereits vorhanden');
  }

  // (Clienteling old seed removed — replaced by comprehensive CRM seed at end of file)

  // ============================================================
  // Stock Callouts — Demo-Bestandsmeldungen
  // ============================================================

  const existingCallout = await prisma.stockCallout.findFirst({
    where: { storeId: muellerStoreIds[0] },
  });

  if (!existingCallout) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    if (smUser) {
      const callouts = [
        { sku: 'SB-KL-001-38', productName: 'Summer Breeze Kleid Gr. 38', currentStock: 0, reorderPoint: 3, requestedQty: 5, urgency: 'HIGH', status: 'OPEN' },
        { sku: 'HB-BL-003-M', productName: 'Hugo Boss Slim-Fit Hemd M', currentStock: 1, reorderPoint: 3, requestedQty: 4, urgency: 'NORMAL', status: 'OPEN' },
        { sku: 'ACC-SCHAL-07', productName: 'Kaschmir-Schal Creme', currentStock: 2, reorderPoint: 5, requestedQty: 5, urgency: 'LOW', status: 'ORDERED' },
      ];

      for (const c of callouts) {
        await prisma.stockCallout.create({
          data: { ...c, storeId: muellerStoreIds[0], reportedBy: smUser.id },
        });
      }
    }
    console.log('✓ Stock Callouts: 3 Demo-Bestandsmeldungen erstellt');
  } else {
    console.log('✓ Stock Callouts Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Track & Trace — Demo-Kundenbestellungen
  // ============================================================

  const existingOrder = await prisma.customerOrder.findFirst({
    where: { storeId: muellerStoreIds[0] },
  });

  if (!existingOrder) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    if (smUser) {
      const order1 = await prisma.customerOrder.create({
        data: {
          storeId: muellerStoreIds[0],
          orderNumber: 'MH-2026-001',
          customerName: 'Dr. Christina Hoffman',
          customerEmail: 'c.hoffman@example.com',
          status: 'SHIPPED',
          trackingNumber: 'DHL-12345678',
          carrier: 'DHL',
          estimatedDelivery: new Date(Date.now() + 2 * 86400000),
          createdBy: smUser.id,
          statusUpdates: {
            create: [
              { status: 'ORDERED', updatedBy: smUser.id, notes: 'Blazer-Sonderbestellung aufgegeben' },
              { status: 'CONFIRMED', updatedBy: smUser.id, notes: 'Lieferant hat bestätigt' },
              { status: 'SHIPPED', updatedBy: smUser.id, notes: 'Paket unterwegs' },
            ],
          },
        },
      });

      await prisma.customerOrder.create({
        data: {
          storeId: muellerStoreIds[0],
          orderNumber: 'MH-2026-002',
          customerName: 'Michael Brandt',
          customerEmail: 'm.brandt@example.com',
          status: 'ORDERED',
          createdBy: smUser.id,
          statusUpdates: {
            create: [
              { status: 'ORDERED', updatedBy: smUser.id, notes: 'Hemden-Nachbestellung Gr. 41' },
            ],
          },
        },
      });
    }
    console.log('✓ Track & Trace: 2 Demo-Bestellungen erstellt');
  } else {
    console.log('✓ Track & Trace Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Zusätzliche Checklisten-Templates
  // ============================================================

  const existingOpening = await prisma.checklistTemplate.findFirst({
    where: { isDefault: true, name: 'Store-Öffnung Checkliste' },
  });

  if (!existingOpening) {
    await prisma.checklistTemplate.create({
      data: {
        name: 'Store-Öffnung Checkliste',
        description: 'Tägliche Checkliste für die Filialöffnung — vor Türöffnung abzuarbeiten.',
        tenantId: null,
        isDefault: true,
        createdBy: admin.id,
        sections: {
          create: [
            {
              name: 'Sicherheit',
              sortOrder: 0,
              items: {
                create: [
                  { text: 'Alarm deaktiviert', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Rundgang gemacht — keine Auffälligkeiten', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Notausgänge frei', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                ],
              },
            },
            {
              name: 'Technik',
              sortOrder: 1,
              items: {
                create: [
                  { text: 'Beleuchtung eingeschaltet', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Klimaanlage/Heizung läuft', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Kassensystem hochgefahren', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                  { text: 'Musik/Soundsystem an', type: 'BOOLEAN', isRequired: false, sortOrder: 3 },
                ],
              },
            },
            {
              name: 'Verkaufsfläche',
              sortOrder: 2,
              items: {
                create: [
                  { text: 'Boden gesaugt/gewischt', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Schaufenster geprüft', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Warenträger aufgefüllt', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                  { text: 'Preisauszeichnung aktuell', type: 'BOOLEAN', isRequired: true, sortOrder: 3 },
                  { text: 'Umkleidekabinen leer und sauber', type: 'BOOLEAN', isRequired: true, sortOrder: 4 },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.checklistTemplate.create({
      data: {
        name: 'Store-Schließung Checkliste',
        description: 'Tägliche Checkliste für die Filialschließung — vor Verlassen abzuarbeiten.',
        tenantId: null,
        isDefault: true,
        createdBy: admin.id,
        sections: {
          create: [
            {
              name: 'Kassenabschluss',
              sortOrder: 0,
              items: {
                create: [
                  { text: 'Kassenabschluss gedruckt', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Bargeld gezählt und dokumentiert', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Tageseinnahmen im Tresor', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                  { text: 'Kassenlade offen lassen', type: 'BOOLEAN', isRequired: true, sortOrder: 3 },
                ],
              },
            },
            {
              name: 'Fläche & Sicherheit',
              sortOrder: 1,
              items: {
                create: [
                  { text: 'Verkaufsfläche aufgeräumt', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Umkleidekabinen leer', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Alle Fenster geschlossen', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                  { text: 'Beleuchtung aus (außer Notbeleuchtung)', type: 'BOOLEAN', isRequired: true, sortOrder: 3 },
                  { text: 'Alarm aktiviert', type: 'BOOLEAN', isRequired: true, sortOrder: 4 },
                  { text: 'Tür abgeschlossen', type: 'BOOLEAN', isRequired: true, sortOrder: 5 },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.checklistTemplate.create({
      data: {
        name: 'Wareneingang Checkliste',
        description: 'Checkliste für die Prüfung und Bearbeitung von Wareneingängen.',
        tenantId: null,
        isDefault: true,
        createdBy: admin.id,
        sections: {
          create: [
            {
              name: 'Lieferung prüfen',
              sortOrder: 0,
              items: {
                create: [
                  { text: 'Lieferschein vorhanden', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Anzahl Kartons stimmt', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Äußere Beschädigungen geprüft', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                  { text: 'Abweichungen dokumentiert', type: 'TEXT', isRequired: false, sortOrder: 3 },
                ],
              },
            },
            {
              name: 'Ware einräumen',
              sortOrder: 1,
              items: {
                create: [
                  { text: 'Ware ausgepackt und kontrolliert', type: 'BOOLEAN', isRequired: true, sortOrder: 0 },
                  { text: 'Sicherungsetiketten angebracht', type: 'BOOLEAN', isRequired: true, sortOrder: 1 },
                  { text: 'Preise korrekt ausgezeichnet', type: 'BOOLEAN', isRequired: true, sortOrder: 2 },
                  { text: 'Auf Verkaufsfläche einsortiert', type: 'BOOLEAN', isRequired: true, sortOrder: 3 },
                  { text: 'Verpackungsmaterial entsorgt', type: 'BOOLEAN', isRequired: false, sortOrder: 4 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✓ Checklisten: 3 weitere Default-Templates erstellt (Öffnung, Schließung, Wareneingang)');
  } else {
    console.log('✓ Checklisten zusätzliche Templates bereits vorhanden');
  }

  // ============================================================
  // Newsletter — Demo-Newsletter
  // ============================================================

  const existingNewsletter = await prisma.newsletter.findFirst({
    where: { tenantId: tenant1.id },
  });

  if (!existingNewsletter) {
    const taUser = await prisma.user.findUnique({ where: { email: 'ta@modehouse.de' } });
    if (taUser) {
      await prisma.newsletter.create({
        data: {
          tenantId: tenant1.id,
          title: 'Modehouse Team-News — März 2026',
          content: 'Willkommen zur März-Ausgabe unserer Team-News!',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          createdBy: taUser.id,
          sections: {
            create: [
              { title: 'Highlight des Monats', content: 'Unsere neue "Summer Breeze" Kollektion ist eingetroffen! Alle Stores haben die neuen Teile ab sofort auf der Fläche. Bitte macht euch mit den Materialien und Schnitten vertraut — die Produktschulung findet ihr in der Training Hub.', sortOrder: 0 },
              { title: 'Top-Performer', content: 'Herzlichen Glückwunsch an Lisa Becker (Düsseldorf Kö) — sie hat diesen Monat die höchste Conversion-Rate (34%) erreicht! Als Anerkennung erhält sie einen €50 Gutschein.', sortOrder: 1 },
              { title: 'Neues im Team', content: 'Wir begrüßen zwei neue Kolleginnen: Anna (Köln Schildergasse) und Julia (Essen Limbecker). Bitte heißt sie herzlich willkommen!', sortOrder: 2 },
              { title: 'Termine', content: '- 15.03.: VM-Update für Frühjahr (alle Stores)\n- 22.03.: Quartals-Meeting (Regional Manager)\n- 31.03.: Monatsabschluss', sortOrder: 3 },
            ],
          },
        },
      });
    }
    console.log('✓ Newsletter: 1 Demo-Newsletter erstellt');
  } else {
    console.log('✓ Newsletter Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Team Push — Demo-Nachrichten
  // ============================================================

  const existingMessage = await prisma.teamMessage.findFirst({
    where: { tenantId: tenant1.id },
  });

  if (!existingMessage) {
    const taUser = await prisma.user.findUnique({ where: { email: 'ta@modehouse.de' } });
    if (taUser) {
      await prisma.teamMessage.create({
        data: {
          tenantId: tenant1.id,
          title: '🎯 Cross-Selling Challenge startet heute!',
          body: 'Ab heute läuft unsere Cross-Selling Challenge. Ziel: Jede Beratung soll mindestens ein Accessoire beinhalten. Der/die Beste gewinnt einen €50 Gutschein. Viel Erfolg!',
          priority: 'HIGH',
          targetType: 'ALL',
          sentBy: taUser.id,
        },
      });

      await prisma.teamMessage.create({
        data: {
          tenantId: tenant1.id,
          title: 'Neue Kollektion: Summer Breeze eingetroffen',
          body: 'Die Summer Breeze Kollektion ist in allen Stores angekommen. Bitte bis morgen Abend eingeräumt haben. VM-Guideline beachten!',
          priority: 'NORMAL',
          targetType: 'ALL',
          sentBy: taUser.id,
        },
      });
    }
    console.log('✓ Team Push: 2 Demo-Nachrichten erstellt');
  } else {
    console.log('✓ Team Push Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // Zusätzliche SOP-Dokumente
  // ============================================================

  const existingVmSop = await prisma.sop.findFirst({
    where: { tenantId: null, title: 'Schaufenster-Wechsel' },
  });

  if (!existingVmSop) {
    const catAblaeufe = await prisma.sopCategory.findFirst({ where: { tenantId: null, name: 'Abläufe' } });
    if (catAblaeufe) {
      await prisma.sop.create({
        data: {
          title: 'Schaufenster-Wechsel',
          categoryId: catAblaeufe.id,
          tenantId: null,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          createdBy: admin.id,
          content: `# Schaufenster-Wechsel — SOP

## Frequenz
Alle 2 Wochen oder bei Kampagnenwechsel

## Verantwortlich
Store Manager + VM-Beauftragter

## Ablauf

### Vorbereitung
- VM-Guideline für aktuelle Kampagne lesen
- Outfits im Lager zusammenstellen
- Accessoires vorbereiten

### Durchführung
- Nach Ladenschluss oder vor Öffnung
- Alte Dekoration entfernen
- Mannequins neu ankleiden
- Beleuchtung ausrichten
- Foto machen und in VM-Compliance hochladen

### Qualitätssicherung
- Schaufenster von außen betrachten
- Preisschilder korrekt platziert?
- Beleuchtung optimal?
- VM-Guideline-Foto als Vergleich nutzen`,
        },
      });

      await prisma.sop.create({
        data: {
          title: 'Wareneingang bearbeiten',
          categoryId: catAblaeufe.id,
          tenantId: null,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          createdBy: admin.id,
          content: `# Wareneingang — SOP

## Verantwortlich
Lager-Mitarbeiter / Schichtleiter

## Ablauf

### Lieferung annehmen
- Lieferschein prüfen und unterschreiben
- Karton-Anzahl zählen
- Äußere Beschädigungen dokumentieren

### Ware prüfen
- Artikelnummern mit Lieferschein abgleichen
- Qualität stichprobenartig prüfen
- Abweichungen sofort melden

### Sicherung & Auszeichnung
- Sicherungsetiketten anbringen
- Preise im System prüfen
- Preisschilder drucken und anbringen

### Einräumen
- Nach VM-Plan auf die Fläche bringen
- Regal-Bestände auffüllen
- Überschuss ins Lager sortieren
- Verpackung fachgerecht entsorgen`,
        },
      });
    }
    console.log('✓ SOP Bibliothek: 2 weitere Default-SOPs erstellt');
  } else {
    console.log('✓ SOP Bibliothek zusätzliche SOPs bereits vorhanden');
  }

  // ═══════════════════════════════════════════════════════
  // Clienteling / CRM — Demo-Daten
  // ═══════════════════════════════════════════════════════
  const existingCrmClients = await prisma.clientProfile.count();
  if (existingCrmClients === 0) {
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    const learnerUser = await prisma.user.findUnique({ where: { email: 'learner@modehouse.de' } });
    const storeId = muellerStoreIds[0]!;

    if (smUser && learnerUser) {
      // CRM Settings mit QR-Registrierung
      await prisma.crmSettings.upsert({
        where: { storeId },
        update: {},
        create: {
          storeId,
          selfRegistrationEnabled: true,
          selfRegistrationToken: 'demo-qr-token-mueller-01',
          vipTiers: JSON.stringify([
            { name: 'BRONZE', minRevenue: 500 },
            { name: 'SILVER', minRevenue: 2000 },
            { name: 'GOLD', minRevenue: 5000 },
            { name: 'PLATINUM', minRevenue: 15000 },
          ]),
          autoArchiveDays: 365,
          historyMode: 'CLIENT',
        },
      });

      // Demo-Kunden
      const clients = [
        {
          firstName: 'Katharina', lastName: 'Schneider', email: 'k.schneider@mail.de', phone: '+49 170 1234567',
          dateOfBirth: new Date('1985-06-15'), gender: 'W', company: 'Schneider GmbH', address: 'Hauptstr. 42, 80331 Muenchen',
          preferences: 'Premium, Business, Groesse 38', preferredChannel: 'EMAIL', wishlist: 'Burberry Trenchcoat, Gucci Guertel',
          tags: 'VIP,Stammkundin,Business', vipLevel: 'GOLD',
          totalPurchases: 12, totalRevenue: 8500, avgBasket: 708.33, visitCount: 18,
          lastVisit: new Date('2026-03-10'), activityScore: 85,
          consentProfile: true, consentMarketing: true, consentBirthday: true,
          primaryAdvisorId: learnerUser.id,
        },
        {
          firstName: 'Michael', lastName: 'Weber', email: 'm.weber@firma.de', phone: '+49 171 9876543',
          dateOfBirth: new Date('1978-11-22'), gender: 'M',
          preferences: 'Sneaker, Streetwear, Groesse 43', preferredChannel: 'WHATSAPP',
          tags: 'Sneakerhead,Sammler', vipLevel: 'PLATINUM',
          totalPurchases: 28, totalRevenue: 16200, avgBasket: 578.57, visitCount: 35,
          lastVisit: new Date('2026-03-14'), activityScore: 95,
          consentProfile: true, consentMarketing: true, consentBirthday: false,
          primaryAdvisorId: smUser.id,
        },
        {
          firstName: 'Anna', lastName: 'Hoffmann', email: 'a.hoffmann@web.de', phone: '+49 172 5551234',
          dateOfBirth: new Date('1992-03-08'), gender: 'W',
          preferences: 'Casual, Accessories', tags: 'Gelegenheitskaeuferin',
          totalPurchases: 3, totalRevenue: 450, avgBasket: 150, visitCount: 5,
          lastVisit: new Date('2025-12-20'), activityScore: 25,
          consentProfile: true, consentMarketing: false, consentBirthday: true,
          primaryAdvisorId: learnerUser.id,
        },
        {
          firstName: 'Stefan', lastName: 'Koch', email: 'stefan.koch@gmail.com',
          preferredChannel: 'PHONE', tags: 'Neukundin',
          totalPurchases: 1, totalRevenue: 220, avgBasket: 220, visitCount: 2,
          lastVisit: new Date('2026-02-28'), activityScore: 40,
          consentProfile: true, consentMarketing: true, consentBirthday: false,
          selfRegistered: true, primaryAdvisorId: smUser.id,
        },
        {
          firstName: 'Maria', lastName: 'Fischer',
          tags: 'Archiv-Kandidat', vipLevel: 'BRONZE',
          totalPurchases: 5, totalRevenue: 780, avgBasket: 156, visitCount: 7,
          lastVisit: new Date('2025-06-15'), activityScore: 10,
          consentProfile: true, primaryAdvisorId: learnerUser.id,
        },
      ];

      const clientRecords = [];
      for (const c of clients) {
        const record = await prisma.clientProfile.create({ data: { storeId, createdBy: smUser.id, ...c } });
        clientRecords.push(record);
      }

      // Demo-Interaktionen fuer Katharina (Index 0) und Michael (Index 1)
      const interactionData = [
        { clientId: clientRecords[0]!.id, userId: learnerUser.id, type: 'VISIT', notes: 'Beratung Business-Garderobe', purchaseAmount: 890, items: 'Hugo Boss Blazer, Seidenbluse', category: 'Business', paymentMethod: 'KARTE' },
        { clientId: clientRecords[0]!.id, userId: learnerUser.id, type: 'PURCHASE', notes: 'Stammkundin-Rabatt 10%', purchaseAmount: 1200, items: 'Burberry Schal, Max Mara Mantel', category: 'Premium', paymentMethod: 'KARTE' },
        { clientId: clientRecords[0]!.id, userId: smUser.id, type: 'CALL', notes: 'Neue Kollektion vorgestellt, Termin vereinbart' },
        { clientId: clientRecords[1]!.id, userId: smUser.id, type: 'VISIT', notes: 'Nike Dunk Low Release Day', purchaseAmount: 350, items: 'Nike Dunk Low Panda, Socken', category: 'Sneaker', paymentMethod: 'BAR' },
        { clientId: clientRecords[1]!.id, userId: smUser.id, type: 'PURCHASE', notes: 'Online-Bestellung', purchaseAmount: 680, items: 'Jordan 4 Retro, New Balance 550', category: 'Sneaker', paymentMethod: 'ONLINE' },
        { clientId: clientRecords[1]!.id, userId: learnerUser.id, type: 'EVENT', notes: 'VIP-Preview-Event teilgenommen' },
      ];
      for (const int of interactionData) {
        await prisma.clientInteraction.create({ data: { ...int, date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) } });
      }

      // Demo-Tasks
      await prisma.clientTask.createMany({
        data: [
          { clientId: clientRecords[0]!.id, userId: learnerUser.id, title: 'Neue Kollektion vorstellen', priority: 'HIGH', dueDate: new Date('2026-03-25'), type: 'MANUAL' },
          { clientId: clientRecords[0]!.id, userId: learnerUser.id, title: 'Geburtstags-Gruss vorbereiten', type: 'AUTO', dueDate: new Date('2026-06-08'), priority: 'NORMAL' },
          { clientId: clientRecords[1]!.id, userId: smUser.id, title: 'Nike Dunk Release informieren', priority: 'NORMAL', dueDate: new Date('2026-04-01'), type: 'MANUAL' },
          { clientId: clientRecords[2]!.id, userId: learnerUser.id, title: 'Follow-up nach langem Ausbleiben', type: 'AUTO', priority: 'LOW', dueDate: new Date('2026-03-20') },
        ],
      });

      // Demo-Notizen
      await prisma.clientNote.createMany({
        data: [
          { clientId: clientRecords[0]!.id, userId: learnerUser.id, content: 'Bevorzugt Termine am Vormittag. Trinkt gerne Cappuccino bei der Beratung.', type: 'CONSULTATION', isPinned: true },
          { clientId: clientRecords[0]!.id, userId: smUser.id, content: 'Hat nach Burberry Trenchcoat gefragt, naechste Lieferung Mai.', type: 'WISH' },
          { clientId: clientRecords[1]!.id, userId: smUser.id, content: 'Sammelt limitierte Sneaker. Immer fuer Releases informieren!', type: 'GENERAL', isPinned: true },
          { clientId: clientRecords[1]!.id, userId: learnerUser.id, content: 'War beim VIP-Event sehr zufrieden, moechte zu allen Events eingeladen werden.', type: 'GENERAL' },
        ],
      });

      // Demo-Anlaesse
      await prisma.clientOccasion.createMany({
        data: [
          { clientId: clientRecords[0]!.id, type: 'BIRTHDAY', title: 'Geburtstag', date: new Date('2026-06-15'), reminderDays: 7, isRecurring: true },
          { clientId: clientRecords[0]!.id, type: 'ANNIVERSARY', title: '5 Jahre Stammkundin', date: new Date('2026-09-01'), reminderDays: 14, isRecurring: true },
          { clientId: clientRecords[1]!.id, type: 'BIRTHDAY', title: 'Geburtstag', date: new Date('2026-11-22'), reminderDays: 7, isRecurring: true },
          { clientId: clientRecords[2]!.id, type: 'BIRTHDAY', title: 'Geburtstag', date: new Date('2026-03-08'), reminderDays: 7, isRecurring: true },
        ],
      });

      console.log(`✓ Clienteling/CRM: ${clientRecords.length} Demo-Kunden, Interaktionen, Tasks, Notizen und Anlaesse erstellt`);
    }
  } else {
    console.log('✓ Clienteling/CRM Demo-Daten bereits vorhanden');
  }

  // ============================================================
  // COACHING / 1:1 — Seed Data
  // ============================================================
  const existingCoachingSessions = await prisma.coachingSession.count({ where: { tenantId: tenant1.id } });
  if (existingCoachingSessions === 0) {
    // Create coaching settings
    await prisma.coachingSettings.upsert({
      where: { tenantId: tenant1.id },
      update: {},
      create: {
        tenantId: tenant1.id,
        ratingScale: 5,
        ratingLabels: JSON.stringify({ '1': 'Ungenuegend', '2': 'Ausbaufaehig', '3': 'Befriedigend', '4': 'Gut', '5': 'Ausgezeichnet' }),
        defaultFrequencyDays: 14,
        escalationThreshold: 3,
        reminderDaysBefore: 2,
      },
    });

    // Get demo users
    const smUser = await prisma.user.findUnique({ where: { email: 'sm@modehouse.de' } });
    const learnerUser = await prisma.user.findUnique({ where: { email: 'learner@modehouse.de' } });
    const taUser = await prisma.user.findUnique({ where: { email: 'ta@modehouse.de' } });

    if (smUser && learnerUser && taUser && muellerStoreIds.length > 0) {
      const storeId = muellerStoreIds[0]!;

      // Create coaching templates
      const template1on1 = await prisma.coachingTemplate.create({
        data: {
          tenantId: tenant1.id,
          name: 'Standard 1:1 Coaching',
          description: 'Regulaeres 1:1 Coaching-Gespraech mit Leistungsbewertung',
          type: 'ONE_ON_ONE',
          isDefault: true,
          ratingScale: 5,
          ratingLabels: JSON.stringify({ '1': 'Ungenuegend', '2': 'Ausbaufaehig', '3': 'Befriedigend', '4': 'Gut', '5': 'Ausgezeichnet' }),
          defaultDuration: 30,
          sections: {
            create: [
              { title: 'Verkaufsleistung', type: 'RATING', weight: 2, sortOrder: 0, description: 'Zielerreichung, Conversion, Durchschnittsbon' },
              { title: 'Kundenservice', type: 'RATING', weight: 1.5, sortOrder: 1, description: 'Beratungsqualitaet, Kundenzufriedenheit, Beschwerdehandling' },
              { title: 'Produktwissen', type: 'COMPETENCY', weight: 1, sortOrder: 2, competencies: JSON.stringify(['Sortimentskenntnisse', 'Materialwissen', 'Trend-Awareness', 'Cross-Selling']) },
              { title: 'Teamarbeit', type: 'RATING', weight: 1, sortOrder: 3, description: 'Zusammenarbeit, Kommunikation, Zuverlaessigkeit' },
              { title: 'Allgemeine Bemerkungen', type: 'TEXT', weight: 0, sortOrder: 4, isRequired: false },
              { title: 'Store-Standards eingehalten', type: 'CHECKBOX', weight: 0, sortOrder: 5, isRequired: false },
            ],
          },
        },
      });

      const templateFloor = await prisma.coachingTemplate.create({
        data: {
          tenantId: tenant1.id,
          name: 'Floor Coaching Quick-Check',
          description: 'Schnelle Beobachtung auf der Verkaufsflaeche',
          type: 'FLOOR',
          isDefault: true,
          ratingScale: 5,
          defaultDuration: 10,
          sections: {
            create: [
              { title: 'Kundenkontakt', type: 'RATING', weight: 2, sortOrder: 0, description: 'Ansprache, Begruessungszeit, Kontaktqualitaet' },
              { title: 'Produktpraesentation', type: 'RATING', weight: 1, sortOrder: 1 },
              { title: 'Abschluss-Sicherheit', type: 'RATING', weight: 1.5, sortOrder: 2 },
              { title: 'Beobachtungen', type: 'TEXT', weight: 0, sortOrder: 3 },
            ],
          },
        },
      });

      // Get template sections for linking
      const t1Sections = await prisma.coachingTemplateSection.findMany({ where: { templateId: template1on1.id }, orderBy: { sortOrder: 'asc' } });

      // Create coaching sessions with various statuses
      const now = new Date();
      const sessionsData = [
        {
          tenantId: tenant1.id, storeId, coachId: smUser.id, coacheeId: learnerUser.id,
          templateId: template1on1.id, type: 'ONE_ON_ONE', status: 'COMPLETED',
          title: 'Monats-Review Januar', scheduledAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          completedAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
          duration: 35, mood: 4, overallRating: 3.8,
          notes: 'Lisa zeigt gute Fortschritte im Verkauf. Produktwissen hat sich deutlich verbessert.',
          managerSummary: 'Positiver Trend. Fokus auf Cross-Selling beibehalten.',
          selfAssessmentNotes: 'Ich fuehle mich sicherer in der Beratung. Cross-Selling faellt mir noch schwer.',
          coacheeConfirmation: true, coacheeComment: 'Danke fuer das konstruktive Feedback.',
        },
        {
          tenantId: tenant1.id, storeId, coachId: smUser.id, coacheeId: learnerUser.id,
          templateId: template1on1.id, type: 'ONE_ON_ONE', status: 'COMPLETED',
          title: 'Monats-Review Februar', scheduledAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          completedAt: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
          duration: 30, mood: 5, overallRating: 4.2,
          notes: 'Deutliche Verbesserung bei Cross-Selling. Conversion-Rate gestiegen.',
          managerSummary: 'Sehr gute Entwicklung. Bereit fuer mehr Verantwortung.',
          coacheeConfirmation: true,
        },
        {
          tenantId: tenant1.id, storeId, coachId: smUser.id, coacheeId: learnerUser.id,
          templateId: template1on1.id, type: 'ONE_ON_ONE', status: 'SELF_ASSESSMENT',
          title: 'Monats-Review Maerz', scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
          duration: 30,
        },
        {
          tenantId: tenant1.id, storeId, coachId: smUser.id, coacheeId: learnerUser.id,
          templateId: templateFloor.id, type: 'FLOOR', status: 'COMPLETED',
          title: 'Floor-Check Samstag', scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          completedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          duration: 10, mood: 4, overallRating: 4.0,
          notes: 'Guter Kundenkontakt, aktive Ansprache. Produktpraesentation koennte dynamischer sein.',
        },
        {
          tenantId: tenant1.id, storeId, coachId: smUser.id, coacheeId: learnerUser.id,
          type: 'ONE_ON_ONE', status: 'PLANNED',
          title: 'Quartals-Gespraech Q2', scheduledAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          duration: 45,
        },
      ];

      for (const sd of sessionsData) {
        const session = await prisma.coachingSession.create({ data: sd });

        // Add sections for completed sessions with template
        if (sd.status === 'COMPLETED' && sd.templateId === template1on1.id && t1Sections.length > 0) {
          const sectionRatings = [
            { mRating: 4, sRating: 3, mComment: 'Gute Zielerreichung', sComment: 'Kann mich verbessern' },
            { mRating: 4, sRating: 4, mComment: 'Sehr kundenorientiert', sComment: null },
            { mRating: 3, sRating: 3, mComment: null, sComment: 'Lerne staendig dazu' },
            { mRating: 4, sRating: 4, mComment: 'Zuverlaessig', sComment: null },
            { mRating: null, sRating: null, mComment: null, sComment: null, text: 'Weiter so!' },
            { mRating: null, sRating: null, mComment: null, sComment: null, checkbox: true },
          ];
          for (let i = 0; i < Math.min(t1Sections.length, sectionRatings.length); i++) {
            const ts = t1Sections[i]!;
            const sr = sectionRatings[i]!;
            await prisma.coachingSessionSection.create({
              data: {
                sessionId: session.id,
                templateSectionId: ts.id,
                title: ts.title,
                type: ts.type,
                managerRating: (sr as any).mRating ?? null,
                selfRating: (sr as any).sRating ?? null,
                managerComment: (sr as any).mComment ?? null,
                selfComment: (sr as any).sComment ?? null,
                textValue: (sr as any).text ?? null,
                checkboxValue: (sr as any).checkbox ?? null,
                sortOrder: i,
              },
            });
          }
        }

        // Add action items for completed sessions
        if (sd.status === 'COMPLETED' && sd.title?.includes('Januar')) {
          await prisma.coachingActionItem.createMany({
            data: [
              { sessionId: session.id, tenantId: tenant1.id, title: 'Cross-Selling Uebungen durchfuehren', assigneeId: learnerUser.id, priority: 'HIGH', status: 'COMPLETED', dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000) },
              { sessionId: session.id, tenantId: tenant1.id, title: 'Produktschulung Premium-Marken besuchen', assigneeId: learnerUser.id, priority: 'MEDIUM', status: 'COMPLETED', dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000) },
            ],
          });
        }
        if (sd.status === 'COMPLETED' && sd.title?.includes('Februar')) {
          await prisma.coachingActionItem.createMany({
            data: [
              { sessionId: session.id, tenantId: tenant1.id, title: 'Schaufenster-Gestaltung ueben', assigneeId: learnerUser.id, priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
              { sessionId: session.id, tenantId: tenant1.id, title: 'Kundenbindungs-Workshop vorbereiten', assigneeId: learnerUser.id, priority: 'LOW', status: 'OPEN', dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
            ],
          });
        }

        // Add anonymous feedback for completed sessions
        if (sd.status === 'COMPLETED' && sd.title?.includes('Januar')) {
          await prisma.coachingFeedback.create({
            data: { sessionId: session.id, rating: 4, comment: 'Sehr hilfreiches Gespraech', isAnonymous: true },
          });
        }
      }

      console.log('✓ Coaching/1:1: 2 Templates, 5 Sessions, Action Items und Feedback erstellt');
    }
  } else {
    console.log('✓ Coaching/1:1 Demo-Daten bereits vorhanden');
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  ✓ Seed abgeschlossen — alle Tools mit Templates und Demo-Daten');
  console.log('═══════════════════════════════════════');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
