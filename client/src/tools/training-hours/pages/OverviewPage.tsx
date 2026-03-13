import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, BarChart3, List, Plus } from 'lucide-react';
import { useTrainingStores, useTrainingSummary, useCreateTrainingLog } from '../../../hooks/useTrainingHours';

const CATEGORIES = ['PRODUCT', 'SALES', 'SERVICE', 'COMPLIANCE', 'ONBOARDING', 'OTHER'];
const CATEGORY_LABELS: Record<string, string> = { PRODUCT: 'Produkt', SALES: 'Verkauf', SERVICE: 'Service', COMPLIANCE: 'Compliance', ONBOARDING: 'Onboarding', OTHER: 'Sonstiges' };

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useTrainingStores();
  const { data: summary, isLoading } = useTrainingSummary(storeId || undefined);
  const createLog = useCreateTrainingLog();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ userId: '', storeId: '', date: new Date().toISOString().slice(0, 10), durationMinutes: 0, category: 'PRODUCT', topic: '', notes: '' });

  const handleCreate = () => {
    createLog.mutate({ ...form, storeId: form.storeId || undefined, durationMinutes: Number(form.durationMinutes) }, {
      onSuccess: () => { setShowCreate(false); setForm({ userId: '', storeId: '', date: new Date().toISOString().slice(0, 10), durationMinutes: 0, category: 'PRODUCT', topic: '', notes: '' }); },
    });
  };

  const totalHours = summary ? Math.round(summary.totalMinutes / 60 * 10) / 10 : 0;

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Training Hours</h1>
          <p className="text-body text-kore-mid mt-xs">Schulungsstunden erfassen & auswerten</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl flex-wrap">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Link to="/tools/training-hours/logs" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <List size={14} /> Alle Einträge
        </Link>
        <Link to="/tools/training-hours/summary" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <BarChart3 size={14} /> Zusammenfassung
        </Link>
        <button onClick={() => setShowCreate(true)} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-opacity flex items-center gap-xs">
          <Plus size={14} /> Neuer Eintrag
        </button>
      </div>

      {showCreate && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-medium text-kore-ink mb-md">Neuen Training-Eintrag erfassen</h3>
          <div className="grid grid-cols-2 gap-md mb-md">
            <input placeholder="User-ID" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} className="border border-kore-border px-md py-sm text-small bg-kore-white">
              <option value="">Store wählen</option>
              {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input type="number" placeholder="Dauer (Min)" value={form.durationMinutes || ''} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="border border-kore-border px-md py-sm text-small" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-kore-border px-md py-sm text-small bg-kore-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <input placeholder="Thema" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
          </div>
          <textarea placeholder="Notizen" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-kore-border px-md py-sm text-small mb-md" rows={2} />
          <div className="flex gap-sm">
            <button onClick={handleCreate} disabled={!form.userId || !form.durationMinutes || createLog.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Erfassen</button>
            <button onClick={() => setShowCreate(false)} className="px-md py-sm border border-kore-border text-small">Abbrechen</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !summary ? (
        <div className="text-body text-kore-mid">Keine Daten verfügbar.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-lg mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="text-small text-kore-mid mb-xs">Gesamt Stunden</div>
              <div className="text-h2 font-display text-kore-ink flex items-center gap-sm"><Clock size={20} /> {totalHours}h</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="text-small text-kore-mid mb-xs">Einträge</div>
              <div className="text-h2 font-display text-kore-ink">{summary.totalLogs}</div>
            </div>
          </div>

          <h2 className="font-display text-h3 text-kore-ink mb-md">Nach Kategorie</h2>
          <div className="space-y-sm">
            {(summary.byCategory ?? []).map((cat: any) => (
              <div key={cat.category} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
                <span className="font-medium text-kore-ink">{CATEGORY_LABELS[cat.category] ?? cat.category}</span>
                <div className="flex gap-lg text-small text-kore-mid">
                  <span>{Math.round(cat.minutes / 60 * 10) / 10}h</span>
                  <span>{cat.count} Einträge</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
