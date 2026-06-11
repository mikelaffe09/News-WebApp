import { useParams } from 'react-router-dom';
import { Loader } from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { useAuth } from '../../contexts/AuthContext';
import ArticleEditorHeader from '../../features/articles/editor/components/ArticleEditorHeader';
import ArticleEditorTabs from '../../features/articles/editor/components/ArticleEditorTabs';
import ArticlePreview from '../../features/articles/editor/components/ArticlePreview';
import ArticleWriteForm from '../../features/articles/editor/components/ArticleWriteForm';
import RevisionHistoryPanel from '../../features/articles/editor/components/RevisionHistoryPanel';
import RevisionPreviewModal from '../../features/articles/editor/components/RevisionPreviewModal';
import ScheduledNotice from '../../features/articles/editor/components/ScheduledNotice';
import WorkflowPanel from '../../features/articles/editor/components/WorkflowPanel';
import { useArticleEditor } from '../../features/articles/editor/useArticleEditor';

export default function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const editor = useArticleEditor({ id, userEmail: user?.email ?? null });

  if (editor.loading) {
    return (
      <CMSLayout>
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader size={24} className="animate-spin" />
        </div>
      </CMSLayout>
    );
  }

  return (
    <CMSLayout>
      <ArticleEditorHeader
        autosaveStatus={editor.autosaveStatus}
        errorMsg={editor.errorMsg}
        form={editor.form}
        isNew={editor.isNew}
        onSave={transition => { void editor.handleSave(transition); }}
        saveStatus={editor.saveStatus}
        saving={editor.saving}
        scheduledAt={editor.scheduledAt}
        setScheduledAt={editor.setScheduledAt}
        setShowScheduler={editor.setShowScheduler}
        showScheduler={editor.showScheduler}
      />

      <ScheduledNotice form={editor.form} onClearSchedule={() => { void editor.clearSchedule(); }} />

      <ArticleEditorTabs
        activeTab={editor.activeTab}
        isNew={editor.isNew}
        onTabChange={editor.handleTabChange}
      />

      {editor.activeTab === 'preview' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 overflow-auto">
          <ArticlePreview authors={editor.authors} categories={editor.categories} form={editor.form} />
        </div>
      ) : editor.activeTab === 'revisions' ? (
        <RevisionHistoryPanel
          loading={editor.revisionsLoading}
          onRestore={editor.handleRestoreRevision}
          onView={editor.setViewingRevision}
          revisions={editor.revisions}
        />
      ) : editor.activeTab === 'workflow' ? (
        <WorkflowPanel
          currentStatus={editor.form.status}
          loading={editor.workflowLoading}
          newComment={editor.newComment}
          onAddComment={event => { void editor.handleAddComment(event); }}
          onSave={transition => { void editor.handleSave(transition); }}
          publishedAt={editor.form.published_at}
          saving={editor.saving}
          scheduledAt={editor.form.scheduled_at}
          setNewComment={editor.setNewComment}
          workflowComments={editor.workflowComments}
        />
      ) : (
        <ArticleWriteForm
          authors={editor.authors}
          categories={editor.categories}
          form={editor.form}
          onChange={editor.handleChange}
        />
      )}

      <RevisionPreviewModal
        onClose={() => editor.setViewingRevision(null)}
        onRestore={editor.handleRestoreRevision}
        revision={editor.viewingRevision}
      />
    </CMSLayout>
  );
}
