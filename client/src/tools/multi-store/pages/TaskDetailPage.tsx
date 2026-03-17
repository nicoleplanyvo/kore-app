import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Store,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CircleDot,
  Camera,
  MessageSquare,
  Send,
  XCircle,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useMultiStoreTask,
  useUpdateMultiStoreResponse,
  useAddMultiStoreComment,
  useDeleteMultiStoreTask,
} from '../../../hooks/useMultiStore';
import { useAuthStore } from '../../../stores/authStore';

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  COMPLETED: 'Erledigt',
  OVERDUE: 'Ueberfaellig',
  REJECTED: 'Abgelehnt',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
  REJECTED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const TYPE_LABELS: Record<string, string> = {
  TODO: 'To-Do',
  CHECKLIST: 'Checkliste',
  CAMPAIGN: 'Kampagne',
  SURVEY: 'Umfrage',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-kore-mid',
  MEDIUM: 'text-blue-600',
  HIGH: 'text-amber-600',
  URGENT: 'text-red-600',
};

const RESPONSE_STATUS_ICONS: Record<string, typeof CircleDot> = {
  OPEN: CircleDot,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle2,
  REJECTED: XCircle,
};

export function TaskDetailPage() {
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const { data: task, isLoading } = useMultiStoreTask(id);
  const updateResponse = useUpdateMultiStoreResponse();
  const addComment = useAddMultiStoreComment();
  const deleteTask = useDeleteMultiStoreTask();

  const [commentText, setCommentText] = useState('');
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!task) return <div className="p-xl text-body text-kore-mid">Aufgabe nicht gefunden.</div>;

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'COMPLETED';

  const handleCompleteStore = async (storeId: string) => {
    await updateResponse.mutateAsync({
      taskId: task.id,
      storeId,
      status: 'COMPLETED',
      feedback: feedbackText || undefined,
    });
    setFeedbackText('');
    setExpandedStore(null);
  };

  const handleRejectStore = async (storeId: string) => {
    if (!rejectionReason.trim()) return;
    await updateResponse.mutateAsync({
      taskId: task.id,
      storeId,
      status: 'REJECTED',
      rejectionReason: rejectionReason.trim(),
    });
    setRejectionReason('');
    setExpandedStore(null);
  };

  const handleStartStore = async (storeId: string) => {
    await updateResponse.mutateAsync({
      taskId: task.id,
      storeId,
      status: 'IN_PROGRESS',
    });
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync({
      taskId: task.id,
      message: commentText.trim(),
    });
    setCommentText('');
  };

  const handleDelete = async () => {
    if (!confirm('Aufgabe wirklich loeschen?')) return;
    await deleteTask.mutateAsync(task.id);
    window.location.href = '/tools/multi-store/tasks';
  };

  const toggleExpanded = (storeId: string) => {
    setExpandedStore((prev) => (prev === storeId ? null : storeId));
    setRejectionReason('');
    setFeedbackText('');
  };

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/multi-store/tasks" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <ClipboardList size={24} /> {task.title}
          </h1>
          <div className="flex items-center gap-sm mt-xs flex-wrap">
            <span className="text-small text-kore-brass">{TYPE_LABELS[task.type] ?? task.type}</span>
            <span className={`px-sm py-xs text-small border ${STATUS_COLORS[isOverdue ? 'OVERDUE' : task.status] ?? 'bg-kore-bg text-kore-mid border-kore-border'}`}>
              {isOverdue ? 'Ueberfaellig' : STATUS_LABELS[task.status] ?? task.status}
            </span>
            <span className={`text-small font-medium ${PRIORITY_COLORS[task.priority] ?? 'text-kore-mid'}`}>
              {PRIORITY_LABELS[task.priority] ?? task.priority}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-sm shrink-0">
          {task.createdBy === user?.id && (
            <button
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="px-md py-sm border border-red-200 text-red-600 text-small hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Loeschen
            </button>
          )}
        </div>
      </div>

      {/* Meta card */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Erstellt von</span>
            <p className="text-body text-kore-ink font-medium">{task.createdByName}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Kategorie</span>
            <p className="text-body text-kore-ink">{task.category}</p>
          </div>
          <div>
            <span className="flex items-center gap-xs text-small text-kore-mid">
              <Calendar size={12} /> Deadline
            </span>
            <p className={`text-body ${isOverdue ? 'text-red-600 font-medium' : 'text-kore-ink'}`}>
              {task.deadline ? new Date(task.deadline).toLocaleDateString('de-DE') : 'Keine'}
              {isOverdue && ' (ueberfaellig)'}
            </p>
          </div>
          <div>
            <span className="flex items-center gap-xs text-small text-kore-mid">
              <Store size={12} /> Stores
            </span>
            <p className="text-body text-kore-ink">{task.storeIds.length} zugewiesen</p>
          </div>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex items-center gap-sm mt-md pt-md border-t border-kore-border">
            <Tag size={14} className="text-kore-mid" />
            {task.tags.map((tag) => (
              <span key={tag} className="bg-kore-bg px-sm py-xs text-small text-kore-ink">{tag}</span>
            ))}
          </div>
        )}

        {/* Photo requirement */}
        {task.requiresPhoto && (
          <div className="flex items-center gap-sm mt-md pt-md border-t border-kore-border">
            <Camera size={14} className="text-amber-500" />
            <span className="text-small text-amber-700">Foto-Nachweis erforderlich</span>
          </div>
        )}

        {/* Campaign info */}
        {task.type === 'CAMPAIGN' && task.campaignName && (
          <div className="mt-md pt-md border-t border-kore-border">
            <span className="text-small text-kore-mid">Kampagne:</span>
            <span className="text-body text-kore-ink ml-sm font-medium">{task.campaignName}</span>
            {task.campaignStart && task.campaignEnd && (
              <span className="text-small text-kore-mid ml-md">
                {new Date(task.campaignStart).toLocaleDateString('de-DE')} - {new Date(task.campaignEnd).toLocaleDateString('de-DE')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <h3 className="font-display text-body font-medium text-kore-ink mb-sm">Beschreibung</h3>
          <p className="text-body text-kore-mid whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      {/* Checklist items */}
      {task.type === 'CHECKLIST' && task.checklistItems.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <h3 className="font-display text-body font-medium text-kore-ink mb-md">Checklisten-Punkte</h3>
          <div className="space-y-sm">
            {task.checklistItems.map((item, i) => (
              <div key={i} className="flex items-center gap-sm p-sm bg-kore-bg">
                <span className="text-small text-kore-mid w-6">{i + 1}.</span>
                <span className="text-body text-kore-ink">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance bar */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <div className="flex items-center justify-between mb-sm">
          <h3 className="font-display text-body font-medium text-kore-ink">Compliance</h3>
          <span className="font-display text-h3 text-kore-ink">{task.complianceRate}%</span>
        </div>
        <div className="h-3 bg-kore-bg rounded-sm overflow-hidden">
          <div
            className={`h-full transition-all ${
              task.complianceRate >= 80 ? 'bg-emerald-500' : task.complianceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${task.complianceRate}%` }}
          />
        </div>
        <div className="flex items-center gap-lg mt-sm text-small text-kore-mid">
          <span>{task.responses.filter((r: any) => r.status === 'COMPLETED').length} erledigt</span>
          <span>{task.responses.filter((r: any) => r.status === 'IN_PROGRESS').length} in Bearbeitung</span>
          <span>{task.responses.filter((r: any) => r.status === 'OPEN').length} offen</span>
          <span>{task.responses.filter((r: any) => r.status === 'REJECTED').length} abgelehnt</span>
        </div>
      </div>

      {/* Store responses */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <h3 className="font-display text-body font-medium text-kore-ink mb-md">Store-Status</h3>
        <div className="space-y-sm">
          {task.responses.map((resp: any) => {
            const RespIcon = RESPONSE_STATUS_ICONS[resp.status] ?? CircleDot;
            const isExpanded = expandedStore === resp.storeId;

            return (
              <div key={resp.id} className="border border-kore-border">
                <button
                  onClick={() => toggleExpanded(resp.storeId)}
                  className="w-full flex items-center justify-between p-md hover:bg-kore-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-sm">
                    <RespIcon size={16} className={
                      resp.status === 'COMPLETED' ? 'text-emerald-500' :
                      resp.status === 'IN_PROGRESS' ? 'text-amber-500' :
                      resp.status === 'REJECTED' ? 'text-red-500' :
                      'text-blue-500'
                    } />
                    <span className="font-medium text-kore-ink text-small">{resp.storeName}</span>
                    <span className={`px-sm py-xs text-small ${STATUS_COLORS[resp.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                      {STATUS_LABELS[resp.status] ?? resp.status}
                    </span>
                    {resp.completedByName && (
                      <span className="text-small text-kore-mid">
                        von {resp.completedByName}
                      </span>
                    )}
                    {resp.completedAt && (
                      <span className="text-small text-kore-mid">
                        am {new Date(resp.completedAt).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-kore-mid" /> : <ChevronDown size={16} className="text-kore-mid" />}
                </button>

                {isExpanded && (
                  <div className="px-md pb-md pt-sm border-t border-kore-border">
                    {resp.feedback && (
                      <div className="mb-md">
                        <span className="text-small text-kore-mid">Feedback:</span>
                        <p className="text-body text-kore-ink mt-xs">{resp.feedback}</p>
                      </div>
                    )}
                    {resp.rejectionReason && (
                      <div className="mb-md bg-red-50 border border-red-200 p-sm">
                        <span className="text-small text-red-600">Ablehnungsgrund:</span>
                        <p className="text-body text-red-700 mt-xs">{resp.rejectionReason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {resp.status === 'OPEN' && (
                      <div className="flex gap-sm">
                        <button
                          onClick={() => handleStartStore(resp.storeId)}
                          disabled={updateResponse.isPending}
                          className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-ink hover:bg-kore-bg disabled:opacity-50"
                        >
                          <Clock size={14} /> Starten
                        </button>
                        <button
                          onClick={() => handleCompleteStore(resp.storeId)}
                          disabled={updateResponse.isPending}
                          className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                        >
                          <Check size={14} /> Erledigt
                        </button>
                      </div>
                    )}

                    {resp.status === 'IN_PROGRESS' && (
                      <div className="space-y-sm">
                        <div>
                          <label className="block text-small text-kore-mid mb-xs">Feedback (optional)</label>
                          <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="Anmerkungen zur Erledigung..."
                            rows={2}
                            className="w-full border border-kore-border px-md py-sm text-small resize-y"
                          />
                        </div>
                        <div className="flex gap-sm">
                          <button
                            onClick={() => handleCompleteStore(resp.storeId)}
                            disabled={updateResponse.isPending}
                            className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                          >
                            <Check size={14} /> Als erledigt markieren
                          </button>
                          <div className="flex-1" />
                          <div className="flex flex-col gap-xs">
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Ablehnungsgrund..."
                              className="border border-kore-border px-md py-sm text-small"
                            />
                            <button
                              onClick={() => handleRejectStore(resp.storeId)}
                              disabled={updateResponse.isPending || !rejectionReason.trim()}
                              className="flex items-center gap-xs px-md py-sm border border-red-200 text-red-600 text-small hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle size={14} /> Ablehnen
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-kore-white border border-kore-border p-lg">
        <h3 className="font-display text-body font-medium text-kore-ink mb-md flex items-center gap-sm">
          <MessageSquare size={16} /> Kommentare ({task.comments?.length ?? 0})
        </h3>

        {task.comments?.length > 0 && (
          <div className="space-y-sm mb-lg">
            {task.comments.map((comment: any) => (
              <div key={comment.id} className="bg-kore-bg p-md">
                <div className="flex items-center gap-sm mb-xs">
                  <span className="text-small font-medium text-kore-ink">{comment.userName}</span>
                  <span className="text-small text-kore-mid">
                    {new Date(comment.createdAt).toLocaleString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-body text-kore-mid">{comment.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-sm">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
            placeholder="Kommentar schreiben..."
            className="flex-1 border border-kore-border px-md py-sm text-body"
          />
          <button
            onClick={handleAddComment}
            disabled={addComment.isPending || !commentText.trim()}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
          >
            <Send size={14} /> Senden
          </button>
        </div>
      </div>
    </div>
  );
}
