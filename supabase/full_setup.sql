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
ALTER TABLE listening_errors ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY anyone_insert_errors ON listening_errors FOR INSERT WITH CHECK (true);
CREATE POLICY admin_read_errors ON listening_errors FOR SELECT USING (false);


--- Seed Vocabulary Data ---

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'ありがとう', 'ありがとう', NULL, 'thank you', 'ধন্যবাদ', 'てつだってくれて、ありがとう。', 'সাহায্য করার জন্য ধন্যবাদ।', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'すみません', 'すみません', NULL, 'excuse me', 'মাফ করবেন', 'すみません、えきはどこですか。', 'মাফ করবেন, স্টেশন কোথায়?', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'おはよう', 'おはよう', NULL, 'good morning', 'সুপ্রভাত', 'おはよう、きょうもいいてんきですね。', 'সুপ্রভাত, আজও ভালো আবহাওয়া।', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'こんにちは', 'こんにちは', NULL, 'hello', 'নমস্কার', 'こんにちは、おげんきですか。', 'নমস্কার, আপনি কেমন আছেন?', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'こんばんは', 'こんばんは', NULL, 'good evening', 'শুভ সন্ধ্যা', 'こんばんは、おつかれさまです。', 'শুভ সন্ধ্যা, আপনি ক্লান্ত হয়েছেন।', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'さようなら', 'さようなら', NULL, 'goodbye', 'বিদায়', 'さようなら、またあしたね。', 'বিদায়, আবার আগামীকাল দেখা হবে।', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'おやすみ', 'おやすみ', NULL, 'good night', 'শুভ রাত্রি', 'おやすみ、いいゆめをみてね。', 'শুভ রাত্রি, ভালো স্বপ্ন দেখো।', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'はじめまして', 'はじめまして', NULL, 'nice to meet you', 'আপনার সাথে দেখা করে ভালো লাগলো', 'はじめまして、わたしはたなかです。', 'আপনার সাথে দেখা করে ভালো লাগলো, আমি তানাকা।', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'よろしく', 'よろしく', NULL, 'pleased to meet you', 'দয়া করে আমাকে মনে রাখবেন', 'よろしくおねがいします。', 'দয়া করে আমার যত্ন নেবেন।', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'いただきます', 'いただきます', NULL, 'bon appetit', 'খাওয়ার আগে বলা হয়', 'ごはんのまえに「いただきます」といいます。', 'খাবারের আগে ''ইতাদাকিমাসু'' বলা হয়।', NULL, 'greetings', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '一', 'いち', '一', 'one (1)', 'এক', 'りんごが一つあります。', 'একটি আপেল আছে।', NULL, 'numbers', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '二', 'に', '二', 'two (2)', 'দুই', 'ねこが二ひきいます。', 'দুটি বিড়াল আছে।', NULL, 'numbers', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '三', 'さん', '三', 'three (3)', 'তিন', '三にんでいきましょう。', 'তিনজনে যাই।', NULL, 'numbers', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '四', 'よん', '四', 'four (4)', 'চার', '四じにあいましょう。', 'চারটায় দেখা করি।', NULL, 'numbers', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '五', 'ご', '五', 'five (5)', 'পাঁচ', '五ふんまってください。', 'পাঁচ মিনিট অপেক্ষা করুন।', NULL, 'numbers', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '六', 'ろく', '六', 'six (6)', 'ছয়', 'まいあさ六じにおきます。', 'প্রতিদিন সকাল ছয়টায় উঠি।', NULL, 'numbers', 1, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '七', 'なな', '七', 'seven (7)', 'সাত', '七がつにりょこうします。', 'জুলাই মাসে ভ্রমণ করব।', NULL, 'numbers', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '八', 'はち', '八', 'eight (8)', 'আট', '八じにがっこうにいきます。', 'আটটায় স্কুলে যাই।', NULL, 'numbers', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '九', 'きゅう', '九', 'nine (9)', 'নয়', '九じにねます。', 'নয়টায় ঘুমাই।', NULL, 'numbers', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), '十', 'じゅう', '十', 'ten (10)', 'দশ', '十にんのがくせいがいます。', 'দশজন ছাত্র আছে।', NULL, 'numbers', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'たべる', 'たべる', '食べる', 'eat', 'খাওয়া', 'あさごはんをたべます。', 'সকালের খাবার খাই।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'のむ', 'のむ', '飲む', 'drink', 'পান করা', 'みずをのみます。', 'পানি পান করি।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'いく', 'いく', '行く', 'go', 'যাওয়া', 'がっこうにいきます。', 'স্কুলে যাই।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'くる', 'くる', '来る', 'come', 'আসা', 'ともだちがうちにきます。', 'বন্ধু বাড়িতে আসে।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'みる', 'みる', '見る', 'see / look', 'দেখা', 'テレビをみます。', 'টেলিভিশন দেখি।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'きく', 'きく', '聞く', 'listen', 'শোনা', 'おんがくをききます。', 'গান শুনি।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'よむ', 'よむ', '読む', 'read', 'পড়া', 'ほんをよみます。', 'বই পড়ি।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'かく', 'かく', '書く', 'write', 'লেখা', 'てがみをかきます。', 'চিঠি লিখি।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'はなす', 'はなす', '話す', 'speak', 'কথা বলা', 'にほんごをはなします。', 'জাপানি ভাষায় কথা বলি।', NULL, 'verbs', 2, 'high'::frequency_tier, NULL, true);

INSERT INTO vocabulary (id, word, kana, kanji, meaning_en, meaning_bn, example_sentence_jp, example_sentence_bn, audio_url, category, difficulty, frequency_tier, confusion_set, validated)
VALUES (gen_random_uuid(), 'あそぶ', 'あそぶ', '遊ぶ', 'play', 'খেলা', 'こうえんであそびます。', 'পার্কে খেলি।', NULL, 'verbs', 2, 'medium'::frequency_tier, NULL, true);

--- Seed Questions Data ---

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'word_meaning', 'easy'::difficulty_level, 'greetings', 'word_meaning', 'high'::frequency_tier, '「ありがとう」はえいごでなんですか。What does ありがとう mean?', '["Thank you", "Goodbye", "Good morning", "Excuse me"]'::jsonb, 0, 'ありがとう (arigatou) means "thank you" in Japanese. It is one of the most common expressions.', 'ありがとう (আরিগাতো) জাপানি ভাষায় "ধন্যবাদ" বোঝায়। এটি সবচেয়ে সাধারণ অভিব্যক্তিগুলোর একটি।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'word_meaning', 'easy'::difficulty_level, 'greetings', 'word_meaning', 'high'::frequency_tier, '「さようなら」はえいごでなんですか。What does さようなら mean?', '["Hello", "Good night", "Goodbye", "Thank you"]'::jsonb, 2, 'さようなら (sayounara) means "goodbye" in Japanese, used when parting for a longer period.', 'さようなら (সায়োনারা) জাপানি ভাষায় "বিদায়" বোঝায়, দীর্ঘ সময়ের জন্য বিদায় নেওয়ার সময় ব্যবহৃত হয়।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'kana_recognition', 'easy'::difficulty_level, 'numbers', 'kana_recognition', 'high'::frequency_tier, '「三」のよみかたはなんですか。What is the reading of 三?', '["に", "さん", "ご", "し"]'::jsonb, 1, '三 is read as さん (san) and means "three" (3).', '三 এর উচ্চারণ さん (সান) এবং এর অর্থ "তিন" (৩)।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'kana_recognition', 'easy'::difficulty_level, 'numbers', 'kana_recognition', 'high'::frequency_tier, '「七」のよみかたはなんですか。What is the reading of 七?', '["ろく", "はち", "なな", "きゅう"]'::jsonb, 2, '七 is read as なな (nana) or しち (shichi) and means "seven" (7).', '七 এর উচ্চারণ なな (নানা) বা しち (শিচি) এবং এর অর্থ "সাত" (৭)।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'word_meaning', 'easy'::difficulty_level, 'verbs', 'word_meaning', 'high'::frequency_tier, '「たべる」はえいごでなんですか。What does たべる mean?', '["To drink", "To eat", "To go", "To read"]'::jsonb, 1, 'たべる (taberu) means "to eat". The kanji is 食べる.', 'たべる (তাবেরু) মানে "খাওয়া"। কাঞ্জি হলো 食べる।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'vocab_usage', 'medium'::difficulty_level, 'verbs', 'vocab_usage', 'high'::frequency_tier, 'まいにちほんを＿＿ます。(I ___ books every day.)', '["たべ", "のみ", "よみ", "かき"]'::jsonb, 2, 'よみます (yomimasu) means "to read". Reading books every day is まいにちほんをよみます.', 'よみます (ইয়োমিমাসু) মানে "পড়া"। প্রতিদিন বই পড়া হলো まいにちほんをよみます।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'vocab_usage', 'medium'::difficulty_level, 'verbs', 'vocab_usage', 'high'::frequency_tier, 'おんがくを＿＿ます。(I ___ to music.)', '["はなし", "きき", "みき", "あそび"]'::jsonb, 1, 'ききます (kikimasu) means "to listen". Listening to music is おんがくをききます.', 'ききます (কিকিমাসু) মানে "শোনা"। গান শোনা হলো おんがくをききます।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'kana_recognition', 'medium'::difficulty_level, 'numbers', 'kana_recognition', 'high'::frequency_tier, '「九」のよみかたはどれですか。Which is a correct reading of 九?', '["く", "ろく", "いち", "じゅう"]'::jsonb, 0, '九 can be read as きゅう (kyuu) or く (ku) and means "nine" (9).', '九 এর উচ্চারণ きゅう (কিউউ) বা く (কু) এবং এর অর্থ "নয়" (৯)।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'word_meaning', 'medium'::difficulty_level, 'greetings', 'word_meaning', 'high'::frequency_tier, 'ごはんをたべるまえに日本人はなんと言いますか。What do Japanese people say before eating?', '["さようなら", "おやすみ", "いただきます", "すみません"]'::jsonb, 2, 'いただきます (itadakimasu) is said before eating a meal. It expresses gratitude for the food.', 'いただきます (ইতাদাকিমাসু) খাওয়ার আগে বলা হয়। এটি খাবারের প্রতি কৃতজ্ঞতা প্রকাশ করে।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'vocab'::section_type, 'vocab_usage', 'hard'::difficulty_level, 'verbs', 'vocab_usage', 'medium'::frequency_tier, 'にほんごを＿＿ことができます。(I can ___ Japanese.)', '["はなす", "たべる", "のむ", "あそぶ"]'::jsonb, 0, 'はなす (hanasu) means "to speak". にほんごをはなすことができます means "I can speak Japanese".', 'はなす (হানাসু) মানে "কথা বলা"। にほんごをはなすことができます মানে "আমি জাপানি ভাষায় কথা বলতে পারি"।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'particle_usage', 'easy'::difficulty_level, 'particles', 'particle', 'high'::frequency_tier, 'がっこう＿＿いきます。(I go ___ school.)', '["を", "に", "が", "は"]'::jsonb, 1, 'The particle に (ni) is used to indicate the destination of movement. がっこうにいきます means "I go to school".', 'に (নি) কণাটি গতির গন্তব্য নির্দেশ করতে ব্যবহৃত হয়। がっこうにいきます মানে "আমি স্কুলে যাই"।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'particle_usage', 'easy'::difficulty_level, 'particles', 'particle', 'high'::frequency_tier, 'みず＿＿のみます。(I drink ___ water.)', '["に", "が", "を", "は"]'::jsonb, 2, 'The particle を (wo) marks the direct object of a verb. みずをのみます means "I drink water".', 'を (ও) কণাটি ক্রিয়ার প্রত্যক্ষ কর্ম চিহ্নিত করে। みずをのみます মানে "আমি পানি পান করি"।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'particle_usage', 'easy'::difficulty_level, 'particles', 'particle', 'high'::frequency_tier, 'わたし＿＿がくせいです。(I ___ a student.)', '["を", "に", "が", "は"]'::jsonb, 3, 'The particle は (wa) marks the topic of a sentence. わたしはがくせいです means "I am a student".', 'は (ওয়া) কণাটি বাক্যের বিষয় চিহ্নিত করে। わたしはがくせいです মানে "আমি একজন ছাত্র"।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'verb_conjugation', 'medium'::difficulty_level, 'verb_forms', 'verb_form', 'high'::frequency_tier, '「たべる」のますけいはなんですか。What is the masu-form of たべる?', '["たべます", "たべります", "たべれます", "たべいます"]'::jsonb, 0, 'たべる is an ichidan (ru-verb). To make the masu-form, drop る and add ます: たべ + ます = たべます.', 'たべる একটি ইচিদান (রু-ক্রিয়া)। মাসু-রূপ তৈরি করতে る বাদ দিয়ে ます যোগ করুন: たべ + ます = たべます।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'verb_conjugation', 'medium'::difficulty_level, 'verb_forms', 'verb_form', 'high'::frequency_tier, '「のむ」のますけいはなんですか。What is the masu-form of のむ?', '["のます", "のむます", "のみます", "のめます"]'::jsonb, 2, 'のむ is a godan (u-verb). To make the masu-form, change む to み and add ます: のみます.', 'のむ একটি গোদান (উ-ক্রিয়া)। মাসু-রূপ তৈরি করতে む কে み তে পরিবর্তন করে ます যোগ করুন: のみます।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'sentence_pattern', 'medium'::difficulty_level, 'sentence_structure', 'sentence_completion', 'high'::frequency_tier, 'きのうテレビを＿＿。(I ___ TV yesterday.)', '["みます", "みました", "みません", "みています"]'::jsonb, 1, 'Since きのう (yesterday) indicates past tense, the correct form is みました (mimashita) - past polite form.', 'যেহেতু きのう (গতকাল) অতীতকাল নির্দেশ করে, সঠিক রূপ হলো みました (মিমাশিতা) - অতীত ভদ্র রূপ।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'particle_usage', 'medium'::difficulty_level, 'particles', 'particle', 'high'::frequency_tier, 'こうえん＿＿あそびます。(I play ___ the park.)', '["を", "に", "で", "は"]'::jsonb, 2, 'The particle で (de) indicates the location where an action takes place. こうえんであそびます means "I play at the park".', 'で (দে) কণাটি কোনো কাজ যেখানে সংঘটিত হয় সেই স্থান নির্দেশ করে। こうえんであそびます মানে "আমি পার্কে খেলি"।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'sentence_pattern', 'medium'::difficulty_level, 'sentence_structure', 'sentence_completion', 'medium'::frequency_tier, 'あした友だち＿＿えいがをみます。(I will watch a movie ___ my friend tomorrow.)', '["を", "に", "と", "が"]'::jsonb, 2, 'The particle と (to) means "with" when used between people. 友だちとえいがをみます means "I watch a movie with my friend".', 'と (তো) কণাটি মানুষের মধ্যে "সাথে" বোঝাতে ব্যবহৃত হয়। 友だちとえいがをみます মানে "বন্ধুর সাথে সিনেমা দেখি"।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'verb_conjugation', 'hard'::difficulty_level, 'verb_forms', 'verb_form', 'medium'::frequency_tier, '「いく」のてけいはなんですか。What is the te-form of いく?', '["いいて", "いって", "いくて", "いきて"]'::jsonb, 1, 'いく is an irregular case for te-form. Instead of the regular いいて, it becomes いって (itte).', 'いく তে-রূপের জন্য একটি অনিয়মিত ক্রিয়া। নিয়মিত いいて এর পরিবর্তে, এটি いって (ইত্তে) হয়।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'grammar_reading'::section_type, 'sentence_pattern', 'hard'::difficulty_level, 'negative_forms', 'verb_form', 'medium'::frequency_tier, 'きょうはなにも＿＿。(I did not ___ anything today.)', '["たべました", "たべます", "たべませんでした", "たべません"]'::jsonb, 2, 'なにも requires a negative verb form. The past negative polite form is たべませんでした (tabemasen deshita) meaning "did not eat".', 'なにも এর পরে নেতিবাচক ক্রিয়ারূপ প্রয়োজন। অতীত নেতিবাচক ভদ্র রূপ হলো たべませんでした (তাবেমাসেন দেশিতা) অর্থাৎ "খাইনি"।', NULL, NULL, NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'easy'::difficulty_level, 'self_introduction', 'listening_gist', 'high'::frequency_tier, 'What is the speaker talking about? (Main topic)', '["Ordering food at a restaurant", "Introducing themselves", "Asking for directions", "Talking about the weather"]'::jsonb, 1, 'The speaker says はじめまして and gives their name and occupation, which is a self-introduction.', 'বক্তা はじめまして বলেন এবং তার নাম ও পেশা জানান, যা একটি আত্মপরিচয়।', NULL, 'はじめまして。わたしはやまだです。がくせいです。よろしくおねがいします。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'easy'::difficulty_level, 'daily_greeting', 'listening_response', 'high'::frequency_tier, 'Someone says こんにちは to you. What is the most natural response?', '["おやすみなさい", "こんにちは", "いただきます", "さようなら"]'::jsonb, 1, 'When someone greets you with こんにちは (hello), the natural response is to say こんにちは back.', 'যখন কেউ আপনাকে こんにちは (হ্যালো) বলে অভিবাদন জানায়, স্বাভাবিক উত্তর হলো こんにちは ফিরিয়ে বলা।', NULL, 'こんにちは。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'easy'::difficulty_level, 'time_expression', 'listening_detail', 'high'::frequency_tier, 'What time does the speaker wake up?', '["5 o''clock", "6 o''clock", "7 o''clock", "8 o''clock"]'::jsonb, 2, 'The speaker says まいあさ七じにおきます, meaning "I wake up at 7 o''clock every morning".', 'বক্তা বলেন まいあさ七じにおきます, অর্থাৎ "আমি প্রতিদিন সকাল ৭টায় উঠি"।', NULL, 'わたしはまいあさ七じにおきます。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'medium'::difficulty_level, 'daily_routine', 'listening_detail', 'high'::frequency_tier, 'What does the speaker do at school?', '["Plays sports", "Studies Japanese", "Reads books", "Watches TV"]'::jsonb, 1, 'The speaker says がっこうでにほんごをべんきょうします, meaning "I study Japanese at school".', 'বক্তা বলেন がっこうでにほんごをべんきょうします, অর্থাৎ "আমি স্কুলে জাপানি ভাষা পড়ি"।', NULL, 'まいにちがっこうにいきます。がっこうでにほんごをべんきょうします。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'medium'::difficulty_level, 'food_and_drink', 'listening_detail', 'high'::frequency_tier, 'What does the speaker eat for breakfast?', '["Rice and miso soup", "Bread and milk", "Rice and fish", "Bread and coffee"]'::jsonb, 0, 'The speaker says あさごはんにごはんとみそしるをたべます, meaning "I eat rice and miso soup for breakfast".', 'বক্তা বলেন あさごはんにごはんとみそしるをたべます, অর্থাৎ "আমি সকালের খাবারে ভাত ও মিসো স্যুপ খাই"।', NULL, 'あさごはんにごはんとみそしるをたべます。おいしいです。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'medium'::difficulty_level, 'weekend_plans', 'listening_gist', 'high'::frequency_tier, 'What is the main topic of the conversation?', '["Homework", "Weekend plans", "Yesterday''s dinner", "A new book"]'::jsonb, 1, 'The conversation discusses what the speakers will do on the weekend (どようびに), making weekend plans the main topic.', 'কথোপকথনে আলোচনা হয় সপ্তাহান্তে (どようびに) বক্তারা কী করবেন, তাই সপ্তাহান্তের পরিকল্পনা মূল বিষয়।', NULL, 'A: どようびになにをしますか。B: ともだちとこうえんにいきます。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'medium'::difficulty_level, 'shopping', 'listening_detail', 'medium'::frequency_tier, 'How much does the book cost?', '["500 yen", "800 yen", "1000 yen", "1500 yen"]'::jsonb, 1, 'The speaker says このほんは八百えんです, meaning "This book is 800 yen".', 'বক্তা বলেন このほんは八百えんです, অর্থাৎ "এই বইটির দাম ৮০০ ইয়েন"।', NULL, 'すみません、このほんはいくらですか。このほんは八百えんです。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'medium'::difficulty_level, 'daily_routine', 'listening_sequence', 'medium'::frequency_tier, 'What does the speaker do first after waking up?', '["Eat breakfast", "Brush teeth", "Go to school", "Watch TV"]'::jsonb, 1, 'The speaker describes their routine: wake up, then brush teeth (はをみがきます), then eat breakfast.', 'বক্তা তার দৈনন্দিন রুটিন বর্ণনা করেন: ঘুম থেকে ওঠা, তারপর দাঁত মাজা (はをみがきます), তারপর সকালের খাবার।', NULL, 'まいあさ六じにおきます。まず、はをみがきます。それから、あさごはんをたべます。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'hard'::difficulty_level, 'directions', 'listening_detail', 'medium'::frequency_tier, 'Where is the post office?', '["Next to the bank", "In front of the station", "Behind the school", "Next to the hospital"]'::jsonb, 0, 'The speaker says ゆうびんきょくはぎんこうのとなりです, meaning "The post office is next to the bank".', 'বক্তা বলেন ゆうびんきょくはぎんこうのとなりです, অর্থাৎ "পোস্ট অফিস ব্যাংকের পাশে"।', NULL, 'すみません、ゆうびんきょくはどこですか。ゆうびんきょくはぎんこうのとなりです。', NULL, 'authored'::source_type, true);

INSERT INTO questions (id, section, subtype, difficulty, topic, skill_tag, frequency_tier, question_text, options, correct_answer, explanation_en, explanation_bn, audio_url, audio_script, distractor_logic, source_type, validated)
VALUES (gen_random_uuid(), 'listening'::section_type, 'listening_comprehension', 'hard'::difficulty_level, 'travel_plans', 'listening_sequence', 'medium'::frequency_tier, 'What will the speaker do after arriving in Tokyo?', '["Go to a hotel", "Meet a friend", "Eat sushi", "Visit a temple"]'::jsonb, 2, 'The speaker says とうきょうについたら、まずおすしをたべます, meaning "After arriving in Tokyo, first I will eat sushi".', 'বক্তা বলেন とうきょうについたら、まずおすしをたべます, অর্থাৎ "টোকিওতে পৌঁছানোর পর, প্রথমে সুশি খাব"।', NULL, 'らいしゅうとうきょうにいきます。とうきょうについたら、まずおすしをたべます。それから、ともだちにあいます。', NULL, 'authored'::source_type, true);

--- Create profiles for existing auth users ---

INSERT INTO user_profiles (id, name, onboarded, streak, pass_probability)
SELECT id, COALESCE(raw_user_meta_data->>'name', 'User'), false, 0, 0
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
