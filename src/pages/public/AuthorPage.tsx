import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Mail, FileText, TrendingUp } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import ArticleCard from '../../components/ArticleCard';
import NewsletterSignup from '../../components/NewsletterSignup';
import { supabase } from '../../lib/supabase';
import { Author, Article } from '../../types';

const ARTICLE_SELECT = `*, author:authors(*), category:categories(*)`;

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [author, setAuthor] = useState<Author | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    supabase.from('authors').select('*').eq('slug', slug).maybeSingle().then(({ data }) => {
      if (!data) { setNotFound(true); setLoading(false); return; }
      setAuthor(data);
      loadArticles(data.id, 0);
    });
  }, [slug]);

  async function loadArticles(authorId: string, pageNum: number) {
    setLoading(true);
    const from = pageNum * PAGE_SIZE;
    const { data, count } = await supabase.from('articles')
      .select(ARTICLE_SELECT, { count: 'exact' })
      .eq('status', 'published')
      .eq('author_id', authorId)
      .order('published_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const items = data || [];
    if (pageNum === 0) {
      setArticles(items);
      setTotalViews(items.reduce((s, a) => s + a.view_count, 0));
    } else {
      setArticles(prev => [...prev, ...items]);
    }
    setTotal(count || 0);
    setLoading(false);
  }

  if (notFound || (!loading && !author)) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-3xl font-bold text-slate-900 mb-3">Author not found</h1>
          <Link to="/" className="text-red-700 hover:underline text-sm font-medium">Return to homepage</Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Author header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          {loading && !author ? (
            <div className="animate-pulse flex gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-3 pt-2">
                <div className="h-7 bg-slate-200 rounded w-48" />
                <div className="h-4 bg-slate-200 rounded w-80" />
                <div className="h-4 bg-slate-200 rounded w-64" />
              </div>
            </div>
          ) : author ? (
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt={author.name}
                  className="w-24 h-24 rounded-full object-cover flex-shrink-0 ring-4 ring-slate-100" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-500 text-3xl font-bold">
                  {author.name[0]}
                </div>
              )}
              <div className="flex-1">
                <h1 className="font-serif text-3xl font-bold text-slate-900 mb-1">{author.name}</h1>
                {author.bio && <p className="text-slate-600 leading-relaxed mb-4 max-w-2xl">{author.bio}</p>}
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <FileText size={15} />{total} articles
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp size={15} />{totalViews.toLocaleString()} total views
                  </span>
                  {author.email && (
                    <a href={`mailto:${author.email}`} className="flex items-center gap-1.5 text-red-700 hover:text-red-800 transition-colors">
                      <Mail size={15} />{author.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-serif text-xl font-bold text-slate-900">Articles</h2>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        {loading && articles.length === 0 ? (
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 py-4">
                <div className="w-32 h-24 bg-slate-200 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-5 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-200 rounded w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500">No published articles yet.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {articles.map(a => <ArticleCard key={a.id} article={a} variant="list" />)}
            </div>
            {articles.length < total && (
              <div className="text-center mt-8">
                <button
                  onClick={() => { const next = page + 1; setPage(next); loadArticles(author!.id, next); }}
                  disabled={loading}
                  className="bg-slate-900 text-white px-8 py-3 rounded hover:bg-red-700 transition-colors font-semibold text-sm disabled:opacity-50">
                  {loading ? 'Loading…' : 'Load more'}
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
