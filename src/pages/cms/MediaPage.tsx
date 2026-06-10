import { useEffect, useState } from 'react';
import { Plus, Copy, Check, Trash2, Image, Search, ExternalLink } from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { supabase } from '../../lib/supabase';
import { MediaAsset } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_FORM = { url: '', filename: '', alt_text: '', caption: '', credit: '' };

export default function MediaPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
    setAssets(data || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.url.trim()) { setError('URL is required'); return; }
    setSaving(true);
    setError('');
    const { data, error: err } = await supabase.from('media_assets').insert({
      url: form.url.trim(),
      filename: form.filename.trim() || null,
      alt_text: form.alt_text.trim() || null,
      caption: form.caption.trim() || null,
      credit: form.credit.trim() || null,
      uploaded_by_email: user?.email || null,
    }).select().single();
    if (err) { setError(err.message); setSaving(false); return; }
    setAssets(prev => [data, ...prev]);
    setSaving(false);
    setAdding(false);
    setForm({ ...EMPTY_FORM });
  }

  async function handleDelete(id: string) {
    await supabase.from('media_assets').delete().eq('id', id);
    setAssets(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
    if (selectedAsset?.id === id) setSelectedAsset(null);
  }

  function copyUrl(asset: MediaAsset) {
    navigator.clipboard.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = assets.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (a.filename || '').toLowerCase().includes(q) ||
      (a.alt_text || '').toLowerCase().includes(q) ||
      (a.caption || '').toLowerCase().includes(q) ||
      a.url.toLowerCase().includes(q);
  });

  return (
    <CMSLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
          <p className="text-slate-500 text-sm mt-0.5">{assets.length} assets</p>
        </div>
        <button onClick={() => { setAdding(true); setForm({ ...EMPTY_FORM }); setError(''); }}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          <Plus size={16} />Add asset
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search assets…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => <div key={i} className="aspect-video bg-slate-200 rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <Image size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 mb-3">{searchQuery ? 'No assets match your search' : 'No media assets yet'}</p>
          {!searchQuery && <button onClick={() => setAdding(true)} className="text-red-700 text-sm font-medium hover:underline">Add your first asset →</button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(asset => (
            <div key={asset.id} onClick={() => setSelectedAsset(asset)}
              className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-red-500 transition-all">
              <img src={asset.url} alt={asset.alt_text || asset.filename || 'Asset'}
                className="w-full h-full object-cover" loading="lazy"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button onClick={e => { e.stopPropagation(); copyUrl(asset); }}
                  className="bg-white rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1">
                  {copiedId === asset.id ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  {copiedId === asset.id ? 'Copied' : 'Copy URL'}
                </button>
              </div>
              {asset.filename && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs line-clamp-1">{asset.filename}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Asset detail panel */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden">
            <div className="aspect-video bg-slate-100 relative">
              <img src={selectedAsset.url} alt={selectedAsset.alt_text || ''} className="w-full h-full object-contain" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{selectedAsset.filename || 'Untitled'}</p>
                  {selectedAsset.credit && <p className="text-xs text-slate-500 mt-0.5">Credit: {selectedAsset.credit}</p>}
                </div>
                <div className="flex gap-2">
                  <a href={selectedAsset.url} target="_blank" rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
                    <ExternalLink size={16} />
                  </a>
                  <button onClick={() => copyUrl(selectedAsset)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors">
                    {copiedId === selectedAsset.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                  <button onClick={() => setDeleteId(selectedAsset.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {selectedAsset.alt_text && <p className="text-sm text-slate-600 mb-1"><span className="font-medium">Alt:</span> {selectedAsset.alt_text}</p>}
              {selectedAsset.caption && <p className="text-sm text-slate-600 mb-3"><span className="font-medium">Caption:</span> {selectedAsset.caption}</p>}
              <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2 mt-3">
                <input readOnly value={selectedAsset.url} className="flex-1 text-xs text-slate-600 bg-transparent outline-none font-mono min-w-0 truncate" />
                <button onClick={() => copyUrl(selectedAsset)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 flex-shrink-0">
                  {copiedId === selectedAsset.id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  {copiedId === selectedAsset.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <button onClick={() => setSelectedAsset(null)}
                className="mt-4 w-full border border-slate-300 text-slate-700 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add asset modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-lg mb-5">Add media asset</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Image URL *</label>
                <input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://images.pexels.com/…"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                {form.url && (
                  <img src={form.url} alt="Preview" className="mt-2 w-full aspect-video object-cover rounded-lg bg-slate-100"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Filename</label>
                  <input type="text" value={form.filename} onChange={e => setForm(p => ({ ...p, filename: e.target.value }))} placeholder="photo.jpg"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Credit</label>
                  <input type="text" value={form.credit} onChange={e => setForm(p => ({ ...p, credit: e.target.value }))} placeholder="Pexels / John Doe"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Alt text</label>
                <input type="text" value={form.alt_text} onChange={e => setForm(p => ({ ...p, alt_text: e.target.value }))} placeholder="Describe the image for screen readers"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Caption</label>
                <input type="text" value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} placeholder="Optional caption displayed below the image"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 bg-red-700 hover:bg-red-800 text-white font-semibold py-2 rounded-lg transition-colors text-sm disabled:opacity-50">
                {saving ? 'Adding…' : 'Add to library'}
              </button>
              <button onClick={() => setAdding(false)} className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 mb-2">Delete asset?</h3>
            <p className="text-sm text-slate-500 mb-5">This will remove it from the library. Articles using this URL will not be affected.</p>
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
