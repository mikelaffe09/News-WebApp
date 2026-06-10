import { useEffect, useState } from 'react';
import {
  ChevronUp, ChevronDown, Eye, EyeOff, Settings,
  Link as LinkIcon, Tag, Layout, Save,
} from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { supabase } from '../../lib/supabase';
import { HomepageModule, Article, Category } from '../../types';

const MODULE_LABELS: Record<string, string> = {
  hero: 'Hero',
  featured_grid: 'Featured Grid',
  breaking: 'Breaking News Ticker',
  category_spotlight: 'Category Spotlight',
  opinion: 'Opinion Section',
  newsletter: 'Newsletter Signup',
  trending: 'Trending / Most Read',
};

const MODULE_ICONS: Record<string, string> = {
  hero: '🗞️',
  featured_grid: '⊞',
  breaking: '⚡',
  category_spotlight: '📂',
  opinion: '💬',
  newsletter: '✉️',
  trending: '📈',
};

const MODULE_SELECT = `*, article:articles(id,title,slug), category:categories(id,name,slug)`;

export default function HomepageCurationPage() {
  const [modules, setModules] = useState<HomepageModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('homepage_modules').select(MODULE_SELECT).order('position'),
      supabase.from('articles').select('id,title,slug').eq('status', 'published').order('published_at', { ascending: false }).limit(50),
      supabase.from('categories').select('*').order('name'),
    ]).then(([modRes, artRes, catRes]) => {
      setModules(modRes.data || []);
      setArticles(artRes.data as Article[] || []);
      setCategories(catRes.data || []);
      setLoading(false);
    });
  }, []);

  async function toggleActive(mod: HomepageModule) {
    setSaving(mod.id);
    const newActive = !mod.is_active;
    await supabase.from('homepage_modules').update({ is_active: newActive }).eq('id', mod.id);
    setModules(prev => prev.map(m => m.id === mod.id ? { ...m, is_active: newActive } : m));
    setSaving(null);
  }

  async function moveModule(mod: HomepageModule, direction: 'up' | 'down') {
    const sorted = [...modules].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(m => m.id === mod.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swap = sorted[swapIdx];
    const updates = [
      { id: mod.id, position: swap.position },
      { id: swap.id, position: mod.position },
    ];

    await Promise.all(updates.map(u => supabase.from('homepage_modules').update({ position: u.position }).eq('id', u.id)));
    setModules(prev => prev.map(m => {
      const u = updates.find(x => x.id === m.id);
      return u ? { ...m, position: u.position } : m;
    }));
  }

  async function updateModuleField(id: string, field: string, value: string | null) {
    const update: Record<string, unknown> = { [field]: value || null };
    if (field === 'article_id') update.article = articles.find(a => a.id === value) || null;
    if (field === 'category_id') update.category = categories.find(c => c.id === value) || null;
    await supabase.from('homepage_modules').update({ [field]: value || null }).eq('id', id);
    setModules(prev => prev.map(m => m.id === id ? { ...m, ...update } : m));
    setSaving(null);
  }

  async function updateTitle(id: string, title: string) {
    await supabase.from('homepage_modules').update({ title: title || null }).eq('id', id);
    setModules(prev => prev.map(m => m.id === id ? { ...m, title: title || null } : m));
  }

  const sorted = [...modules].sort((a, b) => a.position - b.position);
  const activeCount = modules.filter(m => m.is_active).length;

  return (
    <CMSLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homepage Curation</h1>
          <p className="text-slate-500 text-sm mt-0.5">{activeCount} active modules</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer"
          className="flex items-center gap-2 border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          <LinkIcon size={15} />Preview homepage
        </a>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((mod, idx) => (
            <div key={mod.id}
              className={`bg-white rounded-xl border-2 transition-all ${mod.is_active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Reorder controls */}
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveModule(mod, 'up')} disabled={idx === 0}
                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => moveModule(mod, 'down')} disabled={idx === sorted.length - 1}
                    className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors">
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Position badge */}
                <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>

                {/* Module icon + name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{MODULE_ICONS[mod.module_type] || '📄'}</span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{MODULE_LABELS[mod.module_type] || mod.module_type}</p>
                      <p className="text-xs text-slate-400">
                        {mod.module_type === 'hero' || mod.module_type === 'opinion' ? (
                          (mod.article as any)?.title ? `Article: ${(mod.article as any).title}` : 'No article selected'
                        ) : mod.module_type === 'category_spotlight' ? (
                          (mod.category as any)?.name ? `Category: ${(mod.category as any).name}` : 'No category selected'
                        ) : mod.title || 'No custom title'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setEditingId(editingId === mod.id ? null : mod.id)}
                    className={`p-1.5 rounded transition-colors ${editingId === mod.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
                    <Settings size={15} />
                  </button>
                  <button onClick={() => toggleActive(mod)} disabled={saving === mod.id}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      mod.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    {mod.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                    {mod.is_active ? 'Active' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Edit panel */}
              {editingId === mod.id && (
                <div className="border-t border-slate-100 px-4 py-4 bg-slate-50 rounded-b-xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Custom title */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                        <Layout size={12} className="inline mr-1" />Section title
                      </label>
                      <div className="flex gap-2">
                        <input type="text" defaultValue={mod.title || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setModules(prev => prev.map(m => m.id === mod.id ? { ...m, title: val || null } : m));
                          }}
                          placeholder="Override display title…"
                          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
                        <button onClick={() => updateTitle(mod.id, mod.title || '')}
                          className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors">
                          <Save size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Article picker */}
                    {(mod.module_type === 'hero' || mod.module_type === 'opinion' || mod.module_type === 'featured_grid') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                          <LinkIcon size={12} className="inline mr-1" />Featured article
                        </label>
                        <select
                          value={mod.article_id || ''}
                          onChange={e => updateModuleField(mod.id, 'article_id', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                          <option value="">No article</option>
                          {articles.map(a => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Category picker */}
                    {mod.module_type === 'category_spotlight' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                          <Tag size={12} className="inline mr-1" />Spotlight category
                        </label>
                        <select
                          value={mod.category_id || ''}
                          onChange={e => updateModuleField(mod.id, 'category_id', e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                          <option value="">No category</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Tip:</strong> Drag modules up/down to reorder. Toggle visibility without deleting. Changes save automatically.
      </div>
    </CMSLayout>
  );
}
