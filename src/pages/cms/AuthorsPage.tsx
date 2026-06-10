import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, User, ExternalLink } from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { supabase } from '../../lib/supabase';
import { Author } from '../../types';

const EMPTY = { name: '', slug: '', bio: '', email: '', avatar_url: '' };

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Author | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('authors').select('*').order('name');
    setAuthors(data || []);
    setLoading(false);
  }

  function openCreate() {
    setForm({ ...EMPTY });
    setError('');
    setCreating(true);
    setEditing(null);
  }

  function openEdit(author: Author) {
    setForm({
      name: author.name, slug: author.slug,
      bio: author.bio || '', email: author.email || '', avatar_url: author.avatar_url || '',
    });
    setError('');
    setEditing(author);
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

    const payload = {
      name: form.name.trim(), slug: form.slug.trim(),
      bio: form.bio.trim() || null, email: form.email.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    };

    if (editing) {
      const { error: err } = await supabase.from('authors').update(payload).eq('id', editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
      setAuthors(prev => prev.map(a => a.id === editing.id ? { ...a, ...payload } : a));
    } else {
      const { data, error: err } = await supabase.from('authors').insert(payload).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setAuthors(prev => [...prev, data]);
    }

    setSaving(false);
    closeModal();
  }

  async function handleDelete(id: string) {
    await supabase.from('authors').delete().eq('id', id);
    setAuthors(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
  }

  const isOpen = creating || !!editing;

  return (
    <CMSLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Authors</h1>
          <p className="text-slate-500 text-sm mt-0.5">{authors.length} authors</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          <Plus size={16} />New author
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading…</div>
        ) : authors.length === 0 ? (
          <div className="p-12 text-center">
            <User size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-3">No authors yet</p>
            <button onClick={openCreate} className="text-red-700 text-sm font-medium hover:underline">Add your first author →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden xl:table-cell">Bio</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {authors.map(author => (
                <tr key={author.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {author.avatar_url ? (
                        <img src={author.avatar_url} alt={author.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500 text-xs font-bold">
                          {author.name[0]}
                        </div>
                      )}
                      <span className="font-medium text-slate-900">{author.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden md:table-cell">{author.slug}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{author.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 hidden xl:table-cell line-clamp-1 max-w-xs">{author.bio || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a href={`/author/${author.slug}`} target="_blank" rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"><ExternalLink size={15} /></a>
                      <button onClick={() => openEdit(author)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => setDeleteId(author.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={15} /></button>
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
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-lg mb-5">{editing ? 'Edit author' : 'New author'}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Full name</label>
                  <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Jane Smith"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Slug</label>
                  <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="jane-smith"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@example.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Avatar URL</label>
                <input type="url" value={form.avatar_url} onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))} placeholder="https://…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                {form.avatar_url && (
                  <img src={form.avatar_url} alt="Preview" className="mt-2 w-16 h-16 rounded-full object-cover border border-slate-200" />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Bio</label>
                <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Brief biography…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white font-semibold py-2 rounded-lg transition-colors text-sm disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create author'}
              </button>
              <button onClick={closeModal} className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 mb-2">Delete author?</h3>
            <p className="text-sm text-slate-500 mb-5">Their articles will remain. This cannot be undone.</p>
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
