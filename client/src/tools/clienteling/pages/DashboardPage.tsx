import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Star, TrendingUp, Calendar, Award, MessageSquare } from 'lucide-react';
import { useClientelingDashboard, useClientelingStores } from '../../../hooks/useClienteling';

export function DashboardPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useClientelingStores();
  const { data: dashboard, isLoading } = useClientelingDashboard(storeId || undefined);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Dashboard...</div>;
  if (!dashboard) return <div className="p-xl text-body text-kore-mid">Keine Daten verfuegbar.</div>;

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/clienteling" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">Clienteling Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Kennzahlen, Top-Kunden und aktuelle Aktivitaeten</p>
        </div>
        {stores && stores.length > 1 && (
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-body">
            <option value="">Alle Stores</option>
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <div className="flex items-center gap-sm mb-sm"><Users size={16} className="text-kore-mid" /><span className="text-caption text-kore-mid uppercase tracking-widest">Kunden gesamt</span></div>
          <div className="font-display text-h1 text-kore-ink">{dashboard.totalCustomers}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <div className="flex items-center gap-sm mb-sm"><Star size={16} className="text-amber-500" /><span className="text-caption text-kore-mid uppercase tracking-widest">VIP-Kunden</span></div>
          <div className="font-display text-h1 text-kore-ink">{dashboard.vipCount}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <div className="flex items-center gap-sm mb-sm"><TrendingUp size={16} className="text-emerald-600" /><span className="text-caption text-kore-mid uppercase tracking-widest">Neue Kunden (30T)</span></div>
          <div className="font-display text-h1 text-kore-ink">{dashboard.newCustomers}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <div className="flex items-center gap-sm mb-sm"><Calendar size={16} className="text-blue-600" /><span className="text-caption text-kore-mid uppercase tracking-widest">Bevorstehende Termine</span></div>
          <div className="font-display text-h1 text-kore-ink">{dashboard.upcomingAppointments}</div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamtumsatz</span>
          <div className="font-display text-h2 text-emerald-700 mt-sm">{(dashboard.totalSpent ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 0 })} EUR</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Umsatz/Kunde</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{(dashboard.avgSpent ?? 0).toFixed(0)} EUR</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Loyalty-Punkte gesamt</span>
          <div className="font-display text-h2 text-kore-brass mt-sm">{(dashboard.totalLoyaltyPoints ?? 0).toLocaleString('de-DE')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Top Customers */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><Award size={18} /> Top-Kunden nach Umsatz</h2>
          {!dashboard.topCustomers?.length ? (
            <p className="text-body text-kore-mid">Noch keine Kundendaten vorhanden.</p>
          ) : (
            <div className="space-y-sm">
              {dashboard.topCustomers.map((c: any, i: number) => (
                <Link key={c.id} to={`/tools/clienteling/customers/${c.id}`} className="flex items-center gap-md p-sm hover:bg-kore-bg transition-colors">
                  <span className="w-6 text-small text-kore-mid text-right">{i + 1}.</span>
                  <div className="flex-1">
                    <span className="font-medium text-kore-ink">{c.name}</span>
                    <div className="text-small text-kore-mid">{c.totalPurchases} Kaeufe · {c.interactions} Interaktionen</div>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-emerald-700">{c.totalSpent.toFixed(0)} EUR</span>
                    {c.vipLevel && (
                      <div className="text-small text-amber-600">{c.vipLevel}</div>
                    )}
                  </div>
                  {c.loyaltyPoints > 0 && <span className="text-small text-kore-brass">{c.loyaltyPoints} Pkt.</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><Calendar size={18} /> Naechste Termine</h2>
          {!dashboard.upcomingAppointmentsList?.length ? (
            <p className="text-body text-kore-mid">Keine bevorstehenden Termine.</p>
          ) : (
            <div className="space-y-sm">
              {dashboard.upcomingAppointmentsList.map((a: any) => (
                <div key={a.id} className="p-sm border-b border-kore-bg last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-kore-ink">{a.title}</span>
                    <span className="text-small text-kore-mid">{new Date(a.startsAt).toLocaleDateString('de-DE')} {new Date(a.startsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-small text-kore-mid">
                    {a.client ? `${a.client.firstName} ${a.client.lastName}` : 'Kein Kunde'} · Berater: {a.advisor?.name ?? '--'}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/tools/clienteling/appointments" className="block text-center mt-lg text-small text-kore-brass hover:text-kore-ink transition-colors">Alle Termine anzeigen</Link>
        </div>
      </div>

      {/* Recent Interactions */}
      {dashboard.recentInteractions?.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-xl mt-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><MessageSquare size={18} /> Letzte Interaktionen (30 Tage)</h2>
          <div className="space-y-sm">
            {dashboard.recentInteractions.slice(0, 10).map((i: any) => (
              <div key={i.id} className="flex items-center justify-between p-sm border-b border-kore-bg last:border-0">
                <div>
                  <span className="font-medium text-kore-ink">{i.client?.firstName} {i.client?.lastName}</span>
                  <span className="text-small text-kore-mid ml-sm">{i.type}</span>
                  {i.notes && <span className="text-small text-kore-faint ml-sm">-- {i.notes.slice(0, 60)}{i.notes.length > 60 ? '...' : ''}</span>}
                </div>
                <div className="text-right">
                  <span className="text-small text-kore-mid">{new Date(i.date).toLocaleDateString('de-DE')}</span>
                  {i.purchaseAmount > 0 && <span className="text-small text-emerald-700 ml-sm">{i.purchaseAmount.toFixed(0)} EUR</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
