/*
# Phase 2: Editorial Workflow, Scheduling, Media, Homepage Curation

## New Tables

### article_revisions
Stores snapshots of article body/title/subtitle every time an article is saved.
Enables revision history and recovery.
- id, article_id, title, subtitle, body, status, changed_by_email, created_at

### media_assets
Central media library. Each row is an uploaded or URL-referenced image/video.
- id, url, filename, alt_text, caption, credit, width, height, file_size, mime_type, uploaded_by_email, created_at

### homepage_modules
Ordered editorial modules that control the homepage layout. Each row is one block.
- module_type: hero | featured_grid | breaking | category_spotlight | opinion | newsletter | trending
- position: display order (lower = higher on page)
- article_id: optional pinned article for hero/spotlight modules
- category_id: optional for category_spotlight
- title: optional override title for the block
- is_active: hidden from homepage if false

### workflow_comments
Internal editorial comments on articles (review notes, approvals, etc.).
- id, article_id, author_email, comment, action (commented | submitted | approved | rejected | published | scheduled), created_at

## Security
- All new tables: RLS enabled.
- article_revisions: authenticated can read and insert.
- media_assets: authenticated CRUD.
- homepage_modules: anon can SELECT active ones; authenticated can manage.
- workflow_comments: authenticated can read and insert.
*/

-- ─── article_revisions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_revisions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id       uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title            text NOT NULL,
  subtitle         text,
  body             text NOT NULL,
  status           text NOT NULL,
  changed_by_email text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "revisions_select_auth" ON article_revisions;
CREATE POLICY "revisions_select_auth" ON article_revisions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "revisions_insert_auth" ON article_revisions;
CREATE POLICY "revisions_insert_auth" ON article_revisions FOR INSERT
  TO authenticated WITH CHECK (true);

-- ─── media_assets ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_assets (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url               text NOT NULL,
  filename          text,
  alt_text          text,
  caption           text,
  credit            text,
  width             integer,
  height            integer,
  file_size         integer,
  mime_type         text,
  uploaded_by_email text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_select_auth" ON media_assets;
CREATE POLICY "media_select_auth" ON media_assets FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "media_insert_auth" ON media_assets;
CREATE POLICY "media_insert_auth" ON media_assets FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "media_update_auth" ON media_assets;
CREATE POLICY "media_update_auth" ON media_assets FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "media_delete_auth" ON media_assets;
CREATE POLICY "media_delete_auth" ON media_assets FOR DELETE
  TO authenticated USING (true);

-- ─── homepage_modules ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homepage_modules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_type text NOT NULL DEFAULT 'featured_grid'
    CHECK (module_type IN ('hero','featured_grid','breaking','category_spotlight','opinion','newsletter','trending')),
  position    integer NOT NULL DEFAULT 0,
  title       text,
  article_id  uuid REFERENCES articles(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  settings    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE homepage_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select_public" ON homepage_modules;
CREATE POLICY "modules_select_public" ON homepage_modules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "modules_insert_auth" ON homepage_modules;
CREATE POLICY "modules_insert_auth" ON homepage_modules FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "modules_update_auth" ON homepage_modules;
CREATE POLICY "modules_update_auth" ON homepage_modules FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "modules_delete_auth" ON homepage_modules;
CREATE POLICY "modules_delete_auth" ON homepage_modules FOR DELETE
  TO authenticated USING (true);

-- ─── workflow_comments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id   uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_email text NOT NULL,
  comment      text NOT NULL,
  action       text NOT NULL DEFAULT 'commented'
    CHECK (action IN ('commented','submitted','approved','rejected','published','scheduled','archived')),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE workflow_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_select_auth" ON workflow_comments;
CREATE POLICY "workflow_select_auth" ON workflow_comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "workflow_insert_auth" ON workflow_comments;
CREATE POLICY "workflow_insert_auth" ON workflow_comments FOR INSERT
  TO authenticated WITH CHECK (true);

-- ─── indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_article_revisions_article_id ON article_revisions(article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_created_at ON media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_homepage_modules_position ON homepage_modules(position, is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_comments_article_id ON workflow_comments(article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_scheduled_at ON articles(scheduled_at) WHERE status = 'scheduled';
