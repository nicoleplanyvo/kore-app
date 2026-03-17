import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, BarChart3, Trash2, X } from 'lucide-react';
import { usePulseSurveys, useCreatePulseSurvey, useDeletePulseSurvey, useUpdatePulseSurvey } from '../../../hooks/usePulseSurvey';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', CLOSED: 'Geschlossen' };
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-kore-bg text-kore-mid',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-blue-100 text-blue-700',
};

export function OverviewPage() {
  const { data: surveys, isLoading } = usePulseSurveys();
  const create = useCreatePulseSurvey();
  const deleteSurvey = useDeletePulseSurvey();
  const updateSurvey = useUpdatePulseSurvey();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', isAnonymous: true });
  const [filterStatus, setFilterStatus] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ title: '', startDate: '', endDate: '', isAnonymous: true });
      },
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Umfrage wirklich loeschen? Alle Fragen und Antworten werden entfernt.')) return;
    deleteSurvey.mutate(id);
  };

  const handleStatusChange = (e: React.MouseEvent, id: string, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    updateSurvey.mutate({ id, status: newStatus });
  };

  const filtered = surveys?.filter((s: any) => !filterStatus || s.status === filterStatus) || [];

  const counts = {
    all: surveys?.length ?? 0,
    DRAFT: surveys?.filter((s: any) => s.status === 'DRAFT').length ?? 0,
    ACTIVE: surveys?.filter((s: any) => s.status === 'ACTIVE').length ?? 0,
    CLOSED: surveys?.filter((s: any) => s.status === 'CLOSED').length ?? 0,
  };

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <ClipboardList size={24} /> Pulse Survey
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Mitarbeiterbefragungen erstellen, verwalten und auswerten.
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Link
            to="/tools/pulse-survey/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
          >
            <BarChart3 size={14} /> Dashboard
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neue Umfrage
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-display text-h3 text-kore-ink">Neue Umfrage erstellen</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-kore-mid hover:text-kore-ink">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                placeholder="z.B. Mitarbeiterzufriedenheit Q1 2026"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Startdatum</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full border border-kore-border px-md py-sm text-body"
                />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Enddatum</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full border border-kore-border px-md py-sm text-body"
                />
              </div>
            </div>
            <label className="flex items-center gap-sm text-body text-kore-ink cursor-pointer">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={e => setForm({ ...form, isAnonymous: e.target.checked })}
                className="w-4 h-4 accent-kore-ink"
              />
              Anonyme Teilnahme
            </label>
          </div>
          <div className="flex items-center gap-md mt-lg">
            <button
              type="submit"
              disabled={create.isPending}
              className="px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              {create.isPending ? 'Erstellen...' : 'Umfrage anlegen'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-lg py-sm border border-kore-border text-kore-mid text-small hover:text-kore-ink"
            >
              Abbrechen
            </button>
          </div>
          {create.isError && (
            <p className="text-small text-red-600 mt-sm">{(create.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-sm mb-lg">
        {[
          { key: '', label: `Alle (${counts.all})` },
          { key: 'DRAFT', label: `Entwurf (${counts.DRAFT})` },
          { key: 'ACTIVE', label: `Aktiv (${counts.ACTIVE})` },
          { key: 'CLOSED', label: `Geschlossen (${counts.CLOSED})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-md py-sm text-small border ${filterStatus === tab.key ? 'bg-kore-ink text-kore-white border-kore-ink' : 'border-kore-border text-kore-mid hover:text-kore-ink'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Survey list */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Umfragen...</div>
      ) : !filtered.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl flex flex-col items-center text-center">
          <ClipboardList size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Umfragen vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erstellen Sie Ihre erste Mitarbeiterbefragung.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Erste Umfrage erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-sm">
          {filtered.map((s: any) => (
            <Link
              key={s.id}
              to={`/tools/pulse-survey/surveys/${s.id}`}
              className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <span className="font-medium text-kore-ink">{s.title}</span>
                  <span className={`px-sm py-xs text-xs ${STATUS_COLORS[s.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </div>
                <div className="flex items-center gap-sm">
                  {s.status === 'DRAFT' && (
                    <button
                      onClick={e => handleStatusChange(e, s.id, 'ACTIVE')}
                      className="px-sm py-xs text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    >
                      Aktivieren
                    </button>
                  )}
                  {s.status === 'ACTIVE' && (
                    <button
                      onClick={e => handleStatusChange(e, s.id, 'CLOSED')}
                      className="px-sm py-xs text-xs bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      Schliessen
                    </button>
                  )}
                  <button
                    onClick={e => handleDelete(e, s.id)}
                    className="text-kore-mid hover:text-red-600 p-xs"
                    title="Loeschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                {s.startDate && s.endDate && (
                  <span>
                    {new Date(s.startDate).toLocaleDateString('de-DE')} – {new Date(s.endDate).toLocaleDateString('de-DE')}
                  </span>
                )}
                <span>{s._count?.questions ?? 0} Fragen</span>
                <span>{s._count?.responses ?? 0} Antworten</span>
                {s.isAnonymous && <span className="text-indigo-600">Anonym</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
