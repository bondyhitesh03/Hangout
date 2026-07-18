/*
# Hangout — DMs and Jokes

1. Overview
Adds private direct messaging ("Whisper") and a daily-jokes feed for the home page.

2. New Tables
- `dm_threads` — a 1:1 conversation between two users.
  - id uuid PK, user_a uuid, user_b uuid, created_at. Unique (user_a, user_b) in sorted order via CHECK.
- `dm_messages` — messages within a thread.
  - id uuid PK, thread_id FK dm_threads (cascade), sender_id FK profiles (cascade), content text, created_at.
- `jokes` — a curated pool of jokes shown on the home page.
  - id uuid PK, setup text, punchline text, created_at.

3. Security (RLS)
- dm_threads: a participant can read/insert/update only threads they are part of (user_a = auth.uid() OR user_b = auth.uid()).
- dm_messages: a participant of the parent thread can read; the sender can insert their own messages; sender can delete their own.
- jokes: anyone authenticated can read; no client writes (seeded server-side).

4. Seed
- Inserts a pool of light, family-friendly jokes.
*/

-- dm_threads
CREATE TABLE IF NOT EXISTS dm_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a <> user_b)
);

-- Enforce uniqueness regardless of order (smaller id first)
CREATE UNIQUE INDEX IF NOT EXISTS dm_threads_pair_idx
  ON dm_threads (LEAST(user_a, user_b), GREATEST(user_a, user_b));

ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dm_threads_select_participant" ON dm_threads;
CREATE POLICY "dm_threads_select_participant" ON dm_threads FOR SELECT
  TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "dm_threads_insert_participant" ON dm_threads;
CREATE POLICY "dm_threads_insert_participant" ON dm_threads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "dm_threads_update_participant" ON dm_threads;
CREATE POLICY "dm_threads_update_participant" ON dm_threads FOR UPDATE
  TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b)
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

-- dm_messages
CREATE TABLE IF NOT EXISTS dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dm_messages_select_participant" ON dm_messages;
CREATE POLICY "dm_messages_select_participant" ON dm_messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM dm_threads t
      WHERE t.id = dm_messages.thread_id
        AND (t.user_a = auth.uid() OR t.user_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS "dm_messages_insert_sender" ON dm_messages;
CREATE POLICY "dm_messages_insert_sender" ON dm_messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM dm_threads t
      WHERE t.id = dm_messages.thread_id
        AND (t.user_a = auth.uid() OR t.user_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS "dm_messages_delete_sender" ON dm_messages;
CREATE POLICY "dm_messages_delete_sender" ON dm_messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

CREATE INDEX IF NOT EXISTS dm_messages_thread_idx ON dm_messages (thread_id, created_at);

-- jokes
CREATE TABLE IF NOT EXISTS jokes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setup text NOT NULL,
  punchline text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE jokes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jokes_select" ON jokes;
CREATE POLICY "jokes_select" ON jokes FOR SELECT
  TO authenticated USING (true);

-- Seed jokes
INSERT INTO jokes (setup, punchline) VALUES
('I told my computer I needed a break.', 'Now it won''t stop sending me Kit-Kats.'),
('Why don''t skeletons fight each other?', 'They don''t have the guts.'),
('I''m reading a book about anti-gravity.', 'It''s impossible to put down.'),
('Why did the scarecrow win an award?', 'Because he was outstanding in his field.'),
('I would tell you a construction joke.', 'But I''m still working on it.'),
('Why don''t scientists trust atoms?', 'Because they make up everything.'),
('I''m on a seafood diet.', 'I see food and I eat it.'),
('What do you call fake spaghetti?', 'An impasta.'),
('Why can''t you give a balloon to a baby?', 'It will cry because of pop music.'),
('I told my wife she was drawing her eyebrows too high.', 'She looked surprised.'),
('What do you call a fish wearing a bowtie?', 'Sofishticated.'),
('I tried to catch fog yesterday.', 'I mist.'),
('Why did the math book look sad?', 'Because it had too many problems.'),
('I''m afraid for the calendar.', 'Its days are numbered.'),
('What do you call a can opener that doesn''t work?', 'A can''t opener.'),
('Why don''t eggs tell jokes?', 'They''d crack each other up.'),
('I got a job at a bakery because I kneaded dough.', 'It was the yeast I could do.'),
('What do you call a snowman with a six-pack?', 'An abdominal snowman.'),
('I couldn''t figure out why the frisbee kept getting bigger.', 'Then it hit me.'),
('Why don''t programmers like nature?', 'It has too many bugs.')
ON CONFLICT DO NOTHING;
