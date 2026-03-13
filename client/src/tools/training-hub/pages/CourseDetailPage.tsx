import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, Users, Clock } from 'lucide-react';
import { useCourse, useUpdateCourse, useCreateModule, useEnrollUser } from '../../../hooks/useTrainingHub';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', PUBLISHED: 'Veröffentlicht', ARCHIVED: 'Archiviert' };

export function CourseDetailPage() {
  const { id } = useParams();
  const { data: course, isLoading } = useCourse(id);
  const updateCourse = useUpdateCourse();
  const createModule = useCreateModule();
  const enrollUser = useEnrollUser();
  const [showAddModule, setShowAddModule] = useState(false);
  const [modForm, setModForm] = useState({ title: '', content: '', sortOrder: 0, durationMinutes: 0 });
  const [enrollForm, setEnrollForm] = useState({ userId: '', storeId: '' });
  const [showEnroll, setShowEnroll] = useState(false);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!course) return <div className="p-xl text-body text-kore-mid">Kurs nicht gefunden.</div>;

  const handlePublish = () => updateCourse.mutate({ id: course.id, status: 'PUBLISHED' });
  const handleArchive = () => updateCourse.mutate({ id: course.id, status: 'ARCHIVED' });

  const handleAddModule = () => {
    createModule.mutate({ courseId: course.id, ...modForm }, {
      onSuccess: () => { setShowAddModule(false); setModForm({ title: '', content: '', sortOrder: 0, durationMinutes: 0 }); },
    });
  };

  const handleEnroll = () => {
    enrollUser.mutate({ courseId: course.id, userId: enrollForm.userId, storeId: enrollForm.storeId || undefined }, {
      onSuccess: () => { setShowEnroll(false); setEnrollForm({ userId: '', storeId: '' }); },
    });
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/training-hub" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BookOpen size={24} /> {course.title}
          </h1>
          <p className="text-body text-kore-mid mt-xs">{STATUS_LABELS[course.status] ?? course.status} · {course.category || 'Allgemein'} · {course.durationMinutes} Min</p>
        </div>
      </div>

      {course.description && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <p className="text-body text-kore-ink">{course.description}</p>
        </div>
      )}

      <div className="flex gap-sm mb-xl flex-wrap">
        {course.status === 'DRAFT' && (
          <button onClick={handlePublish} disabled={updateCourse.isPending} className="px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50">Veröffentlichen</button>
        )}
        {course.status === 'PUBLISHED' && (
          <button onClick={handleArchive} disabled={updateCourse.isPending} className="px-md py-sm bg-amber-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50">Archivieren</button>
        )}
        <button onClick={() => setShowAddModule(true)} className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs"><Plus size={14} /> Modul hinzufügen</button>
        <button onClick={() => setShowEnroll(true)} className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs"><Users size={14} /> Teilnehmer einschreiben</button>
      </div>

      {showAddModule && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <h3 className="font-medium text-kore-ink mb-md">Neues Modul</h3>
          <div className="grid grid-cols-2 gap-md mb-md">
            <input placeholder="Titel" value={modForm.title} onChange={(e) => setModForm({ ...modForm, title: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input type="number" placeholder="Reihenfolge" value={modForm.sortOrder || ''} onChange={(e) => setModForm({ ...modForm, sortOrder: Number(e.target.value) })} className="border border-kore-border px-md py-sm text-small" />
            <input type="number" placeholder="Dauer (Min)" value={modForm.durationMinutes || ''} onChange={(e) => setModForm({ ...modForm, durationMinutes: Number(e.target.value) })} className="border border-kore-border px-md py-sm text-small" />
          </div>
          <textarea placeholder="Inhalt" value={modForm.content} onChange={(e) => setModForm({ ...modForm, content: e.target.value })} className="w-full border border-kore-border px-md py-sm text-small mb-md" rows={3} />
          <div className="flex gap-sm">
            <button onClick={handleAddModule} disabled={!modForm.title || createModule.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small disabled:opacity-50">Hinzufügen</button>
            <button onClick={() => setShowAddModule(false)} className="px-md py-sm border border-kore-border text-small">Abbrechen</button>
          </div>
        </div>
      )}

      {showEnroll && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <h3 className="font-medium text-kore-ink mb-md">Teilnehmer einschreiben</h3>
          <div className="grid grid-cols-2 gap-md mb-md">
            <input placeholder="User-ID" value={enrollForm.userId} onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input placeholder="Store-ID (optional)" value={enrollForm.storeId} onChange={(e) => setEnrollForm({ ...enrollForm, storeId: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
          </div>
          <div className="flex gap-sm">
            <button onClick={handleEnroll} disabled={!enrollForm.userId || enrollUser.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small disabled:opacity-50">Einschreiben</button>
            <button onClick={() => setShowEnroll(false)} className="px-md py-sm border border-kore-border text-small">Abbrechen</button>
          </div>
        </div>
      )}

      <h2 className="font-display text-h3 text-kore-ink mb-md">Module ({course.modules?.length ?? 0})</h2>
      {!course.modules?.length ? (
        <p className="text-body text-kore-mid">Noch keine Module angelegt.</p>
      ) : (
        <div className="space-y-sm">
          {course.modules.map((mod: any, i: number) => (
            <div key={mod.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
              <div>
                <span className="text-small text-kore-mid mr-sm">{i + 1}.</span>
                <span className="font-medium text-kore-ink">{mod.title}</span>
              </div>
              <div className="flex items-center gap-xs text-small text-kore-mid">
                <Clock size={12} /> {mod.durationMinutes} Min
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-lg text-small text-kore-mid">
        Teilnehmer: {course._count?.enrollments ?? 0} · {course.isRequired && <span className="text-amber-600">Pflichtkurs</span>}
      </div>
    </div>
  );
}
