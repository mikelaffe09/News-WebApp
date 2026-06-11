import { ArticleRevision } from '../../../../types';
import { compactTimeAgo } from '../../../../utils/date';

interface Props {
  loading: boolean;
  onRestore: (revision: ArticleRevision) => void;
  onView: (revision: ArticleRevision) => void;
  revisions: ArticleRevision[];
}

export default function RevisionHistoryPanel({ loading, onRestore, onView, revisions }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-800">Revision history</h2>
        <p className="text-xs text-slate-400 mt-0.5">Snapshots saved each time the article is saved.</p>
      </div>
      {loading ? (
        <div className="p-8 text-center text-slate-400 animate-pulse">Loading revisions...</div>
      ) : revisions.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">No revisions saved yet. Save the article to create the first revision.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {revisions.map((revision, index) => (
            <div key={revision.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">
                {revisions.length - index}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 line-clamp-1">{revision.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                  <span className={`font-semibold capitalize ${revision.status === 'published' ? 'text-green-600' : 'text-slate-500'}`}>{revision.status}</span>
                  {revision.changed_by_email && <><span>·</span><span>{revision.changed_by_email}</span></>}
                  <span>·</span><span>{compactTimeAgo(revision.created_at)}</span>
                </div>
                {revision.subtitle && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{revision.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => onView(revision)}
                  className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded transition-colors">
                  View
                </button>
                {index > 0 && (
                  <button onClick={() => onRestore(revision)}
                    className="text-xs text-red-600 hover:text-red-800 border border-red-200 px-2 py-1 rounded transition-colors">
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
