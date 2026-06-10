import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Zap, Flame, Clock } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import ArticleCard from '../../components/ArticleCard';
import NewsletterSignup from '../../components/NewsletterSignup';
import { supabase } from '../../lib/supabase';
import { Article, Category } from '../../types';

const ARTICLE_SELECT = `*, author:authors(*), category:categories(*)`;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HomePage() {
  const [breaking, setBreaking] = useState<Article[]>([]);
  const [hero, setHero] = useState<Article | null>(null);
  const [featured, setFeatured] = useState<Article[]>([]);
  const [latest, setLatest] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryArticles, setCategoryArticles] = useState<Record<string, Article[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [publishedRes, catRes, trendingRes] = await Promise.all([
        supabase.from('articles').select(ARTICLE_SELECT).eq('status', 'published').order('published_at', { ascending: false }).limit(20),
        supabase.from('categories').select('*').order('sort_order').limit(6),
        supabase.from('articles').select(ARTICLE_SELECT)
          .eq('status', 'published')
          .gte('published_at', new Date(Date.now() - 7 * 86400000).toISOString())
          .order('view_count', { ascending: false })
          .limit(8),
      ]);

      const articles: Article[] = publishedRes.data || [];
      const cats: Category[] = catRes.data || [];
      const trendingData: Article[] = trendingRes.data || [];

      const breakingArticles = articles.filter(a => a.is_breaking);
      setBreaking(breakingArticles);
      const nonBreaking = articles.filter(a => !a.is_breaking);
      setHero(nonBreaking[0] || articles[0] || null);
      setFeatured(articles.slice(1, 5));
      setLatest(articles.slice(0, 10));
      setTrending(trendingData);
      setCategories(cats);

      const catMap: Record<string, Article[]> = {};
      await Promise.all(cats.slice(0, 4).map(async cat => {
        const { data } = await supabase.from('articles').select(ARTICLE_SELECT)
          .eq('status', 'published').eq('category_id', cat.id)
          .order('published_at', { ascending: false }).limit(4);
        catMap[cat.slug] = data || [];
      }));
      setCategoryArticles(catMap);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PublicLayout>
      {breaking.length > 0 && (
        <div className="bg-red-700 text-white py-2">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 overflow-hidden">
            <span className="flex items-center gap-1.5 bg-white text-red-700 text-xs font-bold px-2 py-0.5 rounded flex-shrink-0">
              <Zap size={11} fill="currentColor" />BREAKING
            </span>
            <div className="flex gap-6 overflow-x-auto scrollbar-hide whitespace-nowrap text-sm font-medium">
              {breaking.slice(0, 3).map(a => (
                <Link key={a.id} to={`/article/${a.slug}`} className="hover:underline flex-shrink-0">{a.title}</Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-200 rounded-lg aspect-video" />
              <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-200 rounded" />)}</div>
            </div>
          </div>
        ) : (
          <>
            {hero && (
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-2"><ArticleCard article={hero} variant="hero" /></div>
                <div className="flex flex-col gap-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2">Top Stories</h2>
                  {featured.map(a => <ArticleCard key={a.id} article={a} variant="compact" />)}
                </div>
              </section>
            )}

            {/* Trending section */}
            {trending.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <Flame size={16} className="text-orange-500 flex-shrink-0" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Trending This Week</h2>
                  <div className="flex-1 border-t border-slate-200" />
                  <Link to="/search" className="text-xs text-slate-400 hover:text-red-700 transition-colors font-medium">See all →</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* First trending article = large */}
                  {trending[0] && (
                    <div className="lg:col-span-2">
                      <ArticleCard article={trending[0]} variant="featured" />
                    </div>
                  )}
                  {/* Numbered list for the rest */}
                  <div className="lg:col-span-2 space-y-3">
                    {trending.slice(1, 5).map((a, i) => (
                      <Link key={a.id} to={`/article/${a.slug}`} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200">
                        <span className="font-serif text-2xl font-bold text-slate-200 flex-shrink-0 leading-none w-6 text-center">{i + 2}</span>
                        <div className="flex-1 min-w-0">
                          {a.category && <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: a.category.color }}>{a.category.name}</span>}
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-red-700 transition-colors leading-snug line-clamp-2 mt-0.5">{a.title}</p>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Clock size={10} />{a.published_at ? timeAgo(a.published_at) : ''}
                            <span className="mx-1">·</span>{a.view_count.toLocaleString()} views
                          </span>
                        </div>
                        {a.hero_image_url && (
                          <img src={a.hero_image_url} alt={a.title} className="w-16 h-12 object-cover rounded flex-shrink-0 group-hover:opacity-90 transition-opacity hidden sm:block" />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <div className="flex items-center gap-4 mb-8">
              <TrendingUp size={16} className="text-red-700 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Latest News</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {latest.slice(0, 6).map(a => <ArticleCard key={a.id} article={a} variant="featured" />)}
                </div>
              </div>
              <aside>
                <div className="sticky top-24 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mb-3">Most Read</h3>
                    <div className="space-y-4">
                      {[...latest].sort((a, b) => b.view_count - a.view_count).slice(0, 5).map((a, i) => (
                        <Link key={a.id} to={`/article/${a.slug}`} className="group flex gap-3 items-start">
                          <span className="font-serif text-2xl font-bold text-slate-200 flex-shrink-0 leading-none">{i + 1}</span>
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-red-700 transition-colors leading-snug line-clamp-3">{a.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <NewsletterSignup variant="inline" />
                </div>
              </aside>
            </div>

            {categories.map(cat => {
              const arts = categoryArticles[cat.slug];
              if (!arts || arts.length === 0) return null;
              return (
                <section key={cat.id} className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-serif text-xl font-bold" style={{ color: cat.color }}>{cat.name}</h2>
                    <div className="flex-1 border-t border-slate-200" />
                    <Link to={`/category/${cat.slug}`} className="text-xs text-slate-500 hover:text-red-700 transition-colors font-medium">See all →</Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {arts.map(a => <ArticleCard key={a.id} article={a} variant="featured" />)}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>

      <NewsletterSignup />
    </PublicLayout>
  );
}
