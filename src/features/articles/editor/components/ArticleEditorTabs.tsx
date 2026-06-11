import { Eye, History, MessageSquare } from 'lucide-react';
import { ArticleEditorTab } from '../useArticleEditor';

interface Props {
  activeTab: ArticleEditorTab;
  isNew: boolean;
  onTabChange: (tab: ArticleEditorTab) => void;
}

export default function ArticleEditorTabs({ activeTab, isNew, onTabChange }: Props) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
      {(['write', 'preview', 'revisions', 'workflow'] as const).map(tab => (
        <button key={tab} onClick={() => onTabChange(tab)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          {tab === 'revisions' && !isNew ? (
            <span className="flex items-center gap-1.5"><History size={12} />Revisions</span>
          ) : tab === 'workflow' && !isNew ? (
            <span className="flex items-center gap-1.5"><MessageSquare size={12} />Workflow</span>
          ) : tab === 'preview' ? (
            <span className="flex items-center gap-1.5"><Eye size={12} />Preview</span>
          ) : tab}
        </button>
      ))}
    </div>
  );
}
