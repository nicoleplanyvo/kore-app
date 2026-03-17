import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, MapPin, LayoutGrid, BarChart3, AlertTriangle, ChevronRight } from 'lucide-react';
import { useFloorStores, useFloorZones, useFloorAssignments, useFloorRecommendations } from '../../../hooks/useFloor';

const STATUS_COLORS: Record<string, string> = {
  OK: 'border-emerald-400 bg-emerald-50',
  ACHTUNG: 'border-amber-400 bg-amber-50',
  UNTERBESETZT: 'border-red-400 bg-red-50',
};

const STATUS_DOT: Record<string, string> = {
  OK: 'bg-emerald-500',
  ACHTUNG: 'bg-amber-500',
  UNTERBESETZT: 'bg-red-500',
};

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useFloorStores();
  const { data: zones, isLoading: zonesLoading } = useFloorZones(storeId || undefined);
  const { data: assignments } = useFloorAssignments(storeId || undefined);
  const { data: recommendations } = useFloorRecommendations(storeId || undefined);

  // Zonen mit Zuweisungsanzahl anreichern
  const enrichedZones = (zones ?? []).map((z: any) => {
    const zoneAssignments = (assignments ?? []).filter((a: any) => a.zoneId === z.id);
    const onFloor = zoneAssignments.filter((a: any) => a.status === 'ON_FLOOR').length;
    const rec = (recommendations ?? []).find((r: any) => r.zoneId === z.id);

    let status = 'OK';
    if (rec?.status === 'UNTERBESETZT') status = 'UNTERBESETZT';
    else if (rec?.status === 'ACHTUNG') status = 'ACHTUNG';
    else if (onFloor < z.minStaff && z.customerCount > 0) status = 'ACHTUNG';

    return { ...z, assignedCount: zoneAssignments.length, onFloorCount: onFloor, status, recommendation: rec };
  });

  const totalStaff = (assignments ?? []).length;
  const totalCustomers = enrichedZones.reduce((s: number, z: any) => s + (z.customerCount ?? 0), 0);
  const alertCount = (recommendations ?? []).length;

  return (
    <div className="p-xl max-w-6xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Live Floor</h1>
          <p className="text-body text-kore-mid mt-xs">Zonen-Zuweisung, Live-Status und Kundenfrequenz-Abgleich</p>
        </div>
        <div className="flex gap-sm">
          <Link to="/tools/live-floor/zones" className="flex items-center gap-sm px-lg py-md-sm border border-kore-border text-small hover:bg-kore-bg transition-colors">
            <LayoutGrid size={16} /> Zonen verwalten
          </Link>
          <Link to="/tools/live-floor/dashboard" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <BarChart3 size={16} /> Dashboard
          </Link>
        </div>
      </div>

      {/* Store-Selektor */}
      <div className="flex gap-md mb-xl items-center">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white min-w-[200px]"
        >
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ''}</option>
          ))}
        </select>
      </div>

      {/* KPI-Kacheln */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Zonen aktiv</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{enrichedZones.length}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Mitarbeiter aktiv</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{totalStaff}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Kunden gesamt</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{totalCustomers}</div>
        </div>
        <div className={`bg-kore-white border p-xl ${alertCount > 0 ? 'border-red-300' : 'border-kore-border'}`}>
          <span className="text-caption text-kore-mid uppercase tracking-widest">Alerts</span>
          <div className={`font-display text-h1 mt-sm ${alertCount > 0 ? 'text-red-600' : 'text-kore-ink'}`}>{alertCount}</div>
        </div>
      </div>

      {/* Empfehlungs-Alerts */}
      {alertCount > 0 && (
        <div className="mb-xl space-y-sm">
          {(recommendations ?? []).map((r: any) => (
            <div key={r.zoneId} className={`flex items-center gap-md p-md border-l-4 ${r.status === 'UNTERBESETZT' ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'}`}>
              <AlertTriangle size={18} className={r.status === 'UNTERBESETZT' ? 'text-red-600' : 'text-amber-600'} />
              <div className="flex-1">
                <span className="text-small font-medium text-kore-ink">{r.zoneName}</span>
                {r.storeName && <span className="text-small text-kore-mid ml-md">{r.storeName}</span>}
                <span className="text-small text-kore-mid ml-md">
                  {r.staffCount}/{r.idealStaff} MA | {r.customerCount} Kunden | Deficit: +{r.deficit} MA
                </span>
              </div>
              <Link to="/tools/live-floor/zones" className="text-small text-kore-brass hover:underline flex items-center gap-xs">
                Zuweisen <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Zonen-Grid */}
      {zonesLoading ? (
        <div className="text-body text-kore-mid">Lade Zonen...</div>
      ) : enrichedZones.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <MapPin size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Zonen definiert</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Erstellen Sie Verkaufsflaechen-Zonen, um Personal zuzuweisen und die Kundenfrequenz zu ueberwachen.</p>
          <Link to="/tools/live-floor/zones" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <LayoutGrid size={16} /> Zonen erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {enrichedZones.map((z: any) => (
            <div key={z.id} className={`border-l-4 bg-kore-white border border-kore-border p-lg ${STATUS_COLORS[z.status] ?? 'border-l-kore-border'}`}>
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-medium text-kore-ink text-body">{z.name}</h3>
                <div className="flex items-center gap-xs">
                  <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[z.status] ?? 'bg-kore-mid'}`} />
                  <span className="text-small text-kore-mid">{z.status === 'OK' ? 'OK' : z.status === 'ACHTUNG' ? 'Achtung' : 'Unterbesetzt'}</span>
                </div>
              </div>

              {z.store && <p className="text-small text-kore-faint mb-md">{z.store.name}</p>}

              <div className="grid grid-cols-2 gap-md mb-md">
                <div>
                  <div className="text-caption text-kore-mid uppercase tracking-widest">Personal</div>
                  <div className="text-body font-medium text-kore-ink">
                    {z.onFloorCount} <span className="text-small text-kore-faint font-normal">/ {z.minStaff}–{z.maxStaff}</span>
                  </div>
                </div>
                <div>
                  <div className="text-caption text-kore-mid uppercase tracking-widest">Kunden</div>
                  <div className="text-body font-medium text-kore-ink">{z.customerCount}</div>
                </div>
              </div>

              {z.onFloorCount > 0 && (
                <div className="bg-kore-bg h-2 w-full">
                  <div
                    className="bg-kore-ink h-full transition-all"
                    style={{ width: `${Math.min(100, z.maxStaff > 0 ? (z.onFloorCount / z.maxStaff) * 100 : 0)}%` }}
                  />
                </div>
              )}

              {z.recommendation && (
                <p className="text-small text-amber-700 mt-md">
                  Empfehlung: +{z.recommendation.deficit} MA zuweisen (Ratio: {z.recommendation.ratio} Kunden/MA)
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
