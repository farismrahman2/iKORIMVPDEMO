-- iKORI Admin Panel — Additional Tables
-- =======================================

--- Content Import Log ---

CREATE TABLE public.content_import_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('vocabulary', 'questions')),
  items_imported INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  items_errored INTEGER DEFAULT 0,
  imported_by UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- Audio Generation Log ---

CREATE TABLE public.audio_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  audio_script TEXT NOT NULL,
  speaker TEXT NOT NULL,
  audio_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'uploaded', 'error')),
  error_message TEXT,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

--- Unique index for vocab deduplication on import ---

CREATE UNIQUE INDEX idx_vocabulary_word_kana ON vocabulary(word, kana);

--- Row Level Security (service-role only) ---

ALTER TABLE content_import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_generation_log ENABLE ROW LEVEL SECURITY;
