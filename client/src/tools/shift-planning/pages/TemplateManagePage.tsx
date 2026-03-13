import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Plus } from 'lucide-react';
import { useShiftTemplates, useCreateShiftTemplate } from '../../../hooks/useShiftPlanning';

const DAY_LABELS: Record<number, string> = { 0: 'Sonntag', 1: 'Montag', 2: 'Dienstag', 3: 'Mittwoch', 4: 'Donnerstag', 5: 'Freitag', 6: 'Samstag' };

export function TemplateManagePage() {
  const { data: templates, isLoading } = useShiftTemplates();
  const create = useCreateShiftTemplate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', minStaff: 1, role: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({ ...form, dayOfWeek: Number(form.dayOfWeek), minStaff: Number(form.minStaff) }, {
      onSuccess: () => { setShowForm(false); setForm({ name: '', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', minStaff: 1, role: '' }); },
    });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/shift-planning" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Settings size={24} /> Schichtvorlagen</h1>
          <p className="text-body text-kore-mid mt-xs">Wiederkehrende Schichtmuster verwalten.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neue Vorlage
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="z.B. Frühschicht Mo-Fr" className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Wochentag</label>
              <select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body">
                {[1,2,3,4,5,6,0].map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Beginn</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Ende</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Min. Personal</label>
              <input type="number" min={1} value={form.minStaff} onChange={e => setForm({ ...form, minStaff: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Rolle</label>
            <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="z.B. Floor, Kasse" className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Vorlage speichern</button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Vorlagen...</div>
      ) : !templates?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Schichtvorlagen vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
              <div>
                <span className="font-medium text-kore-ink">{t.name}</span>
                <div className="flex gap-md text-small text-kore-mid mt-xs">
                  <span>{DAY_LABELS[t.dayOfWeek] ?? `Tag ${t.dayOfWeek}`}</span>
                  <span>{t.startTime} – {t.endTime}</span>
                  {t.role && <span>{t.role}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-small text-kore-mid">Min. Personal</div>
                <div className="font-display text-h3 text-kore-ink">{t.minStaff}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
