import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Users,
  FileText,
  MessageSquare,
  ArrowRight,
  Repeat,
  MapPin,
} from 'lucide-react';
import { useMyDay } from '../hooks/useMyDay';
import { useAuthStore } from '../stores/authStore';

export function MyDayPage() {
  const { data, isLoading, error } = useMyDay();
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="p-xl max-w-6xl">
        <div className="animate-pulse space-y-xl">
          <div className="h-12 bg-kore-surface rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-kore-surface rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-xl max-w-6xl">
        <p className="text-body text-kore-mid">Dashboard konnte nicht geladen werden.</p>
      </div>
    );
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="mb-2xl">
        <h1 className="font-display text-h1 text-kore-ink">
          {data.greeting}, {user?.name?.split(' ')[0] ?? 'Team'} 👋
        </h1>
        <p className="text-body text-kore-mid mt-xs">
          {new Date(data.date).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {data.stores.length > 0 && ` · ${data.stores.map((s) => s.name).join(', ')}`}
        </p>
      </div>

      {/* KPI Karten — Zahlen von gestern */}
      {data.kpiYesterday.storeCount > 0 && (
        <div className="mb-2xl">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm">
              <TrendingUp size={18} className="text-kore-brass" />
              Gestern
            </h2>
            <Link
              to="/app/tools/kpi"
              className="text-small text-kore-brass hover:text-kore-brass-dk flex items-center gap-xs"
            >
              Alle KPIs <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-lg">
            <KpiCard label="Umsatz" value={formatCurrency(data.kpiYesterday.revenue)} />
            <KpiCard label="ATV" value={formatCurrency(data.kpiYesterday.atv)} />
            <KpiCard label="Conversion" value={`${data.kpiYesterday.conversion}%`} />
            <KpiCard label="UPT" value={`${data.kpiYesterday.upt}`} />
            <KpiCard label="Transaktionen" value={`${data.kpiYesterday.transactions}`} />
          </div>
        </div>
      )}

      {/* Hauptbereich: 2 Spalten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Linke Spalte */}
        <div className="space-y-xl">
          {/* Checklisten */}
          <DayCard
            icon={<CheckCircle2 size={18} className="text-emerald-600" />}
            title="Checklisten"
            link="/app/tools/checklisten"
          >
            <div className="flex items-center gap-xl mb-md">
              <div>
                <span className="font-display text-h2 text-kore-ink">{data.checklists.todayRate}%</span>
                <span className="text-small text-kore-mid ml-sm">
                  ({data.checklists.todayCompleted}/{data.checklists.todayTotal} erledigt)
                </span>
              </div>
            </div>
            {data.checklists.overdue.length > 0 && (
              <div className="border-t border-kore-border pt-md">
                <div className="flex items-center gap-xs text-small text-red-600 mb-sm">
                  <AlertTriangle size={14} />
                  {data.checklists.overdue.length} offen
                </div>
                {data.checklists.overdue.slice(0, 3).map((c) => (
                  <Link
                    key={c.id}
                    to={`/app/tools/checklisten/checklists/${c.id}`}
                    className="block text-small text-kore-mid hover:text-kore-ink py-xs"
                  >
                    {c.template} — {c.store}
                  </Link>
                ))}
              </div>
            )}
            {data.checklists.todayTotal === 0 && data.checklists.overdue.length === 0 && (
              <p className="text-small text-kore-mid">Keine Checklisten heute.</p>
            )}
          </DayCard>

          {/* Schichten */}
          <DayCard
            icon={<Clock size={18} className="text-kore-brass" />}
            title="Schichten heute"
            link="/app/tools/shift-planning"
          >
            <p className="text-body text-kore-ink mb-md">
              {data.shifts.totalToday} Schichten geplant
              {data.shifts.pendingSwaps > 0 && (
                <span className="text-small text-amber-600 ml-md">
                  <Repeat size={12} className="inline mr-xs" />
                  {data.shifts.pendingSwaps} Tausch-Anfragen
                </span>
              )}
            </p>
            {data.shifts.today.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-small py-xs">
                <span className="text-kore-ink">{s.user}</span>
                <span className="text-kore-mid">
                  {s.start} – {s.end}
                </span>
              </div>
            ))}
            {data.shifts.totalToday === 0 && (
              <p className="text-small text-kore-mid">Keine Schichten geplant.</p>
            )}
          </DayCard>

          {/* Live Floor */}
          {data.floor && (
            <DayCard
              icon={<MapPin size={18} className="text-indigo-600" />}
              title="Live Floor"
              link="/app/tools/live-floor"
            >
              <div className="grid grid-cols-3 gap-md">
                <div>
                  <span className="text-caption text-kore-mid">Mitarbeiter</span>
                  <div className="font-display text-h2 text-kore-ink">{data.floor.totalStaff}</div>
                </div>
                <div>
                  <span className="text-caption text-kore-mid">Kunden</span>
                  <div className="font-display text-h2 text-kore-ink">{data.floor.totalCustomers}</div>
                </div>
                <div>
                  <span className="text-caption text-kore-mid">Zonen</span>
                  <div className="font-display text-h2 text-kore-ink">{data.floor.totalZones}</div>
                </div>
              </div>
              {data.floor.underStaffedZones > 0 && (
                <div className="mt-md flex items-center gap-xs text-small text-red-600">
                  <AlertTriangle size={14} />
                  {data.floor.underStaffedZones} Zonen unterbesetzt
                </div>
              )}
            </DayCard>
          )}
        </div>

        {/* Rechte Spalte */}
        <div className="space-y-xl">
          {/* Handovers */}
          <DayCard
            icon={<FileText size={18} className="text-orange-600" />}
            title="Offene Handovers"
            link="/app/tools/handover"
          >
            {data.handovers.pending.length > 0 ? (
              data.handovers.pending.map((h) => (
                <Link
                  key={h.id}
                  to={`/app/tools/handover/${h.id}`}
                  className="flex items-center justify-between text-small py-sm hover:bg-kore-bg -mx-md px-md transition-colors"
                >
                  <div>
                    <span className="text-kore-ink">{h.from}</span>
                    <span className="text-kore-faint ml-sm">{h.store}</span>
                  </div>
                  <span className="text-kore-mid">{h.shiftDate}</span>
                </Link>
              ))
            ) : (
              <p className="text-small text-emerald-600">Alles bestaetigt ✓</p>
            )}
          </DayCard>

          {/* Ungelesene Briefings */}
          <DayCard
            icon={<MessageSquare size={18} className="text-blue-600" />}
            title="Ungelesene Briefings"
            link="/app/tools/briefings"
          >
            {data.briefings.unread.length > 0 ? (
              data.briefings.unread.map((b) => (
                <Link
                  key={b.id}
                  to={`/app/tools/briefings/${b.id}`}
                  className="block text-small py-sm hover:bg-kore-bg -mx-md px-md transition-colors"
                >
                  <span className="text-kore-ink">{b.title}</span>
                  <span className="text-kore-faint ml-sm">{b.store}</span>
                </Link>
              ))
            ) : (
              <p className="text-small text-emerald-600">Alles gelesen ✓</p>
            )}
          </DayCard>

          {/* Coaching heute */}
          <DayCard
            icon={<Users size={18} className="text-violet-600" />}
            title="Coaching heute"
            link="/app/tools/coaching"
          >
            {data.coaching.today.length > 0 ? (
              data.coaching.today.map((c) => (
                <Link
                  key={c.id}
                  to={`/app/tools/coaching/${c.id}`}
                  className="flex items-center justify-between text-small py-sm hover:bg-kore-bg -mx-md px-md transition-colors"
                >
                  <div>
                    <span className="text-kore-ink">{c.coachee}</span>
                    {c.topic && <span className="text-kore-faint ml-sm">{c.topic}</span>}
                  </div>
                  <span className="text-kore-mid">
                    {new Date(c.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-small text-kore-mid">Keine Sessions geplant.</p>
            )}
          </DayCard>
        </div>
      </div>
    </div>
  );
}

// ── Hilfs-Komponenten ────────────────────────────

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-kore-white border border-kore-border p-lg">
      <span className="text-caption text-kore-mid uppercase tracking-widest">{label}</span>
      <div className="font-display text-h2 text-kore-ink mt-xs">{value}</div>
    </div>
  );
}

function DayCard({
  icon,
  title,
  link,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  link: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-kore-white border border-kore-border p-xl">
      <div className="flex items-center justify-between mb-lg">
        <div className="flex items-center gap-sm">
          {icon}
          <h3 className="font-display text-h3 text-kore-ink">{title}</h3>
        </div>
        <Link to={link} className="text-small text-kore-brass hover:text-kore-brass-dk flex items-center gap-xs">
          Oeffnen <ArrowRight size={14} />
        </Link>
      </div>
      {children}
    </div>
  );
}
