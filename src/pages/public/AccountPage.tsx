import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, User, LogOut, Settings, ChevronRight, Clock, Lock, Trash2 } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import { usePublicAuth } from '../../contexts/PublicAuthContext';
import { Article } from '../../types';
import { getPublishedArticlesByIds } from '../../features/articles/articleService';
import { timeAgo } from '../../utils/date';

export default function AccountPage() {
  const { session, user, profile, savedIds, unsaveArticle, updateProfile, signOut } = usePublicAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'saved' | 'profile'>('saved');
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!session) { navigate('/account/login', { state: { from: '/account' }, replace: true }); }
  }, [session, navigate]);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
  }, [profile]);

  useEffect(() => {
    if (!session || savedIds.size === 0) { setLoadingSaved(false); setSavedArticles([]); return; }
    setLoadingSaved(true);
    const ids = [...savedIds];
    getPublishedArticlesByIds(ids)
      .then(setSavedArticles)
      .finally(() => setLoadingSaved(false));
  }, [session, savedIds]);

  async function handleRemove(articleId: string) {
    await unsaveArticle(articleId);
    setSavedArticles(prev => prev.filter(a => a.id !== articleId));
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    const { error } = await updateProfile({ display_name: displayName.trim() || null });
    setSaving(false);
    setSaveMsg(error ? error : 'Saved!');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (!session) return null;

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-slate-900">My Account</h1>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-700 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:border-red-300"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-8">
          <button
            onClick={() => setTab('saved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === 'saved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Bookmark size={15} />
            Saved
            {savedIds.size > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                {savedIds.size}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${tab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Settings size={15} /> Profile
          </button>
        </div>

        {tab === 'saved' && (
          <div>
            {loadingSaved ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 bg-white rounded-xl p-4 border border-slate-100">
                    <div className="w-28 h-20 bg-slate-200 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : savedArticles.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bookmark size={24} className="text-slate-400" />
                </div>
                <h3 className="font-serif text-xl font-bold text-slate-700 mb-2">No saved articles yet</h3>
                <p className="text-slate-400 text-sm mb-6">Bookmark articles to read them later.</p>
                <Link to="/" className="bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-800 transition-colors">
                  Browse articles
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedArticles.map(article => (
                  <div key={article.id} className="group bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all p-4 flex gap-4 items-start">
                    {article.hero_image_url && (
                      <Link to={`/article/${article.slug}`} className="flex-shrink-0">
                        <img
                          src={article.hero_image_url}
                          alt={article.title}
                          className="w-28 h-20 object-cover rounded-lg group-hover:opacity-95 transition-opacity"
                        />
                      </Link>
                    )}
                    <div className="flex-1 min-w-0">
                      {article.category && (
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: article.category.color }}>
                          {article.category.name}
                        </span>
                      )}
                      <Link to={`/article/${article.slug}`}>
                        <h3 className="font-serif font-bold text-slate-900 leading-snug hover:text-red-700 transition-colors line-clamp-2 mt-0.5">
                          {article.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        {article.author && <span>By {article.author.name}</span>}
                        {article.published_at && <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(article.published_at)}</span>}
                        {article.is_premium && <span className="flex items-center gap-1 text-amber-600"><Lock size={10} /> Premium</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/article/${article.slug}`}
                        className="text-slate-400 hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      >
                        <ChevronRight size={16} />
                      </Link>
                      <button
                        onClick={() => handleRemove(article.id)}
                        className="text-slate-300 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Remove bookmark"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="max-w-md">
            <div className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <User size={22} className="text-red-700" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{profile?.display_name || 'Reader'}</p>
                  <p className="text-sm text-slate-400">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>

                {saveMsg && (
                  <p className={`text-sm font-medium ${saveMsg === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>
                    {saveMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-1">Saved articles: {savedIds.size}</p>
              <p className="text-amber-700 text-xs">Bookmarks are synced to your account and available on any device.</p>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
