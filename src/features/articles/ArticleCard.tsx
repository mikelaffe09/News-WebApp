import { Link } from 'react-router-dom';
import { Clock, Lock } from 'lucide-react';
import { Article } from '../../types';
import { timeAgo } from '../../utils/date';

interface ArticleCardProps {
  article: Article;
  variant?: 'hero' | 'featured' | 'compact' | 'list';
  showImage?: boolean;
}

export default function ArticleCard({ article, variant = 'featured', showImage = true }: ArticleCardProps) {
  const categoryColor = article.category?.color || '#1e40af';
  const date = article.published_at || article.created_at;

  if (variant === 'hero') {
    return (
      <Link to={`/article/${article.slug}`} className="group block relative overflow-hidden rounded-lg">
        {article.hero_image_url && (
          <div className="aspect-[16/9] overflow-hidden">
            <img src={article.hero_image_url} alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            {article.is_breaking && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Breaking</span>}
            {article.category && <span className="text-xs font-semibold uppercase tracking-wide text-white/80">{article.category.name}</span>}
          </div>
          <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight group-hover:underline">{article.title}</h2>
          {article.subtitle && <p className="mt-1.5 text-sm text-white/75 line-clamp-2 hidden md:block">{article.subtitle}</p>}
          <div className="flex items-center gap-3 mt-3">
            {article.author && <span className="text-xs text-white/70">By {article.author.name}</span>}
            <span className="text-xs text-white/50 flex items-center gap-1"><Clock size={11} />{timeAgo(date)}</span>
            {article.is_premium && <Lock size={12} className="text-amber-400" />}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/article/${article.slug}`} className="group flex gap-3 items-start">
        {showImage && article.hero_image_url && (
          <img src={article.hero_image_url} alt={article.title}
            className="w-20 h-16 object-cover rounded flex-shrink-0 group-hover:opacity-90 transition-opacity" loading="lazy" />
        )}
        <div className="flex-1 min-w-0">
          {article.category && <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: categoryColor }}>{article.category.name}</span>}
          <h3 className="font-serif text-sm font-bold text-slate-900 leading-snug group-hover:text-red-700 transition-colors line-clamp-3 mt-0.5">{article.title}</h3>
          <span className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <Clock size={10} />{timeAgo(date)}
            {article.is_premium && <Lock size={10} className="text-amber-500 ml-1" />}
          </span>
        </div>
      </Link>
    );
  }

  if (variant === 'list') {
    return (
      <Link to={`/article/${article.slug}`} className="group flex gap-4 py-4 border-b border-slate-200 last:border-0">
        {showImage && article.hero_image_url && (
          <img src={article.hero_image_url} alt={article.title}
            className="w-32 h-24 object-cover rounded flex-shrink-0 group-hover:opacity-90 transition-opacity" loading="lazy" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {article.is_breaking && <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded uppercase">Breaking</span>}
            {article.category && <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: categoryColor }}>{article.category.name}</span>}
          </div>
          <h3 className="font-serif text-base md:text-lg font-bold text-slate-900 leading-snug group-hover:text-red-700 transition-colors line-clamp-2">{article.title}</h3>
          {article.excerpt && <p className="text-sm text-slate-500 line-clamp-2 mt-1 hidden md:block">{article.excerpt}</p>}
          <div className="flex items-center gap-3 mt-1.5">
            {article.author && <span className="text-xs text-slate-500">By {article.author.name}</span>}
            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{timeAgo(date)}</span>
            {article.is_premium && <Lock size={11} className="text-amber-500" />}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/article/${article.slug}`} className="group block">
      {showImage && article.hero_image_url && (
        <div className="aspect-[16/9] overflow-hidden rounded-lg mb-3">
          <img src={article.hero_image_url} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          {article.is_breaking && <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded uppercase">Breaking</span>}
          {article.category && <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: categoryColor }}>{article.category.name}</span>}
        </div>
        <h3 className="font-serif text-lg font-bold text-slate-900 leading-snug group-hover:text-red-700 transition-colors line-clamp-3">{article.title}</h3>
        {article.excerpt && <p className="text-sm text-slate-500 line-clamp-2 mt-1.5">{article.excerpt}</p>}
        <div className="flex items-center gap-3 mt-2">
          {article.author && <span className="text-xs text-slate-500">By {article.author.name}</span>}
          <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{timeAgo(date)}</span>
          {article.is_premium && <Lock size={11} className="text-amber-500" />}
        </div>
      </div>
    </Link>
  );
}
