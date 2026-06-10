import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';

const COLORS = [
  '#ef4444','#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#8b5cf6','#ec4899','#64748b','#1e293b',
];

const EMPTY: Omit<Category, 'id' | 'created_at' | 'sort_order'> = {
  name: '', slug: '', description: null, color: '#ef4444',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('sort_order').order('name');
    setCategories(data || []);
    setLoading(false);
  }

  function openCreate() {
    setForm({ ...EMPTY });
    setError('');
    setCreating(true);
    setEditing(null);
  }

  function openEdit(cat: Category) {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description, color: cat.color });
    setError('');
    setEditing(cat);
    setCreating(false);
  }

  function closeModal() {
    setCreating(false);
    setEditing(null);
    setError('');
  }

  function deriveSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function handleNameChange(name: string) {
    setForm(prev => ({
      ...prev, name,
      slug: editing ? prev.slug : deriveSlug(name),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.slug.trim()) { setError('Slug is required'); return; }
    setSaving(true);
    setError('');

    if (editing) {
      const { error: err } = await supabase.from('categories').update({
        name: form.name.trim(), slug: form.slug.trim(),
        description: form.description || null, color: form.color,
      }).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
      setCategories(prev => prev.map(c => c.id === editing.id ? { ...c, ...form, name: form.name.trim(), slug: form.slug.trim() } : c));
    } else {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0;
      const { data, error: err } = await supabase.from('categories').insert({
        name: form.name.trim(), slug: form.slug.trim(),
        description: form.description || null, color: form.color, sort_order: maxOrder,
      }).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setCategories(prev => [...prev, data]);
    }

    setSaving(false);
    closeModal();
  }

  async function handleDelete(id: string) {
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeleteId(null);
  }

  const isOpen = creating || !!editing;

  return (
    <CMSLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-500 text-sm mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          <Plus size={16} />New category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <Tag size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-3">No categories yet</p>
            <button onClick={openCreate} className="text-red-700 text-sm font-medium hover:underline">Create your first category →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden lg:table-cell">Description</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium text-slate-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden md:table-cell">{cat.slug}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell line-clamp-1">{cat.description || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => setDeleteId(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-lg mb-5">{editing ? 'Edit category' : 'New category'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Name</label>
                <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. World News"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Slug</label>
                <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="e.g. world-news"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value || null }))} rows={2} placeholder="Optional description…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white font-semibold py-2 rounded-lg transition-colors text-sm disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
              </button>
              <button onClick={closeModal} className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 mb-2">Delete category?</h3>
            <p className="text-sm text-slate-500 mb-5">Articles in this category will become uncategorized. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors text-sm">Delete</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </CMSLayout>
  );
}
