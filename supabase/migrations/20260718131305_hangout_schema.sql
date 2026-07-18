/*
# Hangout — core schema

1. Overview
Hangout is a multi-user social network. Users authenticate via Supabase email/password.
This migration creates the tables for profiles, posts, likes, comments, follows,
the "Yap" global chat, and a seeded news feed.

2. New Tables
- `profiles` — public profile data keyed by auth.users.id.
- `posts` — user posts containing a photo or video.
- `likes` — likes on a post. Unique (post_id, user_id).
- `comments` — comments on a post.
- `follows` — follower/followee relationship. Unique (follower_id, followee_id).
- `yap_messages` — global real-time chat for the "Yap" section.
- `news_items` — curated latest-news items across categories.

3. Security (RLS)
- All tables have RLS enabled.
- profiles: anyone authenticated can read; a user can update only their own row.
- posts / comments / yap_messages: anyone authenticated can read; only the owner can insert/update/delete their own rows.
- likes: anyone authenticated can read; a user can insert/delete only their own likes.
- follows: anyone authenticated can read; a user can insert/delete only their own follow relationships.
- news_items: anyone authenticated can read; no writes from the client (seeded server-side).

4. Storage
- Creates a public `media` storage bucket for post photo/video uploads.
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  bio text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- posts
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  caption text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo','video')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select" ON posts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts (user_id);

-- likes
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select" ON likes;
CREATE POLICY "likes_select" ON likes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS likes_post_id_idx ON likes (post_id);

-- comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id);

-- follows
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select" ON follows;
CREATE POLICY "follows_select" ON follows FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own" ON follows FOR DELETE
  TO authenticated USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS follows_followee_id_idx ON follows (followee_id);
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows (follower_id);

-- yap_messages (global chat)
CREATE TABLE IF NOT EXISTS yap_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE yap_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yap_select" ON yap_messages;
CREATE POLICY "yap_select" ON yap_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "yap_insert_own" ON yap_messages;
CREATE POLICY "yap_insert_own" ON yap_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "yap_delete_own" ON yap_messages;
CREATE POLICY "yap_delete_own" ON yap_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS yap_created_at_idx ON yap_messages (created_at DESC);

-- news_items (seeded, read-only from client)
CREATE TABLE IF NOT EXISTS news_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source text NOT NULL,
  category text NOT NULL,
  url text,
  image_url text,
  summary text,
  published_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_select" ON news_items;
CREATE POLICY "news_select" ON news_items FOR SELECT
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS news_published_at_idx ON news_items (published_at DESC);

-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_insert_own" ON storage.objects;
CREATE POLICY "media_auth_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_update_own" ON storage.objects;
CREATE POLICY "media_auth_update_own" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());

DROP POLICY IF EXISTS "media_auth_delete_own" ON storage.objects;
CREATE POLICY "media_auth_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid());

-- Seed news items across categories
INSERT INTO news_items (title, source, category, url, image_url, summary, published_at) VALUES
('Apple unveils new M5 chip with 40% faster neural engine', 'TechCrunch', 'Technology', 'https://techcrunch.com', 'https://images.pexels.com/photos/3818750/pexels-photo-3818750.jpeg', 'The new silicon promises major gains for on-device AI workloads.', now() - interval '1 hour'),
('OpenAI launches real-time voice API for developers', 'The Verge', 'Technology', 'https://theverge.com', 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg', 'A new streaming API enables low-latency voice apps.', now() - interval '3 hours'),
('Global markets rally as inflation cools across G7', 'Bloomberg', 'Business', 'https://bloomberg.com', 'https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg', 'Stocks surged after softer-than-expected CPI prints.', now() - interval '2 hours'),
('Tesla announces next-gen solid-state battery roadmap', 'Reuters', 'Business', 'https://reuters.com', 'https://images.pexels.com/photos/376361/pexels-photo-376361.jpeg', 'Production targeted for 2027 with 50% range improvement.', now() - interval '5 hours'),
('Manchester City clinch derby in stoppage time thriller', 'ESPN', 'Sports', 'https://espn.com', 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg', 'A late header sealed a dramatic 2-1 victory.', now() - interval '4 hours'),
('NBA approves new in-season tournament format', 'Sky Sports', 'Sports', 'https://skysports.com', 'https://images.pexels.com/photos/2599538/pexels-photo-2599538.jpeg', 'Expanded knockout stage set for next season.', now() - interval '6 hours'),
('NASA confirms water vapor on distant exoplanet', 'Nature', 'Science', 'https://nature.com', 'https://images.pexels.com/photos/73830/pexels-photo-73830.jpeg', 'JWST observations reveal promising atmospheric signatures.', now() - interval '7 hours'),
('New quantum processor crosses 1,000-qubit threshold', 'MIT Tech Review', 'Science', 'https://technologyreview.com', 'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg', 'Error-corrected logical qubits reach milestone.', now() - interval '9 hours'),
('Cannes festival reveals 2026 official selection', 'Variety', 'Entertainment', 'https://variety.com', 'https://images.pexels.com/photos/7234259/pexels-photo-7234259.jpeg', 'A record number of debut features make the cut.', now() - interval '8 hours'),
('Streaming platform greenlights fantasy series adaptation', 'Deadline', 'Entertainment', 'https://deadline.com', 'https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg', 'The beloved book trilogy heads to production.', now() - interval '10 hours'),
('UN climate summit ends with landmark forest pact', 'Al Jazeera', 'World', 'https://aljazeera.com', 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg', 'Nations pledge to halt deforestation by 2030.', now() - interval '11 hours'),
('Earthquake relief efforts expand across coastal regions', 'BBC News', 'World', 'https://bbc.com', 'https://images.pexels.com/photos/2474685/pexels-photo-2474685.jpeg', 'Aid groups mobilize as recovery enters second week.', now() - interval '12 hours')
ON CONFLICT DO NOTHING;
