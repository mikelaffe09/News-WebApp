import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { Article, Category, ArticleStatus } from '../../types';
import { getCategories } from '../../features/categories/categoryService';
import { deleteArticle, getCmsArticles, updateArticle } from '../../features/articles/articleService';
import { ARTICLE_TYPE_LABELS, CMS_STATUS_FILTERS, STATUS_COLORS } from '../../features/articles/articleConstants';
import { ArticleMutation } from '../../features/articles/articleTypes';
import { getErrorMessage } from '../../utils/errors';

export default function ArticlesListPage() {
  const [searchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ArticleStatus | ''>(searchParams.get('status') as ArticleStatus || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories({ orderBy: 'name' }).then(setCategories).catch(() => setCategories([]));
    void loadArticles();
  }, []);

  async function loadArticles() {
    setLoading(true);
    setError('');
    try {
      setArticles(await getCmsArticles());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteArticle(id);
    setArticles(prev => prev.filter(a => a.id !== id));
    setDeleteId(null);
  }

  async function handleTogglePublish(article: Article) {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    const updates: ArticleMutation = {
      status: newStatus,
      published_at: newStatus === 'published' ? new Date().toISOString() : article.published_at,
      updated_at: new Date().toISOString(),
    };
    await updateArticle(article.id, updates);
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, ...updates } : a));
  }

  const filtered = articles.filter(a => {
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchCat = !filterCategory || a.category_id === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <CMSLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Articles</h1>
          <p className="text-slate-500 text-sm mt-0.5">{articles.length} total</p>
        </div>
        <Link to="/cms/articles/new" className="flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors">
          <Plus size={16} />New article
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 overflow-x-auto scrollbar-hide">
        <button onClick={() => setFilterStatus('')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${filterStatus === '' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          All ({articles.length})
        </button>
        {CMS_STATUS_FILTERS.map(s => {
          const count = articles.filter(a => a.status === s).length;
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all capitalize ${filterStatus === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              {s.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search articles…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-700">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse">Loading articles…</div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-3">No articles found</p>
            <Link to="/cms/articles/new" className="text-red-700 text-sm font-medium hover:underline">Create your first article →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden md:table-cell">Author</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden lg:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide hidden xl:table-cell">Views</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(article => (
                  <tr key={article.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900 line-clamp-1">{article.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{ARTICLE_TYPE_LABELS[article.article_type]}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{article.author?.name || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {article.category?.name ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{article.category.name}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[article.status]}`}>{article.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden xl:table-cell">{article.view_count.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {article.status === 'published' && (
                          <a href={`/article/${article.slug}`} target="_blank" rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"><Eye size={15} /></a>
                        )}
                        <Link to={`/cms/articles/${article.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"><Edit size={15} /></Link>
                        <button onClick={() => setDeleteId(article.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={15} /></button>
                        <button onClick={() => handleTogglePublish(article)}
                          className={`text-xs px-2 py-1 rounded font-medium transition-colors ml-1 ${article.status === 'published' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                          {article.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 mb-2">Delete article?</h3>
            <p className="text-sm text-slate-500 mb-5">This cannot be undone.</p>
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
