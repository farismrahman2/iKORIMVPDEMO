-- iKORI JLPT N5 Pass Engine — Initial Schema
-- ============================================

--- Users & Skill Profiles ---

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  onboarded BOOLEAN DEFAULT FALSE,
  streak INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ,
  pass_probability FLOAT DEFAULT 0,
  readiness_band TEXT CHECK (readiness_band IN ('high_risk','borderline','probable','strong')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  skill_tag TEXT NOT NULL,
  score FLOAT NOT NULL DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_tag)
);

CREATE TABLE public.user_weak_areas (
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  skill_tag TEXT NOT NULL,
  score FLOAT NOT NULL,
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_tag)
);

--- Question Bank ---

CREATE TYPE section_type AS ENUM ('vocab', 'grammar_reading', 'listening');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE frequency_tier AS ENUM ('high', 'medium', 'stretch');
CREATE TYPE source_type AS ENUM ('authored', 'ai_generated', 'editor_approved');

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section section_type NOT NULL,
  subtype TEXT NOT NULL,
  difficulty difficulty_level NOT NULL,
  topic TEXT NOT NULL,
  skill_tag TEXT NOT NULL,
  frequency_tier frequency_tier NOT NULL DEFAULT 'high',
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  explanation_en TEXT NOT NULL,
  explanation_bn TEXT NOT NULL,
  audio_url TEXT,
  audio_script TEXT,
  distractor_logic TEXT,
  source_type source_type NOT NULL DEFAULT 'ai_generated',
  validated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_validated ON questions(validated, section, difficulty, skill_tag);
CREATE INDEX idx_questions_section ON questions(section, difficulty, frequency_tier);

--- Vocabulary & Flashcards ---

CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  kana TEXT NOT NULL,
  kanji TEXT,
  meaning_en TEXT NOT NULL,
  meaning_bn TEXT NOT NULL,
  example_sentence_jp TEXT NOT NULL,
  example_sentence_bn TEXT,
  audio_url TEXT,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  frequency_tier frequency_tier NOT NULL DEFAULT 'high',
  confusion_set UUID[],
  validated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.flashcard_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  confidence TEXT CHECK (confidence IN ('easy','good','hard','again')),
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  next_review DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed TIMESTAMPTZ,
  review_count INTEGER DEFAULT 0,
  UNIQUE(user_id, word_id)
);

CREATE INDEX idx_flashcard_due ON flashcard_state(user_id, next_review);

--- Exam Sessions & Results ---

CREATE TYPE exam_type AS ENUM ('full','section','speed','diagnostic');

CREATE TABLE public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  exam_type exam_type NOT NULL,
  section_filter section_type,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_limit_sec INTEGER NOT NULL DEFAULT 4500,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','timed_out')),
  vocab_score FLOAT,
  grammar_score FLOAT,
  listening_score FLOAT,
  overall_score FLOAT,
  weighted_score FLOAT,
  readiness_band TEXT
);

CREATE TABLE public.exam_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  user_answer INTEGER,
  is_correct BOOLEAN,
  time_taken_ms INTEGER,
  skill_tag TEXT NOT NULL,
  difficulty difficulty_level NOT NULL
);

CREATE INDEX idx_responses_session ON exam_responses(session_id);
CREATE INDEX idx_responses_skill ON exam_responses(skill_tag, is_correct);

--- Analytics Events ---

CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- Listening Errors Log ---

CREATE TABLE public.listening_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id),
  audio_url TEXT,
  error_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- Row Level Security ---

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weak_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_own_profile ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY user_own_scores ON user_skill_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_weak ON user_weak_areas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_sessions ON exam_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_responses ON exam_responses FOR ALL USING (
  session_id IN (SELECT id FROM exam_sessions WHERE user_id = auth.uid())
);
CREATE POLICY user_own_flashcards ON flashcard_state FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_own_events ON user_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY public_questions ON questions FOR SELECT USING (validated = TRUE);
CREATE POLICY public_vocab ON vocabulary FOR SELECT USING (validated = TRUE);
