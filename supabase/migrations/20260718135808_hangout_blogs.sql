/*
# Hangout — Blogs

1. Overview
Adds a blogging feature: longer-form posts with a title and body, plus likes.
Blogs appear on the home page alongside photo/video posts and on a dedicated Blogs page.

2. New Tables
- `blogs` — id, user_id FK profiles, title, body, created_at.
- `blog_likes` — unique (blog_id, user_id).

3. Security (RLS)
- blogs: anyone authenticated can read; owner can insert/update/delete their own.
- blog_likes: anyone authenticated can read; a user can insert/delete only their own likes.
*/

CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blogs_select" ON blogs;
CREATE POLICY "blogs_select" ON blogs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "blogs_insert_own" ON blogs;
CREATE POLICY "blogs_insert_own" ON blogs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blogs_update_own" ON blogs;
CREATE POLICY "blogs_update_own" ON blogs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blogs_delete_own" ON blogs;
CREATE POLICY "blogs_delete_own" ON blogs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS blogs_created_at_idx ON blogs (created_at DESC);
CREATE INDEX IF NOT EXISTS blogs_user_id_idx ON blogs (user_id);

CREATE TABLE IF NOT EXISTS blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blog_id, user_id)
);

ALTER TABLE blog_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_likes_select" ON blog_likes;
CREATE POLICY "blog_likes_select" ON blog_likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "blog_likes_insert_own" ON blog_likes;
CREATE POLICY "blog_likes_insert_own" ON blog_likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "blog_likes_delete_own" ON blog_likes;
CREATE POLICY "blog_likes_delete_own" ON blog_likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS blog_likes_blog_id_idx ON blog_likes (blog_id);
