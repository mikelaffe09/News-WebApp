import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Save, Eye, ArrowLeft, CheckCircle, AlertCircle, Loader,
  Clock, History, MessageSquare, Send, Calendar, X, ChevronDown,
  Lock, Zap, Image as ImageIcon,
} from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { supabase } from '../../lib/supabase';
import { Article, Category, Author, ArticleStatus, ArticleType, ArticleRevision, WorkflowComment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY: Omit<Article, 'id' | 'created_at' | 'updated_at' | 'view_count'> = {
  title: '', slug: '', subtitle: '', body: '', excerpt: '', status: 'draft', article_type: 'standard',
  author_id: null, category_id: null, hero_image_url: '', hero_image_caption: '',
  is_premium: false, is_breaking: false, published_at: null, scheduled_at: null,
  seo_title: '', seo_description: '',
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  const h = Math.floor(d / 3600000);
  const days = Math.floor(d / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${days}d ago`;
}

// Workflow state machine: what transitions are allowed
const ALLOWED_TRANSITIONS: Record<ArticleStatus, ArticleStatus[]> = {
  draft: ['in_review', 'published'],
  in_review: ['draft', 'approved', 'rejected' as any],
  approved: ['scheduled', 'published', 'draft'],
  scheduled: ['published', 'draft'],
  published: ['archived', 'draft'],
  archived: ['draft'],
  retracted: ['draft'],
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
  retracted: 'Retracted',
};

const ACTION_LABELS: Record<string, string> = {
  draft: 'Save as draft',
  in_review: 'Submit for review',
  approved: 'Mark approved',
  scheduled: 'Schedule',
  published: 'Publish now',
  archived: 'Archive',
};

const ACTION_COLORS: Record<string, string> = {
  in_review: 'bg-amber-600 hover:bg-amber-700',
  approved: 'bg-blue-600 hover:bg-blue-700',
  scheduled: 'bg-purple-600 hover:bg-purple-700',
  published: 'bg-green-700 hover:bg-green-800',
};

export default function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview' | 'revisions' | 'workflow'>('write');

  // Revisions
  const [revisions, setRevisions] = useState<ArticleRevision[]>([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [viewingRevision, setViewingRevision] = useState<ArticleRevision | null>(null);

  // Workflow
  const [workflowComments, setWorkflowComments] = useState<WorkflowComment[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  // Autosave
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('authors').select('*').order('name'),
    ]).then(([catRes, authRes]) => {
      setCategories(catRes.data || []);
      setAuthors(authRes.data || []);
    });

    if (!isNew && id) {
      supabase.from('articles').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) setForm({ ...EMPTY, ...data });
        setLoading(false);
      });
    }
  }, [id, isNew]);

  // Autosave on body change
  useEffect(() => {
    if (isNew || saving || !form.title) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => { autosave(); }, 3000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [form.body, form.title, form.subtitle]);

  async function autosave() {
    if (!id || isNew || !form.title) return;
    setAutosaveStatus('saving');
    await supabase.from('articles').update({ body: form.body, title: form.title, subtitle: form.subtitle, updated_at: new Date().toISOString() }).eq('id', id);
    setAutosaveStatus('saved');
    setTimeout(() => setAutosaveStatus('idle'), 2000);
  }

  function handleChange(field: keyof typeof EMPTY, value: unknown) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && isNew) next.slug = slugify(value as string);
      return next;
    });
    setSaveStatus('idle');
  }

  async function saveRevision(articleId: string) {
    await supabase.from('article_revisions').insert({
      article_id: articleId,
      title: form.title,
      subtitle: form.subtitle || null,
      body: form.body,
      status: form.status,
      changed_by_email: user?.email || null,
    });
  }

  async function addWorkflowComment(action: WorkflowComment['action'], comment = '') {
    if (!id || isNew) return;
    await supabase.from('workflow_comments').insert({
      article_id: id,
      author_email: user?.email || 'system',
      comment: comment || ACTION_LABELS[action] || action,
      action,
    });
    loadWorkflowComments();
  }

  async function handleSave(targetStatus?: ArticleStatus) {
    if (!form.title.trim()) { setErrorMsg('Title is required.'); setSaveStatus('error'); return; }
    if (!form.slug.trim()) { setErrorMsg('Slug is required.'); setSaveStatus('error'); return; }
    setSaving(true); setErrorMsg('');

    const newStatus = targetStatus || form.status;
    const payload: Partial<Article> = {
      ...form,
      status: newStatus,
      published_at: newStatus === 'published' && !form.published_at ? new Date().toISOString() : form.published_at,
      scheduled_at: newStatus === 'scheduled' ? (scheduledAt ? new Date(scheduledAt).toISOString() : form.scheduled_at) : form.scheduled_at,
      updated_at: new Date().toISOString(),
    };

    let error; let newId = id;

    if (isNew) {
      const res = await supabase.from('articles').insert(payload).select('id').single();
      error = res.error; newId = res.data?.id;
    } else {
      const res = await supabase.from('articles').update(payload).eq('id', id!);
      error = res.error;
    }

    if (error) {
      setErrorMsg(error.message.includes('duplicate') ? 'Slug is already in use.' : error.message);
      setSaveStatus('error');
    } else {
      setSaveStatus('saved');
      if (newId) {
        await saveRevision(newId);
        if (targetStatus) await addWorkflowComment(targetStatus === 'published' ? 'published' : targetStatus === 'in_review' ? 'submitted' : targetStatus as any);
      }
      setForm(prev => ({ ...prev, status: newStatus, published_at: payload.published_at || null }));
      if (isNew && newId) navigate(`/cms/articles/${newId}/edit`, { replace: true });
    }
    setSaving(false);
  }

  async function loadRevisions() {
    if (!id || isNew) return;
    setRevisionsLoading(true);
    const { data } = await supabase.from('article_revisions').select('*').eq('article_id', id).order('created_at', { ascending: false }).limit(20);
    setRevisions(data || []);
    setRevisionsLoading(false);
  }

  async function loadWorkflowComments() {
    if (!id || isNew) return;
    setWorkflowLoading(true);
    const { data } = await supabase.from('workflow_comments').select('*').eq('article_id', id).order('created_at', { ascending: true });
    setWorkflowComments(data || []);
    setWorkflowLoading(false);
  }

  function handleTabChange(tab: typeof activeTab) {
    setActiveTab(tab);
    if (tab === 'revisions' && revisions.length === 0) loadRevisions();
    if (tab === 'workflow' && workflowComments.length === 0) loadWorkflowComments();
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    await supabase.from('workflow_comments').insert({ article_id: id, author_email: user?.email || 'editor', comment: newComment.trim(), action: 'commented' });
    setNewComment('');
    loadWorkflowComments();
  }

  async function handleRestoreRevision(rev: ArticleRevision) {
    setForm(prev => ({ ...prev, title: rev.title, subtitle: rev.subtitle || '', body: rev.body }));
    setViewingRevision(null);
    setActiveTab('write');
    setSaveStatus('idle');
  }

  function renderPreview() {
    const paragraphs = form.body.split(/\n\n+/).filter(p => p.trim());
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {form.is_breaking && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">Breaking</span>}
          {form.article_type !== 'standard' && <span className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded uppercase">{form.article_type.replace('_', ' ')}</span>}
          {form.is_premium && <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1"><Lock size={10} />Premium</span>}
        </div>
        {form.hero_image_url && (
          <img src={form.hero_image_url} alt={form.title} className="w-full rounded-lg mb-5 object-cover max-h-72" />
        )}
        <h1 className="font-serif text-3xl font-bold text-slate-900 leading-tight mb-2">{form.title || 'Untitled'}</h1>
        {form.subtitle && <p className="font-serif text-lg text-slate-600 mb-4">{form.subtitle}</p>}
        <div className="flex items-center gap-3 text-xs text-slate-500 py-3 border-t border-b border-slate-200 mb-5">
          <span>{authors.find(a => a.id === form.author_id)?.name || 'Unknown author'}</span>
          <span>·</span>
          <span>{categories.find(c => c.id === form.category_id)?.name || 'Uncategorized'}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock size={10} />{form.published_at ? new Date(form.published_at).toLocaleDateString() : 'Draft'}</span>
        </div>
        <div className="font-serif text-lg text-slate-800 leading-relaxed">
          {paragraphs.map((p, i) => <p key={i} className="mb-5">{p}</p>)}
          {!paragraphs.length && <p className="text-slate-400 italic">No content yet…</p>}
        </div>
      </div>
    );
  }

  const allowedTransitions = ALLOWED_TRANSITIONS[form.status] || [];
  const primaryAction = allowedTransitions.find(s => ['in_review', 'published', 'approved'].includes(s));

  if (loading) {
    return <CMSLayout><div className="flex items-center justify-center py-20 text-slate-400"><Loader size={24} className="animate-spin" /></div></CMSLayout>;
  }

  return (
    <CMSLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/cms/articles" className="text-slate-400 hover:text-slate-700 transition-colors"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-bold text-slate-900">{isNew ? 'New article' : 'Edit article'}</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
            form.status === 'published' ? 'bg-green-100 text-green-700' :
            form.status === 'in_review' ? 'bg-amber-100 text-amber-700' :
            form.status === 'scheduled' ? 'bg-purple-100 text-purple-700' :
            form.status === 'approved' ? 'bg-blue-100 text-blue-700' :
            'bg-slate-100 text-slate-600'
          }`}>{STATUS_LABELS[form.status]}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Autosave indicator */}
          {autosaveStatus === 'saving' && <span className="text-xs text-slate-400 flex items-center gap-1"><Loader size={11} className="animate-spin" />Autosaving…</span>}
          {autosaveStatus === 'saved' && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={11} />Autosaved</span>}

          {saveStatus === 'saved' && <span className="flex items-center gap-1.5 text-green-600 text-sm"><CheckCircle size={14} />Saved</span>}
          {saveStatus === 'error' && <span className="flex items-center gap-1.5 text-red-600 text-sm"><AlertCircle size={14} />{errorMsg}</span>}

          {form.status === 'published' && form.slug && (
            <a href={`/article/${form.slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors">
              <Eye size={15} />View live
            </a>
          )}

          <button onClick={() => handleSave()} disabled={saving}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}Save
          </button>

          {/* Primary workflow action */}
          {primaryAction && primaryAction !== 'published' && (
            <button onClick={() => handleSave(primaryAction)} disabled={saving}
              className={`flex items-center gap-2 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${ACTION_COLORS[primaryAction] || 'bg-slate-600 hover:bg-slate-700'}`}>
              <Send size={14} />{ACTION_LABELS[primaryAction]}
            </button>
          )}

          {/* Publish / Schedule dropdown */}
          {(allowedTransitions.includes('published') || allowedTransitions.includes('scheduled')) && (
            <div className="relative">
              <button onClick={() => setShowScheduler(!showScheduler)} disabled={saving}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                {form.status === 'published' ? 'Update' : 'Publish'} <ChevronDown size={14} />
              </button>
              {showScheduler && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-20 w-72">
                  <button onClick={() => { setShowScheduler(false); handleSave('published'); }}
                    className="w-full flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors mb-3">
                    <Zap size={15} />Publish immediately
                  </button>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Schedule for later</p>
                    <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2" />
                    <button onClick={() => { if (!scheduledAt) return; setShowScheduler(false); handleSave('scheduled'); }}
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

      {/* Scheduled badge */}
      {form.status === 'scheduled' && form.scheduled_at && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2 text-sm text-purple-700">
          <Calendar size={15} />
          <span>Scheduled to publish on <strong>{new Date(form.scheduled_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</strong></span>
          <button onClick={() => { setForm(prev => ({ ...prev, status: 'draft', scheduled_at: null })); handleSave('draft'); }}
            className="ml-auto text-purple-500 hover:text-purple-800 transition-colors"><X size={15} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
        {(['write', 'preview', 'revisions', 'workflow'] as const).map(tab => (
          <button key={tab} onClick={() => handleTabChange(tab)}
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

      {activeTab === 'preview' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 overflow-auto">{renderPreview()}</div>
      ) : activeTab === 'revisions' ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Revision history</h2>
            <p className="text-xs text-slate-400 mt-0.5">Snapshots saved each time the article is saved.</p>
          </div>
          {revisionsLoading ? (
            <div className="p-8 text-center text-slate-400 animate-pulse">Loading revisions…</div>
          ) : revisions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No revisions saved yet. Save the article to create the first revision.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {revisions.map((rev, i) => (
                <div key={rev.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">
                    {revisions.length - i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">{rev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span className={`font-semibold capitalize ${rev.status === 'published' ? 'text-green-600' : 'text-slate-500'}`}>{rev.status}</span>
                      {rev.changed_by_email && <><span>·</span><span>{rev.changed_by_email}</span></>}
                      <span>·</span><span>{timeAgo(rev.created_at)}</span>
                    </div>
                    {rev.subtitle && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{rev.subtitle}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setViewingRevision(rev)}
                      className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded transition-colors">
                      View
                    </button>
                    {i > 0 && (
                      <button onClick={() => handleRestoreRevision(rev)}
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
      ) : activeTab === 'workflow' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Workflow activity</h2>
              </div>
              {workflowLoading ? (
                <div className="p-8 text-center text-slate-400 animate-pulse">Loading…</div>
              ) : workflowComments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No workflow activity yet.</div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                  {workflowComments.map(wc => (
                    <div key={wc.id} className="flex gap-3 px-5 py-3">
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                        {wc.author_email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-slate-700">{wc.author_email}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${
                            wc.action === 'published' ? 'bg-green-100 text-green-700' :
                            wc.action === 'approved' ? 'bg-blue-100 text-blue-700' :
                            wc.action === 'rejected' ? 'bg-red-100 text-red-700' :
                            wc.action === 'submitted' ? 'bg-amber-100 text-amber-700' :
                            wc.action === 'scheduled' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{wc.action}</span>
                          <span className="text-xs text-slate-400 ml-auto">{timeAgo(wc.created_at)}</span>
                        </div>
                        <p className="text-sm text-slate-700">{wc.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-5 py-4 border-t border-slate-100">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                    placeholder="Add a note for editors…"
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
                {allowedTransitions.map(s => (
                  <button key={s} onClick={() => handleSave(s)} disabled={saving}
                    className={`w-full flex items-center gap-2 justify-center text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${ACTION_COLORS[s] || 'bg-slate-600 hover:bg-slate-700'}`}>
                    {ACTION_LABELS[s] || STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current status</p>
                <p className="text-sm font-medium text-slate-800">{STATUS_LABELS[form.status]}</p>
                {form.published_at && <p className="text-xs text-slate-400 mt-1">Published {timeAgo(form.published_at)}</p>}
                {form.scheduled_at && <p className="text-xs text-purple-600 mt-1">Scheduled for {new Date(form.scheduled_at).toLocaleString()}</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Write tab
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Headline *</label>
                <input type="text" value={form.title} onChange={e => handleChange('title', e.target.value)}
                  placeholder="Enter article headline…"
                  className="w-full font-serif text-xl font-bold border-0 border-b border-slate-200 pb-2 focus:outline-none focus:border-red-500 placeholder-slate-300" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Subheadline / Dek</label>
                <input type="text" value={form.subtitle || ''} onChange={e => handleChange('subtitle', e.target.value)}
                  placeholder="A supporting sentence that adds context…"
                  className="w-full text-base border-0 border-b border-slate-100 pb-2 focus:outline-none focus:border-red-500 placeholder-slate-300 text-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Excerpt</label>
                <textarea value={form.excerpt || ''} onChange={e => handleChange('excerpt', e.target.value)}
                  placeholder="Short summary for article cards and search results…" rows={2}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-slate-700 placeholder-slate-300" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Article body</label>
                <span className="text-xs text-slate-400">{form.body.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              <textarea value={form.body} onChange={e => handleChange('body', e.target.value)}
                placeholder="Write your article here…&#10;&#10;Use double newlines to separate paragraphs." rows={22}
                className="w-full font-serif text-base leading-relaxed border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-y text-slate-800 placeholder-slate-300" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="font-semibold text-slate-800 text-sm">SEO & Metadata</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">URL slug *</label>
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-red-500">
                  <span className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-xs text-slate-400 whitespace-nowrap">/article/</span>
                  <input type="text" value={form.slug} onChange={e => handleChange('slug', slugify(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm focus:outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">SEO title <span className="normal-case font-normal">(defaults to headline)</span></label>
                <input type="text" value={form.seo_title || ''} onChange={e => handleChange('seo_title', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">SEO description</label>
                <textarea value={form.seo_description || ''} onChange={e => handleChange('seo_description', e.target.value)}
                  placeholder="150–160 characters" rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                <p className="text-xs text-slate-400 mt-1">{(form.seo_description || '').length} / 160 chars</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="font-semibold text-slate-800 text-sm">Publishing</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
                <select value={form.status} onChange={e => handleChange('status', e.target.value as ArticleStatus)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {(['draft','in_review','approved','scheduled','published','archived'] as ArticleStatus[]).map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Article type</label>
                <select value={form.article_type} onChange={e => handleChange('article_type', e.target.value as ArticleType)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  {(['standard','breaking','opinion','analysis','feature','interview','review','sponsored','video','photo_essay'] as ArticleType[]).map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_premium" checked={form.is_premium} onChange={e => handleChange('is_premium', e.target.checked)} className="w-4 h-4 accent-red-600" />
                <label htmlFor="is_premium" className="text-sm text-slate-700 flex items-center gap-1"><Lock size={12} />Premium (paywall)</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_breaking" checked={form.is_breaking} onChange={e => handleChange('is_breaking', e.target.checked)} className="w-4 h-4 accent-red-600" />
                <label htmlFor="is_breaking" className="text-sm text-slate-700 flex items-center gap-1"><Zap size={12} />Breaking news</label>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h3 className="font-semibold text-slate-800 text-sm">Classification</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Author</label>
                <select value={form.author_id || ''} onChange={e => handleChange('author_id', e.target.value || null)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Select author</option>
                  {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                <select value={form.category_id || ''} onChange={e => handleChange('category_id', e.target.value || null)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">Hero image</h3>
                <Link to="/cms/media" target="_blank" className="text-xs text-red-700 hover:underline flex items-center gap-1"><ImageIcon size={11} />Media library</Link>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Image URL</label>
                <input type="url" value={form.hero_image_url || ''} onChange={e => handleChange('hero_image_url', e.target.value)}
                  placeholder="https://images.pexels.com/…"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              {form.hero_image_url && (
                <img src={form.hero_image_url} alt="Preview" className="w-full rounded-lg object-cover h-32" />
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Caption / credit</label>
                <input type="text" value={form.hero_image_caption || ''} onChange={e => handleChange('hero_image_caption', e.target.value)}
                  placeholder="Photo credit or caption"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision viewer modal */}
      {viewingRevision && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900">Revision preview</h3>
                <p className="text-xs text-slate-400 mt-0.5">{new Date(viewingRevision.created_at).toLocaleString()} · {viewingRevision.changed_by_email}</p>
              </div>
              <button onClick={() => setViewingRevision(null)} className="text-slate-400 hover:text-slate-700 transition-colors"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">{viewingRevision.title}</h2>
              {viewingRevision.subtitle && <p className="font-serif text-lg text-slate-600 mb-4">{viewingRevision.subtitle}</p>}
              <div className="font-serif text-base text-slate-700 leading-relaxed">
                {viewingRevision.body.split(/\n\n+/).map((p, i) => <p key={i} className="mb-4">{p}</p>)}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button onClick={() => handleRestoreRevision(viewingRevision)}
                className="bg-red-700 hover:bg-red-800 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors">
                Restore this version
              </button>
              <button onClick={() => setViewingRevision(null)}
                className="border border-slate-300 text-slate-700 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </CMSLayout>
  );
}
