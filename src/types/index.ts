export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Author {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
}

export type ArticleStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'retracted';

export type ArticleType =
  | 'standard'
  | 'breaking'
  | 'opinion'
  | 'analysis'
  | 'feature'
  | 'interview'
  | 'review'
  | 'sponsored'
  | 'video'
  | 'photo_essay';

export interface ArticleTag {
  tag_id: string;
  tags: Tag;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  body: string;
  excerpt: string | null;
  status: ArticleStatus;
  article_type: ArticleType;
  author_id: string | null;
  category_id: string | null;
  hero_image_url: string | null;
  hero_image_caption: string | null;
  is_premium: boolean;
  is_breaking: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  author?: Author | null;
  category?: Category | null;
  article_tags?: ArticleTag[];
}

export interface ArticleRevision {
  id: string;
  article_id: string;
  title: string;
  subtitle: string | null;
  body: string;
  status: string;
  changed_by_email: string | null;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  url: string;
  filename: string | null;
  alt_text: string | null;
  caption: string | null;
  credit: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by_email: string | null;
  created_at: string;
}

export interface HomepageModule {
  id: string;
  module_type: 'hero' | 'featured_grid' | 'breaking' | 'category_spotlight' | 'opinion' | 'newsletter' | 'trending';
  position: number;
  title: string | null;
  article_id: string | null;
  category_id: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  article?: Article | null;
  category?: Category | null;
}

export interface WorkflowComment {
  id: string;
  article_id: string;
  author_email: string;
  comment: string;
  action: 'commented' | 'submitted' | 'approved' | 'rejected' | 'published' | 'scheduled' | 'archived';
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  name: string | null;
  status: 'active' | 'unsubscribed';
  preferences: { categories?: string[]; frequency?: 'daily' | 'weekly' };
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string | null;
  email: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface CmsProfile {
  id: string;
  email: string;
  display_name: string | null;
  role: 'writer' | 'editor' | 'managing_editor' | 'admin';
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedArticle {
  id: string;
  user_id: string;
  article_id: string;
  saved_at: string;
  article?: Article;
}
