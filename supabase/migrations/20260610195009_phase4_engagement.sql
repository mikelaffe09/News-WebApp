-- ─── user_profiles (public readers) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text NOT NULL,
  display_name text,
  avatar_url   text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─── saved_articles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_articles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  saved_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, article_id)
);

ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_articles_select_own" ON saved_articles;
CREATE POLICY "saved_articles_select_own" ON saved_articles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_articles_insert_own" ON saved_articles;
CREATE POLICY "saved_articles_insert_own" ON saved_articles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_articles_delete_own" ON saved_articles;
CREATE POLICY "saved_articles_delete_own" ON saved_articles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── full-text search vector on articles ─────────────────────────────────────
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(subtitle, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
    setweight(to_tsvector('english', left(coalesce(body, ''), 10000)), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_articles_search_vector ON articles USING GIN(search_vector);

-- ─── newsletter preferences column ───────────────────────────────────────────
ALTER TABLE newsletter_subscriptions
  ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';

-- ─── indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id   ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_articles_article_id ON saved_articles(article_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_id         ON user_profiles(id);
