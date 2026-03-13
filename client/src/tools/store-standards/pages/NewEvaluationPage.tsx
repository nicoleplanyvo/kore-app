import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { useStdStores } from '../../../hooks/useStoreStandards';
import { api } from '../../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function NewEvaluationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: stores } = useStdStores();
  const [storeId, setStoreId] = useState('');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-KW${String(Math.ceil((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 604800000)).padStart(2, '0')}`;
  });

  const createMutation = useMutation({
    mutationFn: () => api<{ id: string }>('/api/tools/store-standards/evaluations', { method: 'POST', body: JSON.stringify({ storeId, period }) }),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['standards'] }); navigate(`/tools/store-standards/evaluations/${data.id}/conduct`); },
  });

  return (
    <div className="p-xl max-w-2xl">
      <Link to="/tools/store-standards" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>
      <h1 className="font-display text-h1 text-kore-ink mb-2xl">Neue Bewertung</h1>

      <div className="bg-kore-white border border-kore-border p-xl space-y-lg">
        <div>
          <label className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Store</label>
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="w-full border border-kore-border px-lg py-md text-body bg-white focus:outline-none focus:border-kore-brass">
            <option value="">Store wählen...</option>
            {(stores ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Periode</label>
          <input type="text" value={period} onChange={e => setPeriod(e.target.value)} placeholder="z.B. 2025-KW12" className="w-full border border-kore-border px-lg py-md text-body focus:outline-none focus:border-kore-brass" />
        </div>
        <div className="flex justify-end">
          <button onClick={() => createMutation.mutate()} disabled={!storeId || !period || createMutation.isPending} className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"><Play size={16} /> Bewertung starten</button>
        </div>
      </div>
    </div>
  );
}
