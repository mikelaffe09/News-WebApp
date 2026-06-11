import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, ArrowRight, Eye, Plus, BarChart2 } from 'lucide-react';
import CMSLayout from '../../components/layout/CMSLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Article } from '../../types';
import { getCmsDashboardData, CmsDashboardStats } from '../../features/cms/dashboardService';
import { STATUS_COLORS } from '../../features/articles/articleConstants';

export default function CMSDashboardPage() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<CmsDashboardStats>({ published: 0, drafts: 0, inReview: 0, subscribers: 0, newsletters: 0, scheduled: 0 });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCmsDashboardData();
        setStats(data.stats);
        setRecentArticles(data.recentArticles);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

  return (
    <CMSLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{greeting()}, {profile?.display_name || user?.email?.split('@')[0] || 'Editor'}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Published', value: stats.published, color: 'text-green-700', href: '/cms/articles?status=published' },
          { label: 'In Review', value: stats.inReview, color: 'text-amber-700', href: '/cms/articles?status=in_review' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-purple-700', href: '/cms/articles?status=scheduled' },
          { label: 'Drafts', value: stats.drafts, color: 'text-slate-700', href: '/cms/articles?status=draft' },
          { label: 'Subscribers', value: stats.subscribers, color: 'text-blue-700', href: '/cms/analytics' },
          { label: 'Newsletter', value: stats.newsletters, color: 'text-red-700', href: '/cms/analytics' },
        ].map(s => (
          <Link key={s.label} to={s.href} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${loading ? 'text-slate-200' : s.color}`}>{loading ? '—' : s.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'New article', icon: Plus, href: '/cms/articles/new', primary: true },
          { label: 'Articles', icon: FileText, href: '/cms/articles', primary: false },
          { label: 'Analytics', icon: BarChart2, href: '/cms/analytics', primary: false },
          { label: 'Homepage', icon: Users, href: '/cms/homepage', primary: false },
        ].map(action => (
          <Link key={action.label} to={action.href}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-colors
              ${action.primary ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <action.icon size={16} />{action.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent articles</h2>
          <Link to="/cms/articles" className="text-xs text-slate-500 hover:text-red-700 flex items-center gap-1 transition-colors">View all <ArrowRight size={12} /></Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded" />)}</div>
        ) : recentArticles.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No articles yet. <Link to="/cms/articles/new" className="text-red-700 hover:underline">Create your first →</Link></div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentArticles.map(article => (
              <div key={article.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <Link to={`/cms/articles/${article.id}/edit`} className="text-sm font-medium text-slate-800 hover:text-red-700 transition-colors line-clamp-1">{article.title}</Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    {article.category?.name && <span className="text-xs text-slate-400">{article.category.name}</span>}
                    {article.author?.name && <span className="text-xs text-slate-400">· {article.author.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {article.status === 'published' && <span className="flex items-center gap-1 text-xs text-slate-400"><Eye size={12} />{article.view_count.toLocaleString()}</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[article.status] || 'bg-slate-100 text-slate-600'}`}>{article.status.replace('_', ' ')}</span>
                  <Link to={`/cms/articles/${article.id}/edit`} className="text-slate-400 hover:text-slate-700 transition-colors"><ArrowRight size={14} /></Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CMSLayout>
  );
}
