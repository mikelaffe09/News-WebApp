import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, Lock, Share2, Bookmark, ArrowLeft, Eye, Tag as TagIcon } from 'lucide-react';
import PublicLayout from '../../components/layout/PublicLayout';
import ArticleCard from '../../features/articles/ArticleCard';
import NewsletterSignup from '../../components/NewsletterSignup';
import PaywallGate from '../../components/PaywallGate';
import { usePublicAuth } from '../../contexts/PublicAuthContext';
import { Article, Tag } from '../../types';
import { getArticleBySlug, getRelatedArticles, recordArticleView } from '../../features/articles/articleService';
import { formatLongDate } from '../../utils/date';
import { getErrorMessage } from '../../utils/errors';

function renderBody(body: string) {
  return body.split(/\n\n+/).filter(p => p.trim()).map((para, i) => (
    <p key={i} className="mb-5 leading-relaxed text-slate-800">{para.trim()}</p>
  ));
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const { session, savedIds, saveArticle, unsaveArticle } = usePublicAuth();
  const navigate = useNavigate();

  const bookmarked = article ? savedIds.has(article.id) : false;

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true); setNotFound(false); setError('');

    async function load() {
      try {
        const data = await getArticleBySlug(slug);

        if (!active) return;
        if (!data) { setNotFound(true); setLoading(false); return; }

        setArticle(data);

        const sid = sessionStorage.getItem('sid') || Math.random().toString(36).slice(2);
        sessionStorage.setItem('sid', sid);
        void recordArticleView(data, sid);

        const relatedArticles = await getRelatedArticles(data);
        if (active) setRelated(relatedArticles);
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [slug]);

  async function handleBookmark() {
    if (!session) {
      navigate('/account/login', { state: { from: `/article/${slug}` } });
      return;
    }
    if (!article) return;
    if (bookmarked) {
      await unsaveArticle(article.id);
    } else {
      await saveArticle(article.id);
    }
  }

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-5 bg-slate-200 rounded w-1/2" />
          <div className="aspect-video bg-slate-200 rounded-lg" />
          {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-slate-200 rounded" />)}
        </div>
      </PublicLayout>
    );
  }

  if (notFound || !article) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="font-serif text-3xl font-bold text-slate-900 mb-3">{error ? 'Unable to load article' : 'Article not found'}</h1>
          {error && <p className="text-sm text-slate-500 mb-4">{error}</p>}
          <Link to="/" className="bg-red-700 text-white px-5 py-2.5 rounded hover:bg-red-800 transition-colors text-sm font-semibold">Return to homepage</Link>
        </div>
      </PublicLayout>
    );
  }

  const showPaywall = article.is_premium;
  const bodyPreview = article.body.slice(0, 800);
  const articleTags = (article.article_tags || [])
    .map(articleTag => articleTag.tags)
    .filter((tag): tag is Tag => Boolean(tag));

  return (
    <PublicLayout>
      <article className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 mb-4 text-sm">
              <Link to="/" className="text-slate-500 hover:text-red-700 flex items-center gap-1 transition-colors"><ArrowLeft size={14} />Home</Link>
              {article.category && (
                <><span className="text-slate-300">/</span>
                  <Link to={`/category/${article.category.slug}`} className="hover:text-red-700 transition-colors" style={{ color: article.category.color }}>{article.category.name}</Link></>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3">
              {article.is_breaking && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Breaking News</span>}
              {article.article_type !== 'standard' && (
                <span className="bg-slate-800 text-white text-xs font-semibold px-2 py-0.5 rounded uppercase capitalize">{article.article_type.replace('_', ' ')}</span>
              )}
              {article.is_premium && (
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1"><Lock size={10} /> Premium</span>
              )}
            </div>

            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-3">{article.title}</h1>
            {article.subtitle && <p className="font-serif text-lg md:text-xl text-slate-600 mb-5 leading-relaxed">{article.subtitle}</p>}

            <div className="flex items-center justify-between py-3 border-t border-b border-slate-200 mb-6">
              <div className="flex items-center gap-3">
                {article.author?.avatar_url && (
                  <img src={article.author.avatar_url} alt={article.author.name} className="w-9 h-9 rounded-full object-cover" />
                )}
                <div>
                  {article.author && (
                    <Link to={`/author/${article.author.slug}`} className="text-sm font-semibold text-slate-900 hover:text-red-700 transition-colors">
                      By {article.author.name}
                    </Link>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={11} />{article.published_at ? formatLongDate(article.published_at) : 'Unpublished'}</span>
                    <span className="flex items-center gap-1"><Eye size={11} />{article.view_count.toLocaleString()} views</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBookmark}
                  title={bookmarked ? 'Remove bookmark' : session ? 'Save article' : 'Sign in to save'}
                  className={`p-2 rounded-full transition-all duration-150 ${bookmarked ? 'bg-red-700 text-white scale-110' : 'text-slate-500 hover:bg-slate-100 hover:text-red-700'}`}
                >
                  <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => navigator.share?.({ title: article.title, url: window.location.href })}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {article.hero_image_url && (
              <figure className="mb-6">
                <img src={article.hero_image_url} alt={article.title} className="w-full rounded-lg object-cover max-h-[500px]" />
                {article.hero_image_caption && <figcaption className="text-xs text-slate-500 mt-2 italic">{article.hero_image_caption}</figcaption>}
              </figure>
            )}

            <div className="font-serif text-lg max-w-2xl">
              {showPaywall ? (
                <>{renderBody(bodyPreview)}<PaywallGate isLoggedIn={!!session} /></>
              ) : renderBody(article.body)}
            </div>

            {articleTags.length > 0 && (
              <div className="mt-8 pt-4 border-t border-slate-200 flex items-center gap-2 flex-wrap">
                <TagIcon size={14} className="text-slate-400 flex-shrink-0" />
                {articleTags.map(tag => (
                  <Link
                    key={tag.id}
                    to={`/search?q=${encodeURIComponent(tag.name)}`}
                    className="inline-block bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
                {article.category && (
                  <Link
                    to={`/category/${article.category.slug}`}
                    className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: article.category.color + '18', color: article.category.color }}
                  >
                    {article.category.name}
                  </Link>
                )}
              </div>
            )}

            {article.author?.bio && (
              <div className="mt-8 p-5 bg-slate-50 rounded-lg border border-slate-200 flex gap-4">
                {article.author.avatar_url && (
                  <img src={article.author.avatar_url} alt={article.author.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
                )}
                <div>
                  <Link to={`/author/${article.author.slug}`} className="font-semibold text-slate-900 text-sm hover:text-red-700 transition-colors">
                    About {article.author.name}
                  </Link>
                  <p className="text-sm text-slate-600 mt-1">{article.author.bio}</p>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {!session && (
                <div className="bg-red-700 text-white rounded-xl p-5 text-center">
                  <Bookmark size={20} className="mx-auto mb-2 text-red-200" />
                  <p className="font-semibold text-sm mb-1">Save articles for later</p>
                  <p className="text-xs text-red-200 mb-3">Create a free account to bookmark articles and access them anywhere.</p>
                  <Link to="/account/login" className="block w-full bg-white text-red-700 text-xs font-bold py-2 rounded-lg hover:bg-red-50 transition-colors">
                    Sign up free
                  </Link>
                </div>
              )}
              <NewsletterSignup variant="inline" />
              {related.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-200 pb-2 mb-4">Related</h3>
                  <div className="space-y-4">
                    {related.slice(0, 3).map(a => <ArticleCard key={a.id} article={a} variant="compact" showImage={false} />)}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <div className="bg-stone-100 border-t border-slate-200 py-10 mt-10">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="font-serif text-xl font-bold text-slate-900 mb-6">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(a => <ArticleCard key={a.id} article={a} variant="featured" />)}
            </div>
          </div>
        </div>
      )}

      <NewsletterSignup />
    </PublicLayout>
  );
}
