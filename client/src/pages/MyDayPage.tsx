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
  Sparkles,
} from 'lucide-react';
import { useMyDay } from '../hooks/useMyDay';
import { useAuthStore } from '../stores/authStore';

export function MyDayPage() {
  const { data, isLoading, error } = useMyDay();
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-xl">
          <div className="h-10 bg-kore-surface rounded-lg w-2/5" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-kore-surface rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-kore-surface rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-kore-white rounded-lg border border-kore-border p-2xl text-center shadow-sm">
          <p className="text-body text-kore-mid">Dashboard konnte nicht geladen werden.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-xl animate-fade-in">
        <div className="flex items-center gap-sm mb-xs">
          <Sparkles size={20} className="text-kore-brass" />
          <h1 className="font-display text-h1 text-kore-ink">
            {data.greeting}, {user?.name?.split(' ')[0] ?? 'Team'}
          </h1>
        </div>
        <p className="text-body text-kore-mid">
          {new Date(data.date).toLocaleDateString('de-DE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          {data.stores.length > 0 && (
            <span className="ml-sm text-kore-faint">· {data.stores.map((s) => s.name).join(', ')}</span>
          )}
        </p>
      </div>

      {/* KPI Karten */}
      {data.kpiYesterday.storeCount > 0 && (
        <div className="mb-xl animate-slide-up">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-body text-caption text-kore-mid uppercase">
              KPIs Gestern
            </h2>
            <Link
              to="/tools/kpi"
              className="text-small text-kore-brass hover:text-kore-brass-dk flex items-center gap-xs transition-colors"
            >
              Details <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-md">
            <KpiCard label="Umsatz" value={formatCurrency(data.kpiYesterday.revenue)} accent />
            <KpiCard label="ATV" value={formatCurrency(data.kpiYesterday.atv)} />
            <KpiCard label="Conversion" value={`${data.kpiYesterday.conversion}%`} />
            <KpiCard label="UPT" value={`${data.kpiYesterday.upt}`} />
            <KpiCard label="Transaktionen" value={`${data.kpiYesterday.transactions}`} />
          </div>
        </div>
      )}

      {/* Hauptbereich */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
        {/* Checklisten */}
        <DayCard
          icon={<CheckCircle2 size={20} />}
          iconBg="bg-emerald-50 text-emerald-600"
          title="Checklisten"
          link="/tools/checklisten"
          delay={0}
        >
          <div className="flex items-baseline gap-md mb-md">
            <span className="font-display text-h2 text-kore-ink">{data.checklists.todayRate}%</span>
            <span className="text-small text-kore-mid">
              {data.checklists.todayCompleted}/{data.checklists.todayTotal} erledigt
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-[6px] bg-kore-surface rounded-full overflow-hidden mb-md">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(data.checklists.todayRate, 100)}%` }}
            />
          </div>
          {data.checklists.overdue.length > 0 && (
            <div className="pt-md border-t border-kore-border/50">
              <div className="flex items-center gap-xs text-small text-kore-error mb-sm font-medium">
                <AlertTriangle size={14} />
                {data.checklists.overdue.length} offen
              </div>
              {data.checklists.overdue.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  to={`/tools/checklisten/checklists/${c.id}`}
                  className="block text-small text-kore-mid hover:text-kore-ink py-xs transition-colors"
                >
                  {c.template} — <span className="text-kore-faint">{c.store}</span>
                </Link>
              ))}
            </div>
          )}
          {data.checklists.todayTotal === 0 && data.checklists.overdue.length === 0 && (
            <p className="text-small text-kore-faint">Keine Checklisten heute.</p>
          )}
        </DayCard>

        {/* Schichten */}
        <DayCard
          icon={<Clock size={20} />}
          iconBg="bg-kore-brass/10 text-kore-brass"
          title="Schichten heute"
          link="/tools/shift-planning"
          delay={50}
        >
          <div className="flex items-center gap-lg mb-md">
            <span className="font-display text-h2 text-kore-ink">{data.shifts.totalToday}</span>
            <span className="text-small text-kore-mid">geplant</span>
            {data.shifts.pendingSwaps > 0 && (
              <span className="inline-flex items-center gap-xs px-sm py-[2px] bg-amber-50 text-amber-700 text-caption rounded-md">
                <Repeat size={12} /> {data.shifts.pendingSwaps} Tausch
              </span>
            )}
          </div>
          <div className="space-y-[6px]">
            {data.shifts.today.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-small py-[4px]">
                <span className="text-kore-ink font-medium">{s.user}</span>
                <span className="text-kore-faint tabular-nums">{s.start} – {s.end}</span>
              </div>
            ))}
          </div>
          {data.shifts.totalToday === 0 && (
            <p className="text-small text-kore-faint">Keine Schichten geplant.</p>
          )}
        </DayCard>

        {/* Offene Handovers */}
        <DayCard
          icon={<FileText size={20} />}
          iconBg="bg-orange-50 text-orange-600"
          title="Offene Handovers"
          link="/tools/handover"
          delay={100}
        >
          {data.handovers.pending.length > 0 ? (
            <div className="space-y-[2px]">
              {data.handovers.pending.map((h) => (
                <Link
                  key={h.id}
                  to={`/tools/handover/${h.id}`}
                  className="flex items-center justify-between text-small py-sm rounded-md hover:bg-kore-bg -mx-sm px-sm transition-colors"
                >
                  <div>
                    <span className="text-kore-ink font-medium">{h.from}</span>
                    <span className="text-kore-faint ml-sm">{h.store}</span>
                  </div>
                  <span className="text-kore-faint tabular-nums">{h.shiftDate}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-sm text-small text-emerald-600">
              <CheckCircle2 size={16} />
              Alles bestätigt
            </div>
          )}
        </DayCard>

        {/* Ungelesene Briefings */}
        <DayCard
          icon={<MessageSquare size={20} />}
          iconBg="bg-blue-50 text-blue-600"
          title="Ungelesene Briefings"
          link="/tools/briefings"
          delay={150}
        >
          {data.briefings.unread.length > 0 ? (
            <div className="space-y-[2px]">
              {data.briefings.unread.map((b) => (
                <Link
                  key={b.id}
                  to={`/tools/briefings/${b.id}`}
                  className="block text-small py-sm rounded-md hover:bg-kore-bg -mx-sm px-sm transition-colors"
                >
                  <span className="text-kore-ink font-medium">{b.title}</span>
                  <span className="text-kore-faint ml-sm">{b.store}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-sm text-small text-emerald-600">
              <CheckCircle2 size={16} />
              Alles gelesen
            </div>
          )}
        </DayCard>

        {/* Coaching */}
        <DayCard
          icon={<Users size={20} />}
          iconBg="bg-violet-50 text-violet-600"
          title="Coaching heute"
          link="/tools/coaching"
          delay={200}
        >
          {data.coaching.today.length > 0 ? (
            <div className="space-y-[2px]">
              {data.coaching.today.map((c) => (
                <Link
                  key={c.id}
                  to={`/tools/coaching/${c.id}`}
                  className="flex items-center justify-between text-small py-sm rounded-md hover:bg-kore-bg -mx-sm px-sm transition-colors"
                >
                  <div>
                    <span className="text-kore-ink font-medium">{c.coachee}</span>
                    {c.topic && <span className="text-kore-faint ml-sm">{c.topic}</span>}
                  </div>
                  <span className="text-kore-faint tabular-nums">
                    {new Date(c.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-small text-kore-faint">Keine Sessions geplant.</p>
          )}
        </DayCard>

        {/* Live Floor */}
        {data.floor && (
          <DayCard
            icon={<MapPin size={20} />}
            iconBg="bg-indigo-50 text-indigo-600"
            title="Live Floor"
            link="/tools/live-floor"
            delay={250}
          >
            <div className="grid grid-cols-3 gap-md">
              <FloorStat label="Mitarbeiter" value={data.floor.totalStaff} />
              <FloorStat label="Kunden" value={data.floor.totalCustomers} />
              <FloorStat label="Zonen" value={data.floor.totalZones} />
            </div>
            {data.floor.underStaffedZones > 0 && (
              <div className="mt-md flex items-center gap-xs px-md py-sm bg-red-50 rounded-md text-small text-kore-error font-medium">
                <AlertTriangle size={14} />
                {data.floor.underStaffedZones} Zonen unterbesetzt
              </div>
            )}
          </DayCard>
        )}
      </div>
    </div>
  );
}

/* ── Komponenten ──────────────────────────── */

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg p-lg ${accent ? 'bg-gradient-to-br from-kore-ink to-kore-ink/90 text-kore-white' : 'bg-kore-white border border-kore-border shadow-card'}`}>
      <span className={`text-caption uppercase ${accent ? 'text-kore-brass-lt' : 'text-kore-mid'}`}>{label}</span>
      <div className={`font-display text-h2 mt-xs ${accent ? 'text-kore-white' : 'text-kore-ink'}`}>{value}</div>
    </div>
  );
}

function FloorStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display text-h2 text-kore-ink">{value}</div>
      <span className="text-caption text-kore-mid">{label}</span>
    </div>
  );
}

function DayCard({
  icon,
  iconBg,
  title,
  link,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  link: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="bg-kore-white border border-kore-border rounded-lg p-lg shadow-card animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-lg">
        <div className="flex items-center gap-md">
          <div className={`w-[36px] h-[36px] rounded-md flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <h3 className="font-body text-body text-kore-ink font-medium">{title}</h3>
        </div>
        <Link
          to={link}
          className="text-small text-kore-brass hover:text-kore-brass-dk flex items-center gap-xs transition-colors"
        >
          <ArrowRight size={16} />
        </Link>
      </div>
      {children}
    </div>
  );
}
