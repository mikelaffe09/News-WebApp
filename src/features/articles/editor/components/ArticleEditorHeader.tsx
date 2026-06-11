import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  Eye,
  Loader,
  Save,
  Send,
  Zap,
} from 'lucide-react';
import { ArticleFormState } from '../../articleTypes';
import { STATUS_COLORS, STATUS_LABELS } from '../../articleConstants';
import { AutosaveStatus, SaveStatus } from '../useArticleEditor';
import {
  ALLOWED_WORKFLOW_TRANSITIONS,
  WorkflowTransitionId,
  WORKFLOW_ACTION_COLORS,
  WORKFLOW_ACTION_LABELS,
} from '../articleEditorWorkflow';

interface Props {
  autosaveStatus: AutosaveStatus;
  errorMsg: string;
  form: ArticleFormState;
  isNew: boolean;
  onSave: (transition?: WorkflowTransitionId) => void;
  saveStatus: SaveStatus;
  saving: boolean;
  scheduledAt: string;
  setScheduledAt: (value: string) => void;
  setShowScheduler: (value: boolean) => void;
  showScheduler: boolean;
}

export default function ArticleEditorHeader({
  autosaveStatus,
  errorMsg,
  form,
  isNew,
  onSave,
  saveStatus,
  saving,
  scheduledAt,
  setScheduledAt,
  setShowScheduler,
  showScheduler,
}: Props) {
  const allowedTransitions = ALLOWED_WORKFLOW_TRANSITIONS[form.status] || [];
  const primaryAction = allowedTransitions.find(action => ['in_review', 'published', 'approved'].includes(action));
  const hasPublishMenu = allowedTransitions.includes('published') || allowedTransitions.includes('scheduled');

  return (
    <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <Link to="/cms/articles" className="text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-slate-900">{isNew ? 'New article' : 'Edit article'}</h1>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[form.status]}`}>
          {STATUS_LABELS[form.status]}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {autosaveStatus === 'saving' && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader size={11} className="animate-spin" />Autosaving...</span>}
        {autosaveStatus === 'saved' && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={11} />Autosaved</span>}

        {saveStatus === 'saved' && <span className="flex items-center gap-1.5 text-green-600 text-sm"><CheckCircle size={14} />Saved</span>}
        {saveStatus === 'error' && <span className="flex items-center gap-1.5 text-red-600 text-sm"><AlertCircle size={14} />{errorMsg}</span>}

        {form.status === 'published' && form.slug && (
          <a href={`/article/${form.slug}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors">
            <Eye size={15} />View live
          </a>
        )}

        <button onClick={() => onSave()} disabled={saving}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
          {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}Save
        </button>

        {primaryAction && primaryAction !== 'published' && (
          <button onClick={() => onSave(primaryAction)} disabled={saving}
            className={`flex items-center gap-2 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${WORKFLOW_ACTION_COLORS[primaryAction]}`}>
            <Send size={14} />{WORKFLOW_ACTION_LABELS[primaryAction]}
          </button>
        )}

        {hasPublishMenu && (
          <div className="relative">
            <button onClick={() => setShowScheduler(!showScheduler)} disabled={saving}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              {form.status === 'published' ? 'Update' : 'Publish'} <ChevronDown size={14} />
            </button>
            {showScheduler && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-20 w-72">
                <button onClick={() => { setShowScheduler(false); onSave('published'); }}
                  className="w-full flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors mb-3">
                  <Zap size={15} />Publish immediately
                </button>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Schedule for later</p>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2" />
                  <button onClick={() => { if (!scheduledAt) return; setShowScheduler(false); onSave('scheduled'); }}
                    disabled={!scheduledAt}
                    className="w-full flex items-center gap-2 justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                    <Calendar size={15} />Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
