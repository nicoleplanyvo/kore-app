import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff, Upload, Archive } from 'lucide-react';
import { useSopDocument, useSopCategories } from '../../../hooks/useSop';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { api } from '../../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function CreateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: existingDoc } = useSopDocument(isEdit ? id : undefined);
  const { data: categories } = useSopCategories();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingDoc) {
      setTitle(existingDoc.title);
      setCategoryId(existingDoc.categoryId);
      setContent(existingDoc.content);
    }
  }, [existingDoc]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSaving(true);
      if (isEdit) {
        return api(`/api/tools/sop/documents/${id}`, { method: 'PUT', body: JSON.stringify({ title, categoryId, content }) });
      } else {
        return api('/api/tools/sop/documents', { method: 'POST', body: JSON.stringify({ title, categoryId, content }) });
      }
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['sop'] });
      navigate(`/tools/sop/documents/${data.id || id}`);
    },
    onSettled: () => setSaving(false),
  });

  const publishMutation = useMutation({
    mutationFn: () => api(`/api/tools/sop/documents/${id}/publish`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop'] }); navigate(`/tools/sop/documents/${id}`); },
  });

  const archiveMutation = useMutation({
    mutationFn: () => api(`/api/tools/sop/documents/${id}/archive`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop'] }); navigate('/tools/sop'); },
  });

  return (
    <div className="p-xl max-w-4xl">
      <Link to="/tools/sop" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>

      <div className="flex items-center justify-between mb-xl">
        <h1 className="font-display text-h1 text-kore-ink">{isEdit ? 'SOP bearbeiten' : 'Neues SOP erstellen'}</h1>
        <div className="flex items-center gap-md">
          {isEdit && existingDoc?.status === 'DRAFT' && (
            <button onClick={() => publishMutation.mutate()} className="flex items-center gap-sm bg-emerald-600 text-white px-md py-sm text-small font-medium uppercase tracking-widest hover:bg-emerald-700 transition-colors"><Upload size={14} /> Veröffentlichen</button>
          )}
          {isEdit && existingDoc?.status === 'PUBLISHED' && (
            <button onClick={() => archiveMutation.mutate()} className="flex items-center gap-sm border border-kore-border text-kore-mid px-md py-sm text-small hover:bg-kore-bg transition-colors"><Archive size={14} /> Archivieren</button>
          )}
        </div>
      </div>

      <div className="bg-kore-white border border-kore-border p-xl space-y-lg">
        <div>
          <label className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Titel</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="SOP-Titel..." className="w-full border border-kore-border px-lg py-md text-body focus:outline-none focus:border-kore-brass" />
        </div>

        <div>
          <label className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Kategorie</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full border border-kore-border px-lg py-md text-body focus:outline-none focus:border-kore-brass bg-white">
            <option value="">Kategorie wählen...</option>
            {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-sm">
            <label className="text-small text-kore-mid uppercase tracking-widest">Inhalt (Markdown)</label>
            <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink">
              {showPreview ? <><EyeOff size={14} /> Editor</> : <><Eye size={14} /> Vorschau</>}
            </button>
          </div>
          {showPreview ? (
            <div className="border border-kore-border p-lg min-h-[300px]"><MarkdownRenderer content={content} /></div>
          ) : (
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={15} placeholder="# Überschrift&#10;&#10;## Abschnitt&#10;&#10;Inhalt hier..." className="w-full border border-kore-border px-lg py-md text-body font-mono text-small focus:outline-none focus:border-kore-brass resize-y" />
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={() => saveMutation.mutate()} disabled={saving || !title || !categoryId || !content} className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50">
            <Save size={16} /> {isEdit ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}
