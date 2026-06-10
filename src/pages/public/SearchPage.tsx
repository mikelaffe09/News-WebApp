import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, Filter, TrendingUp, Clock } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import ArticleCard from '../../components/ArticleCard';
import { supabase } from '../../lib/supabase';
import { Article, Category } from '../../types';

const ARTICLE_SELECT = `*, author:authors(*), category:categories(*)`;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'oldest' | 'popular'>('relevance');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data) setCategories(data);
    });
    // Load trending searches (top queries from last 7 days)
    supabase
      .from('search_queries')
      .select('query')
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) return;
        const counts: Record<string, number> = {};
        data.forEach(r => { counts[r.query] = (counts[r.query] || 0) + 1; });
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([q]) => q);
        setTrendingSearches(sorted);
      });
    // Load trending articles (highest view_count, published in last 30 days)
    supabase.from('articles').select(ARTICLE_SELECT)
      .eq('status', 'published')
      .gte('published_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('view_count', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setTrendingArticles(data); });
  }, []);

  useEffect(() => {
    setInputValue(query);
    if (query) performSearch(query, selectedCategory, sortBy);
    else setSearched(false);
  }, [searchParams]);

  async function performSearch(q: string, catId: string, sort: typeof sortBy) {
    if (!q.trim()) return;
    setLoading(true); setSearched(true);

    let req = supabase.from('articles').select(ARTICLE_SELECT).eq('status', 'published');

    // Full-text search via tsvector when query is long enough, ilike for short queries
    if (q.trim().length >= 3) {
      req = req.textSearch('search_vector', q.trim(), { type: 'websearch', config: 'english' });
    } else {
      req = req.or(`title.ilike.%${q}%,subtitle.ilike.%${q}%,excerpt.ilike.%${q}%`);
    }

    if (catId) req = req.eq('category_id', catId);

    if (sort === 'newest' || sort === 'relevance') req = req.order('published_at', { ascending: false });
    else if (sort === 'oldest') req = req.order('published_at', { ascending: true });
    else req = req.order('view_count', { ascending: false });

    req = req.limit(24);

    const { data } = await req;
    setArticles(data || []);
    setLoading(false);

    supabase.from('search_queries').insert({ query: q.trim(), results_count: data?.length || 0 });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setSelectedCategory('');
    setSortBy('relevance');
    setSearchParams({ q: inputValue.trim() });
  }

  function applyFilter(catId: string, sort: typeof sortBy) {
    if (query) performSearch(query, catId, sort);
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-4">Search</h1>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search articles, topics, authors…"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            />
            {inputValue && (
              <button type="button" onClick={() => setInputValue('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="bg-red-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors text-sm">
            Search
          </button>
        </form>

        {!searched && trendingSearches.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <TrendingUp size={13} /> Trending searches
            </p>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map(q => (
                <button
                  key={q}
                  onClick={() => { setInputValue(q); setSearchParams({ q }); }}
                  className="bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-sm px-3 py-1.5 rounded-full transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {searched && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); applyFilter(e.target.value, sortBy); }}
              className="text-sm border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value as typeof sortBy); applyFilter(selectedCategory, e.target.value as typeof sortBy); }}
              className="text-sm border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="relevance">Most relevant</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="popular">Most viewed</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 py-4">
                <div className="w-32 h-24 bg-slate-200 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : searched ? (
          <>
            <p className="text-sm text-slate-500 mb-4">
              {articles.length > 0
                ? `${articles.length} result${articles.length !== 1 ? 's' : ''} for "${query}"`
                : `No results found for "${query}"`}
            </p>
            {articles.length === 0 ? (
              <div className="text-center py-16">
                <Search size={40} className="mx-auto text-slate-200 mb-4" />
                <h3 className="font-serif text-xl font-bold text-slate-700 mb-2">No articles found</h3>
                <p className="text-slate-400 text-sm mb-4">Try different keywords or remove filters.</p>
                {trendingSearches.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Try one of these:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {trendingSearches.slice(0, 5).map(q => (
                        <button
                          key={q}
                          onClick={() => { setInputValue(q); setSearchParams({ q }); }}
                          className="bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-sm px-3 py-1.5 rounded-full transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(a => <ArticleCard key={a.id} article={a} variant="featured" />)}
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="text-center py-20">
                <Search size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400">Start typing to search for articles</p>
              </div>
            </div>
            {trendingArticles.length > 0 && (
              <aside>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <TrendingUp size={13} /> Trending Now
                </h3>
                <div className="space-y-4">
                  {trendingArticles.map((a, i) => (
                    <Link key={a.id} to={`/article/${a.slug}`} className="group flex gap-3 items-start">
                      <span className="font-serif text-2xl font-bold text-slate-200 flex-shrink-0 leading-none">{i + 1}</span>
                      <div>
                        {a.category && <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: a.category.color }}>{a.category.name}</span>}
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-red-700 transition-colors leading-snug line-clamp-2 mt-0.5">{a.title}</p>
                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Clock size={10} />{a.view_count.toLocaleString()} views
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
