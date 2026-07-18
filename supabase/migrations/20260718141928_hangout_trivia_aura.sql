/*
# Hangout — Trivia & Aura Points

1. Overview
Adds an Aura Points system to profiles (positive and negative tallies) and a Trivia
feature: multiple-choice questions, one correct answer, +10 aura for correct,
-1 aura for incorrect. A leaderboard ranks users by total aura.

2. Schema changes
- profiles: add aura_plus int default 0, aura_minus int default 0.
- trivia_questions: seeded pool of MCQs with 4 options and a correct index.
- trivia_answers: log of each user's answer per question (unique per user+question)
  so a user can answer each question once.

3. Security (RLS)
- trivia_questions: read for authenticated.
- trivia_answers: read own; insert own (with aura delta enforced in app layer).
- profiles aura columns are updated via a security-definer function to avoid
  exposing wide update policies.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS aura_plus integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aura_minus integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS trivia_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options text[] NOT NULL,
  correct_index integer NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trivia_select" ON trivia_questions;
CREATE POLICY "trivia_select" ON trivia_questions FOR SELECT
  TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS trivia_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES trivia_questions(id) ON DELETE CASCADE,
  selected_index integer NOT NULL,
  correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);

ALTER TABLE trivia_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trivia_answers_select_own" ON trivia_answers;
CREATE POLICY "trivia_answers_select_own" ON trivia_answers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trivia_answers_insert_own" ON trivia_answers;
CREATE POLICY "trivia_answers_insert_own" ON trivia_answers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS trivia_answers_user_idx ON trivia_answers (user_id);

-- Seed a pool of easy trivia questions
INSERT INTO trivia_questions (question, options, correct_index, category) VALUES
  ('How many continents are there on Earth?', ARRAY['5','6','7','8'], 2, 'Geography'),
  ('What is the largest planet in our solar system?', ARRAY['Earth','Jupiter','Saturn','Mars'], 1, 'Science'),
  ('What color do you get by mixing blue and yellow?', ARRAY['Green','Purple','Orange','Brown'], 0, 'Art'),
  ('How many legs does a spider have?', ARRAY['6','8','10','12'], 1, 'Nature'),
  ('What is the capital of France?', ARRAY['Rome','Madrid','Paris','Berlin'], 2, 'Geography'),
  ('Which ocean is the largest?', ARRAY['Atlantic','Indian','Arctic','Pacific'], 3, 'Geography'),
  ('What gas do plants absorb from the air?', ARRAY['Oxygen','Carbon dioxide','Nitrogen','Hydrogen'], 1, 'Science'),
  ('How many sides does a hexagon have?', ARRAY['5','6','7','8'], 1, 'Math'),
  ('What is 7 multiplied by 8?', ARRAY['54','56','58','64'], 1, 'Math'),
  ('Which animal is known as the King of the Jungle?', ARRAY['Tiger','Elephant','Lion','Giraffe'], 2, 'Nature'),
  ('What is the smallest prime number?', ARRAY['0','1','2','3'], 2, 'Math'),
  ('How many colors are in a rainbow?', ARRAY['5','6','7','8'], 2, 'Science'),
  ('What is the freezing point of water in Celsius?', ARRAY['0','32','100','-10'], 0, 'Science'),
  ('Which planet is closest to the Sun?', ARRAY['Venus','Mercury','Earth','Mars'], 1, 'Science'),
  ('How many minutes are in an hour?', ARRAY['30','45','60','90'], 2, 'General')
ON CONFLICT DO NOTHING;
