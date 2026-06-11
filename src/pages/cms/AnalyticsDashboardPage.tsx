import { useEffect, useState } from 'react';
import { Eye, TrendingUp, Users, Mail, Search, CreditCard, ArrowUp } from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { Link } from 'react-router-dom';
import { AnalyticsDashboardData, getAnalyticsDashboardData } from '../../features/analytics/analyticsService';

const EMPTY_ANALYTICS: AnalyticsDashboardData = {
  totalViews: 0,
  totalArticles: 0,
  subscribers: 0,
  newsletters: 0,
  paywallImpressions: 0,
  subscriptions: 0,
  topArticles: [],
  topCategories: [],
  topAuthors: [],
  searchTerms: [],
  dailyStats: [],
};

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsDashboardData>(EMPTY_ANALYTICS);

  useEffect(() => {
    async function load() {
      try {
        setAnalytics(await getAnalyticsDashboardData());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const conversionRate = analytics.paywallImpressions > 0
    ? ((analytics.subscriptions / analytics.paywallImpressions) * 100).toFixed(1)
    : '0.0';

  const maxDailyViews = Math.max(...analytics.dailyStats.map(d => d.views), 1);

  const statCards = [
    { label: 'Total views', value: analytics.totalViews.toLocaleString(), icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Published articles', value: analytics.totalArticles.toLocaleString(), icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-50' },
    { label: 'Paid subscribers', value: analytics.subscribers.toLocaleString(), icon: CreditCard, color: 'text-red-700', bg: 'bg-red-50' },
    { label: 'Newsletter subs', value: analytics.newsletters.toLocaleString(), icon: Mail, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Paywall hits', value: analytics.paywallImpressions.toLocaleString(), icon: Users, color: 'text-slate-700', bg: 'bg-slate-50' },
    { label: 'Conversion rate', value: `${conversionRate}%`, icon: ArrowUp, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  return (
    <CMSLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-0.5">Overview of content performance and audience</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${loading ? 'text-slate-200' : 'text-slate-900'}`}>{loading ? '—' : s.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daily view chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Page views — last 14 days</h2>
        {loading ? (
          <div className="h-40 bg-slate-100 rounded animate-pulse" />
        ) : (
          <div className="flex items-end gap-1 h-40">
            {analytics.dailyStats.map(d => {
              const heightPct = maxDailyViews > 0 ? (d.views / maxDailyViews) * 100 : 0;
              const label = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex items-end justify-center" style={{ height: '120px' }}>
                    <div className="w-full bg-red-600 rounded-t transition-all group-hover:bg-red-700"
                      style={{ height: `${Math.max(heightPct, d.views > 0 ? 4 : 0)}%` }} />
                    {d.views > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {d.views}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 text-center leading-tight" style={{ fontSize: '10px' }}>{label}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top articles */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Top articles by views</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-2 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded" />)}</div>
          ) : analytics.topArticles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No published articles yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {analytics.topArticles.map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-slate-300 font-bold text-sm w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link to={`/cms/articles/${a.id}/edit`}
                      className="text-sm font-medium text-slate-800 hover:text-red-700 transition-colors line-clamp-1">{a.title}</Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {a.published_at ? new Date(a.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-700 flex-shrink-0">
                    <Eye size={13} className="text-slate-400" />{a.view_count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top categories */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Top categories</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-2 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded" />)}</div>
          ) : analytics.topCategories.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No category data yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {analytics.topCategories.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-slate-300 font-bold text-sm w-5 text-right flex-shrink-0">{i + 1}</span>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#94a3b8' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{cat.name}</p>
                    <p className="text-xs text-slate-400">{cat.article_count} articles</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-700 flex-shrink-0">
                    <Eye size={13} className="text-slate-400" />{cat.total_views.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top authors */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Top authors</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-2 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded" />)}</div>
          ) : analytics.topAuthors.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No author data yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {analytics.topAuthors.map((author, i) => (
                <div key={author.slug} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-slate-300 font-bold text-sm w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <a href={`/author/${author.slug}`} target="_blank" rel="noreferrer"
                      className="text-sm font-medium text-slate-800 hover:text-red-700 transition-colors">{author.name}</a>
                    <p className="text-xs text-slate-400">{author.article_count} articles</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-700 flex-shrink-0">
                    <Eye size={13} className="text-slate-400" />{author.total_views.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search terms */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Top search terms</h2>
          </div>
          {loading ? (
            <div className="p-4 space-y-2 animate-pulse">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-slate-100 rounded" />)}</div>
          ) : analytics.searchTerms.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Search size={24} className="mx-auto mb-2 text-slate-300" />
              No search data yet
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {analytics.searchTerms.map((term, i) => (
                <div key={term.query} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-slate-300 font-bold text-sm w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link to={`/search?q=${encodeURIComponent(term.query)}`} target="_blank"
                      className="text-sm font-medium text-slate-800 hover:text-red-700 transition-colors font-mono">"{term.query}"</Link>
                    <p className="text-xs text-slate-400">
                      Last: {new Date(term.last_searched).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 flex-shrink-0">{term.count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CMSLayout>
  );
}
