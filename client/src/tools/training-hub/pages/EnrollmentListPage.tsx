import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, BookOpen, CheckCircle } from 'lucide-react';
import { useEnrollments, useUpdateEnrollmentProgress } from '../../../hooks/useTrainingHub';

const STATUS_COLORS: Record<string, string> = { ENROLLED: 'bg-blue-500', IN_PROGRESS: 'bg-amber-500', COMPLETED: 'bg-emerald-500' };
const STATUS_LABELS: Record<string, string> = { ENROLLED: 'Eingeschrieben', IN_PROGRESS: 'In Bearbeitung', COMPLETED: 'Abgeschlossen' };

export function EnrollmentListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useEnrollments({ page, status: status || undefined });
  const updateProgress = useUpdateEnrollmentProgress();

  const handleComplete = (enrollmentId: string) => {
    updateProgress.mutate({ id: enrollmentId, progress: 100, status: 'COMPLETED' });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/training-hub" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Enrollments</h1>
          <p className="text-body text-kore-mid mt-xs">Kurseinschreibungen & Fortschritt</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="ENROLLED">Eingeschrieben</option>
          <option value="IN_PROGRESS">In Bearbeitung</option>
          <option value="COMPLETED">Abgeschlossen</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !data?.data?.length ? (
        <div className="text-body text-kore-mid">Keine Enrollments gefunden.</div>
      ) : (
        <>
          <div className="space-y-sm">
            {data.data.map((e: any) => (
              <div key={e.id} className="bg-kore-white border border-kore-border p-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-sm mb-xs">
                    <Users size={14} className="text-kore-mid" />
                    <span className="font-medium text-kore-ink">{e.user?.name ?? 'Unbekannt'}</span>
                    {e.store && <span className="text-small text-kore-mid">· {e.store.name}</span>}
                  </div>
                  <div className="flex items-center gap-sm text-small text-kore-mid">
                    <BookOpen size={12} /> {e.course?.title ?? '—'}
                    <span className="mx-xs">·</span>
                    <div className="flex items-center gap-xs">
                      <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[e.status] ?? 'bg-kore-mid'}`} />
                      {STATUS_LABELS[e.status] ?? e.status}
                    </div>
                  </div>
                  <div className="mt-sm w-full bg-kore-bg rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${e.progress}%` }} />
                  </div>
                  <span className="text-small text-kore-mid">{e.progress}%</span>
                </div>
                {e.status !== 'COMPLETED' && (
                  <button onClick={() => handleComplete(e.id)} disabled={updateProgress.isPending} className="ml-lg px-md py-sm border border-emerald-500 text-emerald-600 text-small hover:bg-emerald-50 disabled:opacity-50 flex items-center gap-xs">
                    <CheckCircle size={14} /> Abschließen
                  </button>
                )}
              </div>
            ))}
          </div>
          {data.total > data.pageSize && (
            <div className="flex gap-sm mt-lg">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Zurück</button>
              <span className="px-md py-sm text-small text-kore-mid">Seite {data.page} / {Math.ceil(data.total / data.pageSize)}</span>
              <button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
