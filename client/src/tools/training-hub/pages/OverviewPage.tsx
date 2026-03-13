import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Plus, Award } from 'lucide-react';
import { useCourses, useCreateCourse, useCompletionReport } from '../../../hooks/useTrainingHub';

const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-kore-mid', PUBLISHED: 'bg-emerald-500', ARCHIVED: 'bg-amber-500' };
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', PUBLISHED: 'Veröffentlicht', ARCHIVED: 'Archiviert' };

export function OverviewPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useCourses({ page, status: status || undefined });
  const { data: report } = useCompletionReport();
  const createCourse = useCreateCourse();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', durationMinutes: 0, isRequired: false });

  const handleCreate = () => {
    createCourse.mutate(form, { onSuccess: () => { setShowCreate(false); setForm({ title: '', description: '', category: '', durationMinutes: 0, isRequired: false }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Training Hub</h1>
          <p className="text-body text-kore-mid mt-xs">Kurse, Module & Enrollments verwalten</p>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-3 gap-lg mb-xl">
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="text-small text-kore-mid mb-xs">Gesamt Enrollments</div>
            <div className="text-h2 font-display text-kore-ink">{report.total}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="text-small text-kore-mid mb-xs">Ø Fortschritt</div>
            <div className="text-h2 font-display text-kore-ink">{report.avgProgress}%</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="text-small text-kore-mid mb-xs">Abgeschlossen</div>
            <div className="text-h2 font-display text-emerald-600">{report.byStatus?.COMPLETED ?? 0}</div>
          </div>
        </div>
      )}

      <div className="flex gap-md mb-xl flex-wrap">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="PUBLISHED">Veröffentlicht</option>
          <option value="ARCHIVED">Archiviert</option>
        </select>
        <Link to="/tools/training-hub/enrollments" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <Users size={14} /> Enrollments
        </Link>
        <button onClick={() => setShowCreate(true)} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-opacity flex items-center gap-xs">
          <Plus size={14} /> Neuer Kurs
        </button>
      </div>

      {showCreate && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-medium text-kore-ink mb-md">Neuen Kurs anlegen</h3>
          <div className="grid grid-cols-2 gap-md mb-md">
            <input placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input placeholder="Kategorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input type="number" placeholder="Dauer (Min)" value={form.durationMinutes || ''} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="border border-kore-border px-md py-sm text-small" />
            <label className="flex items-center gap-xs text-small"><input type="checkbox" checked={form.isRequired} onChange={(e) => setForm({ ...form, isRequired: e.target.checked })} /> Pflichtkurs</label>
          </div>
          <textarea placeholder="Beschreibung" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-kore-border px-md py-sm text-small mb-md" rows={2} />
          <div className="flex gap-sm">
            <button onClick={handleCreate} disabled={!form.title || createCourse.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Erstellen</button>
            <button onClick={() => setShowCreate(false)} className="px-md py-sm border border-kore-border text-small">Abbrechen</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !data?.data?.length ? (
        <div className="text-body text-kore-mid">Keine Kurse gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {data.data.map((course: any) => (
              <Link key={course.id} to={`/tools/training-hub/courses/${course.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors">
                <div className="flex items-center justify-between mb-sm">
                  <h3 className="font-medium text-kore-ink flex items-center gap-xs">
                    <BookOpen size={16} /> {course.title}
                  </h3>
                  <div className="flex items-center gap-xs">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[course.status] ?? 'bg-kore-mid'}`} />
                    <span className="text-small text-kore-mid">{STATUS_LABELS[course.status] ?? course.status}</span>
                  </div>
                </div>
                {course.description && <p className="text-small text-kore-mid mb-sm line-clamp-2">{course.description}</p>}
                <div className="flex gap-lg text-small text-kore-mid">
                  {course.category && <span>{course.category}</span>}
                  {course.durationMinutes > 0 && <span>{course.durationMinutes} Min</span>}
                  <span className="flex items-center gap-xs"><Award size={12} /> {course._count?.modules ?? 0} Module</span>
                  <span className="flex items-center gap-xs"><Users size={12} /> {course._count?.enrollments ?? 0} Teilnehmer</span>
                  {course.isRequired && <span className="text-amber-600 font-medium">Pflicht</span>}
                </div>
              </Link>
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
