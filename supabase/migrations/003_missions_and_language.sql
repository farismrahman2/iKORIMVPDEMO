-- iKORI — Mission tracking + Language preference
-- ================================================

--- Daily Mission Progress ---

CREATE TABLE public.daily_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mission_type TEXT NOT NULL,
  mission_label TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  completed_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mission_date, mission_type)
);

ALTER TABLE daily_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_missions ON daily_mission_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_missions_user_date ON daily_mission_progress(user_id, mission_date);

--- Language preference ---

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'bn'));
