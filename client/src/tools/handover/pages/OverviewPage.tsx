import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft,
  Plus,
  BarChart3,
  Check,
  Clock,
  FileText,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useHandovers, useHandoverStores, useAcknowledgeHandover } from '../../../hooks/useHandover';
import { useAuthStore } from '../../../stores/authStore';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  SUBMITTED: 'Eingereicht',
  ACKNOWLEDGED: 'Bestaetigt',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-kore-bg text-kore-mid',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  ACKNOWLEDGED: 'bg-emerald-100 text-emerald-700',
};
const STATUS_ICONS: Record<string, typeof FileText> = {
  DRAFT: FileText,
  SUBMITTED: Clock,
  ACKNOWLEDGED: Check,
};

const SHIFT_LABELS: Record<string, string> = {
  'FRUEH_SPAET': 'Frueh \u2192 Spaet',
  'SPAET_NACHT': 'Spaet \u2192 Nacht',
  'NACHT_FRUEH': 'Nacht \u2192 Frueh',
};

type StatusFilter = '' | 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED';

export function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stores } = useHandoverStores();
  const [selectedStore, setSelectedStore] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const acknowledge = useAcknowledgeHandover();

  const { data: result, isLoading } = useHandovers({
    storeId: selectedStore || undefined,
    status: statusFilter || undefined,
  });

  const handovers = result?.data ?? [];

  const handleAcknowledge = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    acknowledge.mutate(id);
  };

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: '', label: 'Alle' },
    { value: 'DRAFT', label: 'Entwurf' },
    { value: 'SUBMITTED', label: 'Eingereicht' },
    { value: 'ACKNOWLEDGED', label: 'Bestaetigt' },
  ];

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <ArrowRightLeft size={24} /> Schichtuebergabe
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Schichtuebergaben dokumentieren und nachverfolgen.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            to="/tools/handover/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link
            to="/tools/handover/create"
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neue Uebergabe
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg flex-wrap">
        {/* Store selector */}
        {stores && stores.length > 1 && (
          <div className="flex items-center gap-xs">
            <Store size={16} className="text-kore-mid" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border border-kore-border px-md py-sm text-small bg-kore-white"
            >
              <option value="">Alle Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.city ? ` (${s.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status tabs */}
        <div className="flex border border-kore-border">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-md py-sm text-small transition-colors ${
                statusFilter === tab.value
                  ? 'bg-kore-ink text-kore-white'
                  : 'text-kore-mid hover:bg-kore-bg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-body text-kore-mid py-2xl text-center">Lade Uebergaben...</div>
      ) : handovers.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center">
          <ArrowRightLeft size={32} className="mx-auto text-kore-mid mb-md" />
          <p className="text-body text-kore-mid">Noch keine Uebergaben vorhanden.</p>
          <Link
            to="/tools/handover/create"
            className="inline-flex items-center gap-xs mt-md px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Erste Uebergabe erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-sm">
          {handovers.map((h: any) => {
            const StatusIcon = STATUS_ICONS[h.status] ?? FileText;
            const isRecipient = user?.id === h.toUserId;
            const canAcknowledge = h.status === 'SUBMITTED' && isRecipient;

            return (
              <Link
                key={h.id}
                to={`/tools/handover/${h.id}`}
                className="block bg-kore-white border border-kore-border p-md hover:border-kore-brass transition-colors"
              >
                <div className="flex items-start justify-between gap-md">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm flex-wrap">
                      <span className="font-display text-body font-medium text-kore-ink">
                        {new Date(h.shiftDate).toLocaleDateString('de-DE', {
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      {h.shiftType && (
                        <span className="text-small text-kore-brass">
                          {SHIFT_LABELS[h.shiftType] ?? h.shiftType}
                        </span>
                      )}
                      {h.store && (
                        <span className="text-small text-kore-mid">{h.store.name}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-sm text-small text-kore-mid mt-xs">
                      <span>
                        {h.fromUser?.name ?? 'Unbekannt'} <ChevronRight size={12} className="inline" />{' '}
                        {h.toUser?.name ?? 'Nicht zugewiesen'}
                      </span>
                    </div>

                    {/* Preview snippets */}
                    <div className="flex gap-md mt-xs flex-wrap">
                      {h.salesUpdate && (
                        <span className="text-small text-kore-mid truncate max-w-[200px]">
                          Umsatz: {h.salesUpdate.substring(0, 50)}
                          {h.salesUpdate.length > 50 ? '...' : ''}
                        </span>
                      )}
                      {h.openTasks && (
                        <span className="text-small text-kore-mid truncate max-w-[200px]">
                          Aufgaben: {h.openTasks.substring(0, 50)}
                          {h.openTasks.length > 50 ? '...' : ''}
                        </span>
                      )}
                      {h.incidents && (
                        <span className="text-small text-kore-mid truncate max-w-[200px]">
                          Vorfaelle: {h.incidents.substring(0, 50)}
                          {h.incidents.length > 50 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-sm shrink-0">
                    {canAcknowledge && (
                      <button
                        onClick={(e) => handleAcknowledge(e, h.id)}
                        disabled={acknowledge.isPending}
                        className="flex items-center gap-xs px-sm py-xs bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                      >
                        <Check size={14} /> Bestaetigen
                      </button>
                    )}
                    <span
                      className={`flex items-center gap-xs px-sm py-xs text-small ${
                        STATUS_COLORS[h.status] ?? 'bg-kore-bg text-kore-mid'
                      }`}
                    >
                      <StatusIcon size={14} />
                      {STATUS_LABELS[h.status] ?? h.status}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination info */}
      {result && result.total > result.pageSize && (
        <div className="mt-lg text-small text-kore-mid text-center">
          Seite {result.page} von {Math.ceil(result.total / result.pageSize)} ({result.total}{' '}
          Uebergaben gesamt)
        </div>
      )}
    </div>
  );
}
