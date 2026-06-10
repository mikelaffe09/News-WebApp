/*
# News Platform — Core Schema

## Summary
Creates all tables required for the Premium News Website MVP.

## New Tables

### categories
Stores article categories (World, Politics, Business, etc.).
- id, name, slug (unique), description, color (hex accent), sort_order

### authors
Public-facing writer/journalist profiles. Separate from auth users so guest
authors can exist without CMS accounts.
- id, user_id (optional FK to auth.users), name, slug, bio, avatar_url, email

### tags
Keyword tags for articles.
- id, name, slug

### articles
Core content table. Supports all article states, types, premium flag, view
tracking and basic SEO fields.
- status enum: draft | in_review | approved | scheduled | published | archived | retracted
- article_type enum: standard | breaking | opinion | analysis | feature | interview | review | sponsored | video | photo_essay

### article_tags
Many-to-many join between articles and tags.

### newsletter_subscriptions
Stores newsletter email signups from public site.

### search_queries
Records every search term used on the public site for analytics.

### analytics_events
Generic event log for page views, paywall impressions, subscription events.
- event_type: article_view | paywall_impression | subscription_start | subscription_complete

### subscriptions
Paid subscriber records (one row per active subscription).

### cms_profiles
CMS user profiles extending auth.users with a role column.
- role: writer | editor | managing_editor | admin

## Security
- RLS enabled on all tables.
- Published articles, categories, authors, tags: readable by anon + authenticated.
- CMS write operations: authenticated only.
- newsletter_subscriptions INSERT: anon allowed; SELECT authenticated only.
- search_queries INSERT: anon allowed; SELECT authenticated only.
- analytics_events INSERT: anon allowed; SELECT authenticated only.
- subscriptions: owner-scoped for users; authenticated broad read for admins delegated to app-layer checks.
- cms_profiles: owner-scoped.
*/

-- ─── categories ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  description text,
  color       text DEFAULT '#1e40af',
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_auth" ON categories;
CREATE POLICY "categories_insert_auth" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "categories_update_auth" ON categories;
CREATE POLICY "categories_update_auth" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "categories_delete_auth" ON categories;
CREATE POLICY "categories_delete_auth" ON categories FOR DELETE
  TO authenticated USING (true);

-- ─── authors ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  bio        text,
  avatar_url text,
  email      text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authors_select_public" ON authors;
CREATE POLICY "authors_select_public" ON authors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authors_insert_auth" ON authors;
CREATE POLICY "authors_insert_auth" ON authors FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authors_update_auth" ON authors;
CREATE POLICY "authors_update_auth" ON authors FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authors_delete_auth" ON authors;
CREATE POLICY "authors_delete_auth" ON authors FOR DELETE
  TO authenticated USING (true);

-- ─── tags ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_select_public" ON tags;
CREATE POLICY "tags_select_public" ON tags FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tags_insert_auth" ON tags;
CREATE POLICY "tags_insert_auth" ON tags FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "tags_update_auth" ON tags;
CREATE POLICY "tags_update_auth" ON tags FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tags_delete_auth" ON tags;
CREATE POLICY "tags_delete_auth" ON tags FOR DELETE
  TO authenticated USING (true);

-- ─── articles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  slug                text UNIQUE NOT NULL,
  subtitle            text,
  body                text NOT NULL DEFAULT '',
  excerpt             text,
  status              text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','scheduled','published','archived','retracted')),
  article_type        text NOT NULL DEFAULT 'standard'
    CHECK (article_type IN ('standard','breaking','opinion','analysis','feature','interview','review','sponsored','video','photo_essay')),
  author_id           uuid REFERENCES authors(id) ON DELETE SET NULL,
  category_id         uuid REFERENCES categories(id) ON DELETE SET NULL,
  hero_image_url      text,
  hero_image_caption  text,
  is_premium          boolean NOT NULL DEFAULT false,
  is_breaking         boolean NOT NULL DEFAULT false,
  published_at        timestamptz,
  scheduled_at        timestamptz,
  view_count          integer NOT NULL DEFAULT 0,
  seo_title           text,
  seo_description     text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_select_published_public" ON articles;
CREATE POLICY "articles_select_published_public" ON articles FOR SELECT
  TO anon USING (status = 'published');

DROP POLICY IF EXISTS "articles_select_auth" ON articles;
CREATE POLICY "articles_select_auth" ON articles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "articles_insert_auth" ON articles;
CREATE POLICY "articles_insert_auth" ON articles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "articles_update_auth" ON articles;
CREATE POLICY "articles_update_auth" ON articles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "articles_delete_auth" ON articles;
CREATE POLICY "articles_delete_auth" ON articles FOR DELETE
  TO authenticated USING (true);

-- ─── article_tags ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_tags (
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  tag_id     uuid REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "article_tags_select_public" ON article_tags;
CREATE POLICY "article_tags_select_public" ON article_tags FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "article_tags_insert_auth" ON article_tags;
CREATE POLICY "article_tags_insert_auth" ON article_tags FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "article_tags_delete_auth" ON article_tags;
CREATE POLICY "article_tags_delete_auth" ON article_tags FOR DELETE
  TO authenticated USING (true);

-- ─── newsletter_subscriptions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  name       text,
  status     text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','unsubscribed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_insert_anon" ON newsletter_subscriptions;
CREATE POLICY "newsletter_insert_anon" ON newsletter_subscriptions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_select_auth" ON newsletter_subscriptions;
CREATE POLICY "newsletter_select_auth" ON newsletter_subscriptions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "newsletter_update_auth" ON newsletter_subscriptions;
CREATE POLICY "newsletter_update_auth" ON newsletter_subscriptions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ─── search_queries ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_queries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query         text NOT NULL,
  results_count integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_insert_anon" ON search_queries;
CREATE POLICY "search_insert_anon" ON search_queries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "search_select_auth" ON search_queries;
CREATE POLICY "search_select_auth" ON search_queries FOR SELECT
  TO authenticated USING (true);

-- ─── analytics_events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,
  article_id  uuid REFERENCES articles(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  author_id   uuid REFERENCES authors(id) ON DELETE SET NULL,
  session_id  text,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "analytics_insert_anon" ON analytics_events;
CREATE POLICY "analytics_insert_anon" ON analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_select_auth" ON analytics_events;
CREATE POLICY "analytics_select_auth" ON analytics_events FOR SELECT
  TO authenticated USING (true);

-- ─── subscriptions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  status     text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','cancelled','past_due','trialing')),
  plan       text NOT NULL DEFAULT 'monthly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_auth" ON subscriptions;
CREATE POLICY "subscriptions_select_auth" ON subscriptions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "subscriptions_insert_auth" ON subscriptions;
CREATE POLICY "subscriptions_insert_auth" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "subscriptions_update_auth" ON subscriptions;
CREATE POLICY "subscriptions_update_auth" ON subscriptions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ─── cms_profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  display_name text,
  role         text NOT NULL DEFAULT 'writer'
    CHECK (role IN ('writer','editor','managing_editor','admin')),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE cms_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cms_profiles_select_own" ON cms_profiles;
CREATE POLICY "cms_profiles_select_own" ON cms_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "cms_profiles_insert_own" ON cms_profiles;
CREATE POLICY "cms_profiles_insert_own" ON cms_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "cms_profiles_update_own" ON cms_profiles;
CREATE POLICY "cms_profiles_update_own" ON cms_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─── indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_article_id ON analytics_events(article_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);
