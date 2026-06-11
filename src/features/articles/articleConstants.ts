import { ArticleStatus, ArticleType } from '../../types';

export const ARTICLE_WITH_RELATIONS_SELECT = '*, author:authors(*), category:categories(*)';
export const ARTICLE_WITH_TAGS_SELECT = '*, author:authors(*), category:categories(*), article_tags(tag_id, tags:tags(id, name, slug))';

export const ARTICLE_STATUSES: ArticleStatus[] = [
  'draft',
  'in_review',
  'approved',
  'scheduled',
  'published',
  'archived',
  'retracted',
];

export const CMS_STATUS_FILTERS: ArticleStatus[] = [
  'draft',
  'in_review',
  'approved',
  'scheduled',
  'published',
  'archived',
];

export const ARTICLE_TYPES: ArticleType[] = [
  'standard',
  'breaking',
  'opinion',
  'analysis',
  'feature',
  'interview',
  'review',
  'sponsored',
  'video',
  'photo_essay',
];

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Draft',
  in_review: 'In Review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
  retracted: 'Retracted',
};

export const STATUS_COLORS: Record<ArticleStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  in_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-purple-100 text-purple-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-slate-200 text-slate-500',
  retracted: 'bg-red-100 text-red-700',
};

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  standard: 'Standard',
  breaking: 'Breaking',
  opinion: 'Opinion',
  analysis: 'Analysis',
  feature: 'Feature',
  interview: 'Interview',
  review: 'Review',
  sponsored: 'Sponsored',
  video: 'Video',
  photo_essay: 'Photo Essay',
};
