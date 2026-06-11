import { FormEvent } from 'react';
import { Send } from 'lucide-react';
import { ArticleStatus, WorkflowComment } from '../../../../types';
import { compactTimeAgo } from '../../../../utils/date';
import {
  ALLOWED_WORKFLOW_TRANSITIONS,
  WorkflowTransitionId,
  WORKFLOW_ACTION_COLORS,
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_STATUS_LABELS,
} from '../articleEditorWorkflow';

interface Props {
  currentStatus: ArticleStatus;
  loading: boolean;
  newComment: string;
  onAddComment: (event: FormEvent) => void;
  onSave: (transition: WorkflowTransitionId) => void;
  publishedAt: string | null;
  saving: boolean;
  scheduledAt: string | null;
  setNewComment: (value: string) => void;
  workflowComments: WorkflowComment[];
}

export default function WorkflowPanel({
  currentStatus,
  loading,
  newComment,
  onAddComment,
  onSave,
  publishedAt,
  saving,
  scheduledAt,
  setNewComment,
  workflowComments,
}: Props) {
  const allowedTransitions = ALLOWED_WORKFLOW_TRANSITIONS[currentStatus] || [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Workflow activity</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-400 animate-pulse">Loading...</div>
          ) : workflowComments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No workflow activity yet.</div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
              {workflowComments.map(comment => (
                <div key={comment.id} className="flex gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                    {comment.author_email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-700">{comment.author_email}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${
                        comment.action === 'published' ? 'bg-green-100 text-green-700' :
                        comment.action === 'approved' ? 'bg-blue-100 text-blue-700' :
                        comment.action === 'rejected' ? 'bg-red-100 text-red-700' :
                        comment.action === 'submitted' ? 'bg-amber-100 text-amber-700' :
                        comment.action === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{comment.action}</span>
                      <span className="text-xs text-slate-400 ml-auto">{compactTimeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-700">{comment.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 py-4 border-t border-slate-100">
            <form onSubmit={onAddComment} className="flex gap-2">
              <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Add a note for editors..."
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              <button type="submit" disabled={!newComment.trim()}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors disabled:opacity-40">
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Workflow actions</h3>
          <div className="space-y-2">
            {allowedTransitions.map(transition => (
              <button key={transition} onClick={() => onSave(transition)} disabled={saving}
                className={`w-full flex items-center gap-2 justify-center text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${WORKFLOW_ACTION_COLORS[transition]}`}>
                {WORKFLOW_ACTION_LABELS[transition]}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current status</p>
            <p className="text-sm font-medium text-slate-800">{WORKFLOW_STATUS_LABELS[currentStatus]}</p>
            {publishedAt && <p className="text-xs text-slate-400 mt-1">Published {compactTimeAgo(publishedAt)}</p>}
            {scheduledAt && <p className="text-xs text-purple-600 mt-1">Scheduled for {new Date(scheduledAt).toLocaleString()}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
