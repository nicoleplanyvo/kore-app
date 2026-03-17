import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useAppraisalStores, useAppraisalUsers, useCreateAppraisal } from '../../../hooks/useAppraisals';

export function CreatePage() {
  const navigate = useNavigate();
  const { data: stores } = useAppraisalStores();
  const [storeId, setStoreId] = useState('');
  const { data: users } = useAppraisalUsers(storeId || undefined);
  const create = useCreateAppraisal();

  const [form, setForm] = useState({
    employeeId: '',
    templateName: 'Standard',
    dueDate: '',
    requestSelfAssessment: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { ...form, storeId: storeId || undefined },
      { onSuccess: () => navigate('/tools/appraisals') },
    );
  };

  return (
    <div className="p-xl max-w-3xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/appraisals" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Neue Beurteilung</h1>
          <p className="text-body text-kore-mid mt-xs">Mitarbeiter auswaehlen, Vorlage festlegen und Faelligkeitsdatum setzen</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-xl space-y-lg">
        {/* Store Selection */}
        <div>
          <label className="block text-small text-kore-mid mb-xs uppercase tracking-widest">Store</label>
          <select
            value={storeId}
            onChange={e => { setStoreId(e.target.value); setForm({ ...form, employeeId: '' }); }}
            className="w-full border border-kore-border px-md py-sm text-body"
          >
            <option value="">-- Store waehlen (optional) --</option>
            {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>)}
          </select>
        </div>

        {/* Employee Selection */}
        <div>
          <label className="block text-small text-kore-mid mb-xs uppercase tracking-widest">Mitarbeiter *</label>
          <select
            value={form.employeeId}
            onChange={e => setForm({ ...form, employeeId: e.target.value })}
            className="w-full border border-kore-border px-md py-sm text-body"
            required
          >
            <option value="">-- Mitarbeiter waehlen --</option>
            {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>

        {/* Template */}
        <div>
          <label className="block text-small text-kore-mid mb-xs uppercase tracking-widest">Vorlage</label>
          <select
            value={form.templateName}
            onChange={e => setForm({ ...form, templateName: e.target.value })}
            className="w-full border border-kore-border px-md py-sm text-body"
          >
            <option value="Standard">Standard (alle Kategorien)</option>
            <option value="Verkauf">Verkauf</option>
            <option value="Fuehrungskraft">Fuehrungskraft</option>
            <option value="Lager">Lager / Logistik</option>
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-small text-kore-mid mb-xs uppercase tracking-widest">Faelligkeitsdatum</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
            className="w-full border border-kore-border px-md py-sm text-body"
          />
        </div>

        {/* Self Assessment */}
        <div className="flex items-center gap-md">
          <input
            type="checkbox"
            id="selfAssessment"
            checked={form.requestSelfAssessment}
            onChange={e => setForm({ ...form, requestSelfAssessment: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="selfAssessment" className="text-body text-kore-ink">
            Selbsteinschaetzung anfordern (Mitarbeiter fuellt gleichen Bogen vorab aus)
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-sm pt-md">
          <button
            type="submit"
            disabled={!form.employeeId || create.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <UserPlus size={16} /> {create.isPending ? 'Erstelle...' : 'Beurteilung erstellen'}
          </button>
          <Link to="/tools/appraisals" className="px-xl py-md-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors">
            Abbrechen
          </Link>
        </div>

        {create.isError && (
          <p className="text-small text-red-600 mt-sm">Fehler: {(create.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
