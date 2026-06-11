import { Link } from 'react-router-dom';
import { Image as ImageIcon, Lock, Zap } from 'lucide-react';
import { ArticleStatus, ArticleType, Author, Category } from '../../../../types';
import { ARTICLE_TYPES, CMS_STATUS_FILTERS } from '../../articleConstants';
import { ArticleFormState } from '../../articleTypes';
import { countWords } from '../articleEditorUtils';
import { slugify } from '../../../../utils/slug';

interface Props {
  authors: Author[];
  categories: Category[];
  form: ArticleFormState;
  onChange: (field: keyof ArticleFormState, value: ArticleFormState[keyof ArticleFormState]) => void;
}

export default function ArticleWriteForm({ authors, categories, form, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
      <div className="xl:col-span-3 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Headline *</label>
            <input type="text" value={form.title} onChange={e => onChange('title', e.target.value)}
              placeholder="Enter article headline..."
              className="w-full font-serif text-xl font-bold border-0 border-b border-slate-200 pb-2 focus:outline-none focus:border-red-500 placeholder-slate-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Subheadline / Dek</label>
            <input type="text" value={form.subtitle || ''} onChange={e => onChange('subtitle', e.target.value)}
              placeholder="A supporting sentence that adds context..."
              className="w-full text-base border-0 border-b border-slate-100 pb-2 focus:outline-none focus:border-red-500 placeholder-slate-300 text-slate-600" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Excerpt</label>
            <textarea value={form.excerpt || ''} onChange={e => onChange('excerpt', e.target.value)}
              placeholder="Short summary for article cards and search results..." rows={2}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-slate-700 placeholder-slate-300" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Article body</label>
            <span className="text-xs text-slate-400">{countWords(form.body)} words</span>
          </div>
          <textarea value={form.body} onChange={e => onChange('body', e.target.value)}
            placeholder="Write your article here...&#10;&#10;Use double newlines to separate paragraphs." rows={22}
            className="w-full font-serif text-base leading-relaxed border border-slate-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 resize-y text-slate-800 placeholder-slate-300" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm">SEO & Metadata</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">URL slug *</label>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-red-500">
              <span className="bg-slate-50 border-r border-slate-200 px-3 py-2 text-xs text-slate-400 whitespace-nowrap">/article/</span>
              <input type="text" value={form.slug} onChange={e => onChange('slug', slugify(e.target.value))}
                className="flex-1 px-3 py-2 text-sm focus:outline-none font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">SEO title <span className="normal-case font-normal">(defaults to headline)</span></label>
            <input type="text" value={form.seo_title || ''} onChange={e => onChange('seo_title', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">SEO description</label>
            <textarea value={form.seo_description || ''} onChange={e => onChange('seo_description', e.target.value)}
              placeholder="150-160 characters" rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            <p className="text-xs text-slate-400 mt-1">{(form.seo_description || '').length} / 160 chars</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm">Publishing</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Status</label>
            <select value={form.status} onChange={e => onChange('status', e.target.value as ArticleStatus)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              {CMS_STATUS_FILTERS.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Article type</label>
            <select value={form.article_type} onChange={e => onChange('article_type', e.target.value as ArticleType)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              {ARTICLE_TYPES.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_premium" checked={form.is_premium} onChange={e => onChange('is_premium', e.target.checked)} className="w-4 h-4 accent-red-600" />
            <label htmlFor="is_premium" className="text-sm text-slate-700 flex items-center gap-1"><Lock size={12} />Premium (paywall)</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_breaking" checked={form.is_breaking} onChange={e => onChange('is_breaking', e.target.checked)} className="w-4 h-4 accent-red-600" />
            <label htmlFor="is_breaking" className="text-sm text-slate-700 flex items-center gap-1"><Zap size={12} />Breaking news</label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <h3 className="font-semibold text-slate-800 text-sm">Classification</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Author</label>
            <select value={form.author_id || ''} onChange={e => onChange('author_id', e.target.value || null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="">Select author</option>
              {authors.map(author => <option key={author.id} value={author.id}>{author.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
            <select value={form.category_id || ''} onChange={e => onChange('category_id', e.target.value || null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
              <option value="">Select category</option>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Hero image</h3>
            <Link to="/cms/media" target="_blank" className="text-xs text-red-700 hover:underline flex items-center gap-1"><ImageIcon size={11} />Media library</Link>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Image URL</label>
            <input type="url" value={form.hero_image_url || ''} onChange={e => onChange('hero_image_url', e.target.value)}
              placeholder="https://images.pexels.com/..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
          {form.hero_image_url && (
            <img src={form.hero_image_url} alt="Preview" className="w-full rounded-lg object-cover h-32" />
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Caption / credit</label>
            <input type="text" value={form.hero_image_caption || ''} onChange={e => onChange('hero_image_caption', e.target.value)}
              placeholder="Photo credit or caption"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
