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
    { key: 'performance.budget_tracker', name: 'Budget Tracker', category: 'PERFORMANCE', description: 'Budget-Planung und Kostenverfolgung pro Store', icon: 'Wallet', priceMonthly: 1500, sortOrder: 2 },
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
    'training.training_hub_lms', 'training.training_hours',
    'coaching.shift_planning', 'coaching.appraisals',
    'komm.briefings',
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
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
