import { X } from 'lucide-react';
import { ArticleRevision } from '../../../../types';

interface Props {
  onClose: () => void;
  onRestore: (revision: ArticleRevision) => void;
  revision: ArticleRevision | null;
}

export default function RevisionPreviewModal({ onClose, onRestore, revision }: Props) {
  if (!revision) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900">Revision preview</h3>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(revision.created_at).toLocaleString()} · {revision.changed_by_email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">
          <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">{revision.title}</h2>
          {revision.subtitle && <p className="font-serif text-lg text-slate-600 mb-4">{revision.subtitle}</p>}
          <div className="font-serif text-base text-slate-700 leading-relaxed">
            {revision.body.split(/\n\n+/).map((paragraph, index) => <p key={index} className="mb-4">{paragraph}</p>)}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button onClick={() => onRestore(revision)}
            className="bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
            Restore this version
          </button>
          <button onClick={onClose}
            className="border border-slate-300 text-slate-700 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
