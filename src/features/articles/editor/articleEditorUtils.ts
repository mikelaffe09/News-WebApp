import { Article } from '../../../types';
import { ArticleFormState, ArticleMutation, EMPTY_ARTICLE_FORM } from '../articleTypes';

export function toArticleForm(article: Article): ArticleFormState {
  return {
    ...EMPTY_ARTICLE_FORM,
    title: article.title,
    slug: article.slug,
    subtitle: article.subtitle,
    body: article.body,
    excerpt: article.excerpt,
    status: article.status,
    article_type: article.article_type,
    author_id: article.author_id,
    category_id: article.category_id,
    hero_image_url: article.hero_image_url,
    hero_image_caption: article.hero_image_caption,
    is_premium: article.is_premium,
    is_breaking: article.is_breaking,
    published_at: article.published_at,
    scheduled_at: article.scheduled_at,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
  };
}

export function buildArticleMutation(
  form: ArticleFormState,
  status = form.status,
  scheduledAt = '',
): ArticleMutation {
  return {
    ...form,
    status,
    published_at: status === 'published' && !form.published_at ? new Date().toISOString() : form.published_at,
    scheduled_at: status === 'scheduled'
      ? (scheduledAt ? new Date(scheduledAt).toISOString() : form.scheduled_at)
      : form.scheduled_at,
    updated_at: new Date().toISOString(),
  };
}

export function clearScheduledMutation(form: ArticleFormState): ArticleMutation {
  return {
    ...form,
    status: 'draft',
    scheduled_at: null,
    updated_at: new Date().toISOString(),
  };
}

export function countWords(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

export function splitParagraphs(value: string): string[] {
  return value.split(/\n\n+/).map(paragraph => paragraph.trim()).filter(Boolean);
}
