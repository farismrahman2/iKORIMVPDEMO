-- iKORI — User Journey: Access Tiers, Subscriptions, Trial, Referral, Support
-- ============================================================================

-- ═══ Access Tiers ═══
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free'
  CHECK (tier IN ('anonymous', 'free', 'paid'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS acquisition_source JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS churn_risk BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak_freeze_used BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS streak_freeze_date DATE;

-- ═══ Subscriptions ═══
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'exam_prep')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'payment_failed', 'refunded')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_method TEXT DEFAULT 'bypass' CHECK (payment_method IN ('bkash', 'ssl', 'bypass')),
  amount_bdt INTEGER,
  is_refundable BOOLEAN DEFAULT TRUE,
  refunded_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_subs ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- ═══ Freemium Session Tracking ═══
CREATE TABLE IF NOT EXISTS public.freemium_session_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, module, week_start_date)
);

ALTER TABLE freemium_session_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_freemium ON freemium_session_counts FOR ALL USING (auth.uid() = user_id);

-- ═══ Trial Events (anonymous) ═══
CREATE TABLE IF NOT EXISTS public.trial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  readiness_band TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ Referral Events ═══
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES user_profiles(id),
  referred_id UUID REFERENCES user_profiles(id),
  converted_to_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ Support Tickets ═══
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own_tickets ON support_tickets FOR ALL USING (auth.uid() = user_id);

-- ═══ Retention Offers ═══
CREATE TABLE IF NOT EXISTS public.retention_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  offer_type TEXT NOT NULL,
  discount_pct INTEGER DEFAULT 50,
  valid_until TIMESTAMPTZ,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ Landing Page Config ═══
CREATE TABLE IF NOT EXISTS public.landing_page_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO landing_page_config (key, value) VALUES
  ('hero_headline', 'Pass JLPT N5 — or your money back.'),
  ('hero_subhead', 'Diagnostic-driven, Bangla-explained, built for Bangladeshi learners.'),
  ('cta_text', 'Try 10 free questions →'),
  ('pricing_monthly', '499'),
  ('pricing_exam_prep', '999'),
  ('pass_rate_stat', '87% of learners improve within 30 days'),
  ('testimonial_1_name', 'Rahim K.'),
  ('testimonial_1_text', 'The diagnostic told me exactly what to focus on. Passed N5 on my first try.'),
  ('testimonial_1_band', 'strong'),
  ('testimonial_2_name', 'Nusrat A.'),
  ('testimonial_2_text', 'Bangla explanations made everything click. Way better than YouTube.'),
  ('testimonial_2_band', 'probable'),
  ('testimonial_3_name', 'Kamal H.'),
  ('testimonial_3_text', 'The listening module with transcript unlock is genius. My weakest section became my strongest.'),
  ('testimonial_3_band', 'strong')
ON CONFLICT (key) DO NOTHING;

-- ═══ Notification Queue ═══
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  type TEXT NOT NULL,
  channel TEXT DEFAULT 'log',
  message TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ Generate referral codes for existing users ═══
UPDATE user_profiles SET referral_code = substr(md5(random()::text), 1, 8)
  WHERE referral_code IS NULL;

-- ═══ Trial question flags ═══
ALTER TABLE questions ADD COLUMN IF NOT EXISTS trial BOOLEAN DEFAULT FALSE;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS trial BOOLEAN DEFAULT FALSE;
