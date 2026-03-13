import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useVmStores, useVmGuidelines } from '../../../hooks/useVmCompliance';
import { apiUpload } from '../../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function SubmitPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: stores } = useVmStores();
  const { data: guidelines } = useVmGuidelines();

  const [storeId, setStoreId] = useState('');
  const [guidelineId, setGuidelineId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Kein Foto ausgewählt');
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('guidelineId', guidelineId);
      fd.append('storeId', storeId);
      return apiUpload('/api/tools/vm-compliance/submissions', fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vm'] }); navigate('/tools/vm-compliance'); },
  });

  return (
    <div className="p-xl max-w-2xl">
      <Link to="/tools/vm-compliance" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>
      <h1 className="font-display text-h1 text-kore-ink mb-2xl">Foto einreichen</h1>

      <div className="bg-kore-white border border-kore-border p-xl space-y-lg">
        <div>
          <label className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Store</label>
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="w-full border border-kore-border px-lg py-md text-body bg-white focus:outline-none focus:border-kore-brass">
            <option value="">Store wählen...</option>
            {(stores ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Guideline</label>
          <select value={guidelineId} onChange={e => setGuidelineId(e.target.value)} className="w-full border border-kore-border px-lg py-md text-body bg-white focus:outline-none focus:border-kore-brass">
            <option value="">Guideline wählen...</option>
            {(guidelines ?? []).map(g => <option key={g.id} value={g.id}>{g.name}{g.category ? ` (${g.category})` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Foto</label>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="w-full border border-kore-border px-lg py-md text-body bg-white" />
        </div>
        <div className="flex justify-end">
          <button onClick={() => submitMutation.mutate()} disabled={!storeId || !guidelineId || !file || submitMutation.isPending} className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50">
            <Upload size={16} /> Einreichen
          </button>
        </div>
      </div>
    </div>
  );
}
