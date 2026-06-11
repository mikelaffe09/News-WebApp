import { Clock, Lock } from 'lucide-react';
import { Author, Category } from '../../../../types';
import { ArticleFormState } from '../../articleTypes';
import { splitParagraphs } from '../articleEditorUtils';

interface Props {
  authors: Author[];
  categories: Category[];
  form: ArticleFormState;
}

export default function ArticlePreview({ authors, categories, form }: Props) {
  const paragraphs = splitParagraphs(form.body);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {form.is_breaking && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">Breaking</span>}
        {form.article_type !== 'standard' && <span className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded uppercase">{form.article_type.replace('_', ' ')}</span>}
        {form.is_premium && <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1"><Lock size={10} />Premium</span>}
      </div>
      {form.hero_image_url && (
        <img src={form.hero_image_url} alt={form.title} className="w-full rounded-lg mb-5 object-cover max-h-72" />
      )}
      <h1 className="font-serif text-3xl font-bold text-slate-900 leading-tight mb-2">{form.title || 'Untitled'}</h1>
      {form.subtitle && <p className="font-serif text-lg text-slate-600 mb-4">{form.subtitle}</p>}
      <div className="flex items-center gap-3 text-xs text-slate-500 py-3 border-t border-b border-slate-200 mb-5">
        <span>{authors.find(author => author.id === form.author_id)?.name || 'Unknown author'}</span>
        <span>·</span>
        <span>{categories.find(category => category.id === form.category_id)?.name || 'Uncategorized'}</span>
        <span>·</span>
        <span className="flex items-center gap-1"><Clock size={10} />{form.published_at ? new Date(form.published_at).toLocaleDateString() : 'Draft'}</span>
      </div>
      <div className="font-serif text-lg text-slate-800 leading-relaxed">
        {paragraphs.map((paragraph, index) => <p key={index} className="mb-5">{paragraph}</p>)}
        {!paragraphs.length && <p className="text-slate-400 italic">No content yet...</p>}
      </div>
    </div>
  );
}
