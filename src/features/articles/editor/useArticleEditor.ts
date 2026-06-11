import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleRevision, Author, Category, WorkflowComment } from '../../../types';
import { getAuthors } from '../../authors/authorService';
import { getCategories } from '../../categories/categoryService';
import {
  autosaveArticle,
  createArticle,
  createArticleRevision,
  createWorkflowComment,
  getArticleById,
  getArticleRevisions,
  getWorkflowComments,
  updateArticle,
} from '../articleService';
import { ArticleFormState, EMPTY_ARTICLE_FORM } from '../articleTypes';
import { formatCmsError, getErrorMessage } from '../../../utils/errors';
import { slugify } from '../../../utils/slug';
import {
  getTargetStatus,
  getWorkflowAction,
  WorkflowTransitionId,
  WORKFLOW_ACTION_LABELS,
} from './articleEditorWorkflow';
import { buildArticleMutation, clearScheduledMutation, toArticleForm } from './articleEditorUtils';

export type ArticleEditorTab = 'write' | 'preview' | 'revisions' | 'workflow';
export type SaveStatus = 'idle' | 'saved' | 'error';
export type AutosaveStatus = 'idle' | 'saving' | 'saved';

interface UseArticleEditorArgs {
  id?: string;
  userEmail: string | null;
}

export function useArticleEditor({ id, userEmail }: UseArticleEditorArgs) {
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<ArticleFormState>({ ...EMPTY_ARTICLE_FORM });
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<ArticleEditorTab>('write');
  const [revisions, setRevisions] = useState<ArticleRevision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [viewingRevision, setViewingRevision] = useState<ArticleRevision | null>(null);
  const [workflowComments, setWorkflowComments] = useState<WorkflowComment[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');

  useEffect(() => {
    let active = true;

    Promise.all([
      getCategories({ orderBy: 'name' }),
      getAuthors(),
      !isNew && id ? getArticleById(id) : Promise.resolve(null),
    ]).then(([categoryData, authorData, articleData]) => {
      if (!active) return;
      setCategories(categoryData);
      setAuthors(authorData);
      if (articleData) setForm(toArticleForm(articleData));
      setLoading(false);
    }).catch(error => {
      if (!active) return;
      setErrorMsg(getErrorMessage(error));
      setSaveStatus('error');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [id, isNew]);

  const autosave = useCallback(async () => {
    if (!id || isNew || !form.title) return;
    setAutosaveStatus('saving');
    try {
      await autosaveArticle(id, {
        body: form.body,
        title: form.title,
        subtitle: form.subtitle,
      });
      setAutosaveStatus('saved');
      window.setTimeout(() => setAutosaveStatus('idle'), 2000);
    } catch {
      setAutosaveStatus('idle');
    }
  }, [form.body, form.subtitle, form.title, id, isNew]);

  useEffect(() => {
    if (isNew || saving || !form.title) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => { void autosave(); }, 3000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [autosave, form.title, isNew, saving]);

  function handleChange(field: keyof ArticleFormState, value: ArticleFormState[keyof ArticleFormState]) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && isNew) next.slug = slugify(String(value));
      return next;
    });
    setSaveStatus('idle');
  }

  async function saveRevision(articleId: string, status = form.status) {
    await createArticleRevision({
      article_id: articleId,
      title: form.title,
      subtitle: form.subtitle || null,
      body: form.body,
      status,
      changed_by_email: userEmail,
    });
  }

  async function addWorkflowComment(articleId: string, transition: WorkflowTransitionId, comment = '') {
    await createWorkflowComment({
      article_id: articleId,
      author_email: userEmail || 'system',
      comment: comment || WORKFLOW_ACTION_LABELS[transition] || transition,
      action: getWorkflowAction(transition),
    });
    await loadWorkflowComments();
  }

  async function handleSave(transition?: WorkflowTransitionId) {
    if (!form.title.trim()) { setErrorMsg('Title is required.'); setSaveStatus('error'); return; }
    if (!form.slug.trim()) { setErrorMsg('Slug is required.'); setSaveStatus('error'); return; }

    setSaving(true);
    setErrorMsg('');

    const newStatus = transition ? getTargetStatus(transition) : form.status;
    const payload = buildArticleMutation(form, newStatus, scheduledAt);
    let newId = id;

    try {
      if (isNew) {
        newId = await createArticle(payload);
      } else if (id) {
        await updateArticle(id, payload);
      }

      if (newId) {
        await saveRevision(newId, newStatus);
        if (transition) await addWorkflowComment(newId, transition);
      }

      setForm(prev => ({
        ...prev,
        status: newStatus,
        published_at: payload.published_at ?? null,
        scheduled_at: payload.scheduled_at ?? null,
      }));
      setSaveStatus('saved');

      if (isNew && newId) navigate(`/cms/articles/${newId}/edit`, { replace: true });
    } catch (error) {
      setErrorMsg(formatCmsError(error));
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function clearSchedule() {
    if (!id || isNew) return;
    const payload = clearScheduledMutation(form);
    setForm(prev => ({ ...prev, status: 'draft', scheduled_at: null }));
    await updateArticle(id, payload);
  }

  async function loadRevisions() {
    if (!id || isNew) return;
    setRevisionsLoading(true);
    try {
      setRevisions(await getArticleRevisions(id));
    } finally {
      setRevisionsLoading(false);
    }
  }

  async function loadWorkflowComments() {
    if (!id || isNew) return;
    setWorkflowLoading(true);
    try {
      setWorkflowComments(await getWorkflowComments(id));
    } finally {
      setWorkflowLoading(false);
    }
  }

  function handleTabChange(tab: ArticleEditorTab) {
    setActiveTab(tab);
    if (tab === 'revisions' && revisions.length === 0) void loadRevisions();
    if (tab === 'workflow' && workflowComments.length === 0) void loadWorkflowComments();
  }

  async function handleAddComment(event: FormEvent) {
    event.preventDefault();
    if (!newComment.trim() || !id) return;
    await createWorkflowComment({
      article_id: id,
      author_email: userEmail || 'editor',
      comment: newComment.trim(),
      action: 'commented',
    });
    setNewComment('');
    await loadWorkflowComments();
  }

  function handleRestoreRevision(revision: ArticleRevision) {
    setForm(prev => ({
      ...prev,
      title: revision.title,
      subtitle: revision.subtitle || '',
      body: revision.body,
    }));
    setViewingRevision(null);
    setActiveTab('write');
    setSaveStatus('idle');
  }

  return {
    activeTab,
    autosaveStatus,
    authors,
    categories,
    clearSchedule,
    errorMsg,
    form,
    handleAddComment,
    handleChange,
    handleRestoreRevision,
    handleSave,
    handleTabChange,
    isNew,
    loading,
    newComment,
    revisions,
    revisionsLoading,
    saveStatus,
    saving,
    scheduledAt,
    setNewComment,
    setScheduledAt,
    setShowScheduler,
    setViewingRevision,
    showScheduler,
    viewingRevision,
    workflowComments,
    workflowLoading,
  };
}
