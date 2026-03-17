import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map,
  Store,
  Wrench,
  Footprints,
  ClipboardList,
  BarChart3,
  Trophy,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useMultiStoreOverview, useMultiStoreStores } from '../../../hooks/useMultiStore';

export function OverviewPage() {
  const { data: overview, isLoading } = useMultiStoreOverview();
  const { data: stores } = useMultiStoreStores();
  const [filterCity, setFilterCity] = useState('');

  const cities = [...new Set((stores ?? []).map((s) => s.city).filter(Boolean))] as string[];

  const filtered = filterCity
    ? (overview ?? []).filter((s: any) => s.city === filterCity)
    : (overview ?? []);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Map size={24} /> Multi-Store Steuerung
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Zentrale Steuerung -- Aufgaben, Kampagnen und Vorgaben an Stores verteilen.
          </p>
        </div>
        <div className="flex gap-sm">
          <Link
            to="/tools/multi-store/tasks"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <ClipboardList size={16} /> Aufgaben
          </Link>
          <Link
            to="/tools/multi-store/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link
            to="/tools/multi-store/comparison"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            Vergleich
          </Link>
          <Link
            to="/tools/multi-store/ranking"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <Trophy size={16} /> Ranking
          </Link>
          <Link
            to="/tools/multi-store/tasks/create"
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neue Aufgabe
          </Link>
        </div>
      </div>

      {/* City filter */}
      {cities.length > 1 && (
        <div className="flex items-center gap-md mb-lg">
          <Store size={16} className="text-kore-mid" />
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="border border-kore-border px-md py-sm text-small bg-kore-white"
          >
            <option value="">Alle Regionen</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Store cards */}
      {isLoading ? (
        <div className="text-body text-kore-mid py-2xl text-center">Lade Store-Uebersicht...</div>
      ) : !filtered?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Keine Stores zugewiesen.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {filtered.map((s: any) => (
            <div key={s.storeId} className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-md">
                <Store size={18} className="text-kore-mid" />
                <div>
                  <span className="font-medium text-kore-ink">{s.storeName}</span>
                  {s.city && <span className="text-small text-kore-mid ml-sm">{s.city}</span>}
                </div>
              </div>

              {/* KPI */}
              {s.kpi ? (
                <div className="grid grid-cols-2 gap-sm mb-md">
                  <div className="bg-kore-bg p-sm text-center">
                    <span className="block text-small text-kore-mid">Revenue</span>
                    <span className="font-medium text-kore-ink">{s.kpi.revenue?.toLocaleString('de-DE')} EUR</span>
                  </div>
                  <div className="bg-kore-bg p-sm text-center">
                    <span className="block text-small text-kore-mid">Transaktionen</span>
                    <span className="font-medium text-kore-ink">{s.kpi.transactions}</span>
                  </div>
                </div>
              ) : (
                <div className="text-small text-kore-mid mb-md">Keine KPI-Daten</div>
              )}

              {/* Task Compliance */}
              <div className="flex items-center gap-sm mb-sm text-small">
                <CheckCircle2 size={14} className={s.taskCompliance >= 80 ? 'text-emerald-500' : s.taskCompliance >= 50 ? 'text-amber-500' : 'text-red-500'} />
                <span className="text-kore-mid">Aufgaben-Compliance:</span>
                <span className={`font-medium ${s.taskCompliance >= 80 ? 'text-emerald-600' : s.taskCompliance >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {s.taskCompliance}%
                </span>
                {s.openTasks > 0 && (
                  <span className="text-kore-mid">({s.openTasks} offen)</span>
                )}
              </div>

              {/* Footfall 7d */}
              <div className="flex items-center gap-sm mb-sm text-small">
                <Footprints size={14} className="text-kore-mid" />
                <span className="text-kore-mid">7-Tage Footfall:</span>
                <span className="text-kore-ink font-medium">{s.footfall7d?.totalFootfall?.toLocaleString('de-DE') ?? '---'}</span>
              </div>

              {/* Open Maintenance */}
              {s.openMaintenance > 0 && (
                <div className="flex items-center gap-sm text-small">
                  <Wrench size={14} className="text-amber-500" />
                  <span className="text-amber-700">{s.openMaintenance} offene Wartungsanfragen</span>
                </div>
              )}

              {/* Overdue Warning */}
              {s.taskCompliance < 50 && s.openTasks > 0 && (
                <div className="flex items-center gap-sm text-small mt-sm">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-red-600">Achtung: niedrige Compliance</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
