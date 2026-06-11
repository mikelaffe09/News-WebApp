import { Article } from '../../types';

export type ArticleFormState = Omit<
  Article,
  'id' | 'created_at' | 'updated_at' | 'view_count' | 'author' | 'category' | 'article_tags'
>;

export type ArticleMutation = Partial<
  Omit<Article, 'id' | 'created_at' | 'author' | 'category' | 'article_tags'>
>;

export type ArticleSearchSort = 'relevance' | 'newest' | 'oldest' | 'popular';

export interface PaginatedArticles {
  articles: Article[];
  total: number;
}

export const EMPTY_ARTICLE_FORM: ArticleFormState = {
  title: '',
  slug: '',
  subtitle: '',
  body: '',
  excerpt: '',
  status: 'draft',
  article_type: 'standard',
  author_id: null,
  category_id: null,
  hero_image_url: '',
  hero_image_caption: '',
  is_premium: false,
  is_breaking: false,
  published_at: null,
  scheduled_at: null,
  seo_title: '',
  seo_description: '',
};
