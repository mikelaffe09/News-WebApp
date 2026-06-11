import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicLayout from '../../components/layout/PublicLayout';
import ArticleCard from '../../features/articles/ArticleCard';
import NewsletterSignup from '../../components/NewsletterSignup';
import { Article, Category } from '../../types';
import { getPublishedArticlesByCategory } from '../../features/articles/articleService';
import { getCategoryBySlug } from '../../features/categories/categoryService';
import { getErrorMessage } from '../../utils/errors';

const PAGE_SIZE = 12;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true); setNotFound(false); setPage(0); setArticles([]); setError('');

    getCategoryBySlug(slug)
      .then(data => {
        if (!active) return;
        if (!data) { setNotFound(true); setLoading(false); return; }
        setCategory(data);
        void loadArticles(data.id, 0);
      })
      .catch(err => {
        if (active) {
          setError(getErrorMessage(err));
          setLoading(false);
        }
      });

    return () => { active = false; };
  }, [slug]);

  async function loadArticles(categoryId: string, pageNum: number) {
    setLoading(true);
    setError('');
    try {
      const result = await getPublishedArticlesByCategory(categoryId, pageNum, PAGE_SIZE);
      if (pageNum === 0) setArticles(result.articles);
      else setArticles(prev => [...prev, ...result.articles]);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (notFound || error) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-3xl font-bold text-slate-900 mb-3">{error ? 'Unable to load category' : 'Category not found'}</h1>
          {error && <p className="text-sm text-slate-500 mb-4">{error}</p>}
          <Link to="/" className="text-red-700 hover:underline text-sm font-medium">Return to homepage</Link>
        </div>
      </PublicLayout>
    );
  }

  const hero = articles[0];
  const rest = articles.slice(1);

  return (
    <PublicLayout>
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {category && (
            <>
              <div className="w-10 h-1 rounded mb-3" style={{ backgroundColor: category.color }} />
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900">{category.name}</h1>
              {category.description && <p className="text-slate-500 mt-2 text-sm md:text-base max-w-2xl">{category.description}</p>}
              <p className="text-xs text-slate-400 mt-2">{total} articles</p>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading && articles.length === 0 ? (
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="space-y-3"><div className="aspect-video bg-slate-200 rounded-lg" /><div className="h-4 bg-slate-200 rounded w-3/4" /></div>)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20"><p className="text-slate-500">No articles published in this category yet.</p></div>
        ) : (
          <>
            {hero && <div className="mb-8"><ArticleCard article={hero} variant="hero" /></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {rest.map(a => <ArticleCard key={a.id} article={a} variant="featured" />)}
            </div>
            {articles.length < total && (
              <div className="text-center">
                <button onClick={() => { const next = page + 1; setPage(next); loadArticles(category!.id, next); }}
                  disabled={loading}
                  className="bg-slate-900 text-white px-8 py-3 rounded hover:bg-red-700 transition-colors font-semibold text-sm disabled:opacity-50">
                  {loading ? 'Loading…' : 'Load more articles'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <NewsletterSignup />
    </PublicLayout>
  );
}
