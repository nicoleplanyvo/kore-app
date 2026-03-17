import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Search,
  Store,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDot,
  ChevronRight,
} from 'lucide-react';
import { useMultiStoreTasks, useMultiStoreStores } from '../../../hooks/useMultiStore';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  COMPLETED: 'Erledigt',
  OVERDUE: 'Ueberfaellig',
  REJECTED: 'Abgelehnt',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-700',
  REJECTED: 'bg-kore-bg text-kore-mid',
};
const STATUS_ICONS: Record<string, typeof CircleDot> = {
  OPEN: CircleDot,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle2,
  OVERDUE: AlertTriangle,
  REJECTED: AlertTriangle,
};

const TYPE_LABELS: Record<string, string> = {
  TODO: 'To-Do',
  CHECKLIST: 'Checkliste',
  CAMPAIGN: 'Kampagne',
  SURVEY: 'Umfrage',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-kore-mid',
  MEDIUM: 'text-blue-600',
  HIGH: 'text-amber-600',
  URGENT: 'text-red-600',
};

type StatusFilter = '' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
type TypeFilter = '' | 'TODO' | 'CHECKLIST' | 'CAMPAIGN' | 'SURVEY';

export function TaskListPage() {
  const { data: stores } = useMultiStoreStores();
  const [selectedStore, setSelectedStore] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: result, isLoading } = useMultiStoreTasks({
    storeId: selectedStore || undefined,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    search: searchQuery || undefined,
  });

  const tasks = result?.data ?? [];

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: '', label: 'Alle' },
    { value: 'OPEN', label: 'Offen' },
    { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
    { value: 'COMPLETED', label: 'Erledigt' },
    { value: 'OVERDUE', label: 'Ueberfaellig' },
  ];

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div className="flex items-center gap-md">
          <Link to="/tools/multi-store" className="text-kore-mid hover:text-kore-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
              <ClipboardList size={24} /> Aufgabenverwaltung
            </h1>
            <p className="text-body text-kore-mid mt-xs">
              Aufgaben, Checklisten, Kampagnen und Umfragen verwalten.
            </p>
          </div>
        </div>
        <Link
          to="/tools/multi-store/tasks/create"
          className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
        >
          <Plus size={16} /> Neue Aufgabe
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg flex-wrap">
        {/* Search */}
        <div className="flex items-center gap-xs border border-kore-border px-md py-sm bg-kore-white">
          <Search size={14} className="text-kore-mid" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen..."
            className="border-0 outline-none text-small bg-transparent w-40"
          />
        </div>

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
                  {s.name}{s.city ? ` (${s.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          <option value="">Alle Typen</option>
          <option value="TODO">To-Do</option>
          <option value="CHECKLIST">Checkliste</option>
          <option value="CAMPAIGN">Kampagne</option>
          <option value="SURVEY">Umfrage</option>
        </select>

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

      {/* Task list */}
      {isLoading ? (
        <div className="text-body text-kore-mid py-2xl text-center">Lade Aufgaben...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center">
          <ClipboardList size={32} className="mx-auto text-kore-mid mb-md" />
          <p className="text-body text-kore-mid">Noch keine Aufgaben vorhanden.</p>
          <Link
            to="/tools/multi-store/tasks/create"
            className="inline-flex items-center gap-xs mt-md px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Erste Aufgabe erstellen
          </Link>
        </div>
      ) : (
        <div className="space-y-sm">
          {tasks.map((task: any) => {
            const StatusIcon = STATUS_ICONS[task.status] ?? CircleDot;
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED';

            return (
              <Link
                key={task.id}
                to={`/tools/multi-store/tasks/${task.id}`}
                className="block bg-kore-white border border-kore-border p-md hover:border-kore-brass transition-colors"
              >
                <div className="flex items-start justify-between gap-md">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm flex-wrap">
                      <span className="font-display text-body font-medium text-kore-ink">
                        {task.title}
                      </span>
                      <span className="text-small text-kore-brass">
                        {TYPE_LABELS[task.type] ?? task.type}
                      </span>
                      <span className={`text-small font-medium ${PRIORITY_COLORS[task.priority] ?? 'text-kore-mid'}`}>
                        {PRIORITY_LABELS[task.priority] ?? task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-small text-kore-mid mt-xs truncate max-w-lg">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-md mt-xs flex-wrap">
                      <span className="flex items-center gap-xs text-small text-kore-mid">
                        <Store size={12} /> {task.storeIds?.length ?? 0} Stores
                      </span>
                      {task.deadline && (
                        <span className={`flex items-center gap-xs text-small ${isOverdue ? 'text-red-600' : 'text-kore-mid'}`}>
                          <Calendar size={12} />
                          {new Date(task.deadline).toLocaleDateString('de-DE')}
                          {isOverdue && ' (ueberfaellig)'}
                        </span>
                      )}
                      {task.tags?.length > 0 && (
                        <span className="flex items-center gap-xs text-small text-kore-mid">
                          <Tag size={12} /> {task.tags.join(', ')}
                        </span>
                      )}
                      <span className="text-small text-kore-mid">
                        von {task.createdByName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-sm shrink-0">
                    <span className={`flex items-center gap-xs px-sm py-xs text-small ${STATUS_COLORS[isOverdue ? 'OVERDUE' : task.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                      <StatusIcon size={14} />
                      {isOverdue ? 'Ueberfaellig' : STATUS_LABELS[task.status] ?? task.status}
                    </span>
                    <ChevronRight size={16} className="text-kore-mid" />
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
          Seite {result.page} von {Math.ceil(result.total / result.pageSize)} ({result.total} Aufgaben gesamt)
        </div>
      )}
    </div>
  );
}
