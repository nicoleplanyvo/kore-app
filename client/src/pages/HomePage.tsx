import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  Database,
  Mail,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useEffectiveRole } from '../hooks/useEffectiveRole';
import { useDashboardStats } from '../hooks/useDashboardData';
import { WelcomeOverlay } from '../components/WelcomeOverlay';
import { MyDayPage } from './MyDayPage';

/* ── Rollen-Labels ── */
const roleLabels: Record<string, string> = {
  kore_admin: 'Plattform-Admin',
  tenant_admin: 'Administrator',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

const roleSubtitles: Record<string, string> = {
  kore_admin: 'Plattform verwalten, Kunden betreuen, alle Tools konfigurieren',
  tenant_admin: 'Stores & Tools verwalten, Templates konfigurieren, Reporting',
  regional_manager: 'Stores vergleichen, Standards setzen, Teams coachen',
  multisite_manager: 'Store-Übersicht, Standards prüfen, Reports abrufen',
  store_manager: 'Tagesgeschäft steuern, Daten erfassen, Team führen',
  learner: 'Aufgaben erledigen, Schulungen absolvieren, Checklisten ausfüllen',
};

/* ── Helpers ── */
const formatEur = (cents: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
    cents / 100,
  );

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));

const statusDot: Record<string, string> = {
  ACTIVE: 'bg-kore-success',
  TRIALING: 'bg-kore-brass',
  PAST_DUE: 'bg-kore-warning',
  CANCELED: 'bg-kore-error',
};

const statusLabel: Record<string, string> = {
  ACTIVE: 'Aktiv',
  TRIALING: 'Testphase',
  PAST_DUE: 'Überfällig',
  CANCELED: 'Gekündigt',
};

/* ═══════════════════════════════════════════════
   KORE ADMIN DASHBOARD
   ═══════════════════════════════════════════════ */

function AdminDashboard() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useDashboardStats();
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div>
      {/* Header */}
      <div className="mb-lg sm:mb-xl">
        <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">
          Hallo, {firstName}
        </h1>
        <p className="font-body text-small text-kore-mid mt-xs">
          Plattform verwalten, Kunden betreuen, alle Tools konfigurieren
        </p>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-lg">
        {/* MRR */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <p className="font-body text-[0.6rem] text-kore-mid uppercase tracking-[0.12em]">
            MRR
          </p>
          <p className="font-display text-h2 text-kore-ink mt-xs">
            {isLoading ? '...' : formatEur(stats?.mrr ?? 0)}
          </p>
          <p className="font-body text-[0.6rem] text-kore-success mt-xs">
            Monatlich wiederkehrend
          </p>
        </div>

        {/* Aktive Kunden */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <p className="font-body text-[0.6rem] text-kore-mid uppercase tracking-[0.12em]">
            Aktive Kunden
          </p>
          <p className="font-display text-h2 text-kore-ink mt-xs">
            {isLoading ? '...' : stats?.activeTenants ?? 0}
          </p>
          <p className="font-body text-[0.6rem] text-kore-mid mt-xs">
            von {isLoading ? '...' : stats?.totalTenants ?? 0} gesamt
          </p>
        </div>

        {/* Stores */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <p className="font-body text-[0.6rem] text-kore-mid uppercase tracking-[0.12em]">
            Stores
          </p>
          <p className="font-display text-h2 text-kore-ink mt-xs">
            {isLoading ? '...' : stats?.activeStores ?? 0}
          </p>
          <p className="font-body text-[0.6rem] text-kore-mid mt-xs">
            von {isLoading ? '...' : stats?.totalStores ?? 0} gesamt
          </p>
        </div>

        {/* Tool-Buchungen */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <p className="font-body text-[0.6rem] text-kore-mid uppercase tracking-[0.12em]">
            Tool-Buchungen
          </p>
          <p className="font-display text-h2 text-kore-ink mt-xs">
            {isLoading ? '...' : stats?.totalToolBookings ?? 0}
          </p>
          <p className="font-body text-[0.6rem] text-kore-mid mt-xs">
            Aktive Zuweisungen
          </p>
        </div>
      </div>

      {/* ── 2x2 Panel Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Panel 1: Kunden-Anfragen & Angebote */}
        <div className="bg-kore-white border border-kore-border">
          <div className="px-lg py-md border-b border-kore-border flex items-center justify-between">
            <h3 className="font-body text-[0.7rem] text-kore-ink uppercase tracking-[0.1em] font-normal">
              Kunden-Anfragen & Angebote
            </h3>
            <Link
              to="/admin/tenants"
              className="font-body text-[0.65rem] text-kore-brass hover:text-kore-brass-lt transition-colors"
            >
              Alle anzeigen
            </Link>
          </div>
          <div className="px-lg py-md">
            <ActivityItem
              dotColor="bg-kore-brass"
              text={<>Neue Anfrage von <strong>SportVision GmbH</strong></>}
              meta="Demo-Termin angefragt — vor 2 Stunden"
            />
            <ActivityItem
              dotColor="bg-kore-warning"
              text={<>Angebot <strong>#A-2024-018</strong> an Modehouse — wartet auf Rückmeldung</>}
              meta="2.340 EUR/Monat — gesendet vor 3 Tagen"
            />
            <ActivityItem
              dotColor="bg-kore-success"
              text={<>Angebot <strong>#A-2024-017</strong> von LuxRetail <strong>angenommen</strong></>}
              meta="890 EUR/Monat — gestern"
              isLast
            />
          </div>
        </div>

        {/* Panel 2: Offene Rechnungen */}
        <div className="bg-kore-white border border-kore-border">
          <div className="px-lg py-md border-b border-kore-border flex items-center justify-between">
            <h3 className="font-body text-[0.7rem] text-kore-ink uppercase tracking-[0.1em] font-normal">
              Offene Rechnungen
            </h3>
            <Link
              to="/admin/billing"
              className="font-body text-[0.65rem] text-kore-brass hover:text-kore-brass-lt transition-colors"
            >
              Buchhaltung
            </Link>
          </div>
          <div className="px-lg py-md">
            <table className="w-full text-[0.75rem]">
              <thead>
                <tr>
                  <th className="text-left font-normal text-kore-mid text-[0.6rem] uppercase tracking-[0.08em] pb-sm border-b border-kore-surface">
                    Nr.
                  </th>
                  <th className="text-left font-normal text-kore-mid text-[0.6rem] uppercase tracking-[0.08em] pb-sm border-b border-kore-surface">
                    Kunde
                  </th>
                  <th className="text-left font-normal text-kore-mid text-[0.6rem] uppercase tracking-[0.08em] pb-sm border-b border-kore-surface">
                    Betrag
                  </th>
                  <th className="text-left font-normal text-kore-mid text-[0.6rem] uppercase tracking-[0.08em] pb-sm border-b border-kore-surface">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <InvoiceRow nr="#R-2024-042" kunde="Modehouse AG" betrag="2.340" variant="error" status="Überfällig" />
                <InvoiceRow nr="#R-2024-041" kunde="FashionFirst" betrag="1.560" variant="warning" status="Offen" />
                <InvoiceRow nr="#R-2024-040" kunde="LuxRetail" betrag="890" variant="success" status="Bezahlt" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 3: System-Status */}
        <div className="bg-kore-white border border-kore-border">
          <div className="px-lg py-md border-b border-kore-border">
            <h3 className="font-body text-[0.7rem] text-kore-ink uppercase tracking-[0.1em] font-normal">
              System-Status
            </h3>
          </div>
          <div className="px-lg py-md">
            <ActivityItem
              dotColor="bg-kore-success"
              icon={<Activity size={14} className="text-kore-success" />}
              text="API — Alle Endpunkte erreichbar"
              meta="Latenz: 42ms — Uptime: 99,9%"
            />
            <ActivityItem
              dotColor="bg-kore-success"
              icon={<Database size={14} className="text-kore-success" />}
              text="Datenbank — 847 MB / 5 GB"
              meta="Letzte Sicherung: vor 4 Stunden"
            />
            <ActivityItem
              dotColor="bg-kore-warning"
              icon={<Mail size={14} className="text-kore-warning" />}
              text="E-Mail-Kontingent — 892 / 1.000 diesen Monat"
              meta="Resend API — 89% verbraucht"
              isLast
            />
          </div>
        </div>

        {/* Panel 4: Neueste Kunden */}
        <div className="bg-kore-white border border-kore-border">
          <div className="px-lg py-md border-b border-kore-border flex items-center justify-between">
            <h3 className="font-body text-[0.7rem] text-kore-ink uppercase tracking-[0.1em] font-normal">
              Neueste Kunden
            </h3>
            <Link
              to="/admin/tenants"
              className="font-body text-[0.65rem] text-kore-brass hover:text-kore-brass-lt transition-colors"
            >
              Alle Kunden
            </Link>
          </div>
          <div className="px-lg py-md">
            {isLoading ? (
              <p className="font-body text-[0.75rem] text-kore-mid py-md">
                Wird geladen...
              </p>
            ) : stats?.recentTenants && stats.recentTenants.length > 0 ? (
              stats.recentTenants.map((tenant, idx) => (
                <ActivityItem
                  key={tenant.id}
                  dotColor={statusDot[tenant.status] || 'bg-kore-mid'}
                  text={
                    <>
                      <strong>{tenant.name}</strong> — {tenant.storeCount}{' '}
                      {tenant.storeCount === 1 ? 'Store' : 'Stores'}
                    </>
                  }
                  meta={`${statusLabel[tenant.status] || tenant.status} seit ${formatDate(tenant.createdAt)}`}
                  isLast={idx === stats.recentTenants.length - 1}
                />
              ))
            ) : (
              <p className="font-body text-[0.75rem] text-kore-mid py-md">
                Noch keine Kunden vorhanden.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROLE-BASED PLACEHOLDER (Phase 2)
   ═══════════════════════════════════════════════ */

function RoleDashboard() {
  const { user } = useAuthStore();
  const { role } = useEffectiveRole();
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);

  // Check if this is potentially first login (simplified heuristic)
  const isFirstLogin = !localStorage.getItem(`kore-welcome-seen-${user?.id}`);
  
  const handleWelcomeSeen = () => {
    if (user?.id) {
      localStorage.setItem(`kore-welcome-seen-${user.id}`, 'true');
    }
    setShowWelcomeOverlay(false);
  };

  // Show overlay on first login
  useEffect(() => {
    if (isFirstLogin) {
      const timer = setTimeout(() => {
        setShowWelcomeOverlay(true);
      }, 500); // Delay to let dashboard load first
      
      return () => clearTimeout(timer);
    }
  }, [isFirstLogin]);

  return (
    <div>
      {/* Welcome Overlay */}
      <WelcomeOverlay
        isOpen={showWelcomeOverlay}
        onClose={handleWelcomeSeen}
        role={role}
        userName={user?.name || 'User'}
      />

      {/* Placeholder Panel */}
      <div className="bg-kore-white border border-kore-border p-2xl text-center">
        <FileText size={32} className="text-kore-mid/30 mx-auto mb-md" />
        <div className="mb-lg">
          <h2 className="font-display text-h3 text-kore-ink mb-xs">
            Willkommen bei KORE
          </h2>
          <p className="font-body text-body text-kore-mid">
            Dein personalisiertes Dashboard wird bald verfügbar.
          </p>
          <p className="font-body text-small text-kore-mid mt-xs">
            In der Zwischenzeit findest du alle Werkzeuge in der Tool-Übersicht.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-sm justify-center">
          {!localStorage.getItem(`kore-welcome-seen-${user?.id}`) && (
            <button
              onClick={() => setShowWelcomeOverlay(true)}
              className="inline-flex items-center gap-sm px-lg py-md border border-kore-brass text-kore-brass font-body text-small hover:bg-kore-brass/5 transition-colors"
            >
              <span>Willkommens-Tour</span>
            </button>
          )}
          <Link
            to="/tools"
            className="inline-flex items-center gap-sm px-lg py-md bg-kore-ink text-kore-white font-body text-small hover:bg-kore-ink/90 transition-colors"
          >
            <span>Alle Tools anzeigen</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function ActivityItem({
  dotColor,
  icon,
  text,
  meta,
  isLast = false,
}: {
  dotColor: string;
  icon?: React.ReactNode;
  text: React.ReactNode;
  meta: string;
  isLast?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-sm py-sm ${
        isLast ? '' : 'border-b border-kore-surface'
      }`}
    >
      {icon ? (
        <div className="mt-[3px] flex-shrink-0">{icon}</div>
      ) : (
        <div
          className={`w-[7px] h-[7px] rounded-full mt-[5px] flex-shrink-0 ${dotColor}`}
        />
      )}
      <div className="min-w-0">
        <p className="font-body text-[0.75rem] text-kore-ink leading-relaxed">
          {text}
        </p>
        <p className="font-body text-[0.6rem] text-kore-mid mt-[2px]">
          {meta}
        </p>
      </div>
    </div>
  );
}

function InvoiceRow({
  nr,
  kunde,
  betrag,
  variant,
  status,
}: {
  nr: string;
  kunde: string;
  betrag: string;
  variant: 'success' | 'warning' | 'error';
  status: string;
}) {
  const variantClasses: Record<string, string> = {
    success: 'bg-kore-success/10 text-kore-success',
    warning: 'bg-kore-warning/10 text-kore-warning',
    error: 'bg-kore-error/10 text-kore-error',
  };

  return (
    <tr>
      <td className="py-sm border-b border-kore-surface text-kore-ink">
        {nr}
      </td>
      <td className="py-sm border-b border-kore-surface text-kore-ink">
        {kunde}
      </td>
      <td className="py-sm border-b border-kore-surface text-kore-ink">
        {betrag} EUR
      </td>
      <td className="py-sm border-b border-kore-surface">
        <span
          className={`inline-block px-sm py-[2px] text-[0.55rem] uppercase tracking-[0.06em] ${variantClasses[variant]}`}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════ */

export function HomePage() {
  const { isSuperAdmin } = useEffectiveRole();

  if (isSuperAdmin) return <AdminDashboard />;

  // Alle anderen Rollen bekommen MyDayPage direkt als Dashboard
  return <MyDayPage />;
}
