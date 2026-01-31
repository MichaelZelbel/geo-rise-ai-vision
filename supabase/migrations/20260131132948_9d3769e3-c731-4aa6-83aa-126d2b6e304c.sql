-- ============================================
-- AI Credit System Tables
-- ============================================

-- 1. ai_credit_settings table (global configuration)
CREATE TABLE public.ai_credit_settings (
  key TEXT PRIMARY KEY,
  value_int INTEGER NOT NULL,
  description TEXT
);

-- Insert default settings
INSERT INTO public.ai_credit_settings (key, value_int, description) VALUES
  ('tokens_per_credit', 200, 'Number of LLM tokens that equal one display credit'),
  ('credits_free_per_month', 0, 'Monthly credits for free plan users'),
  ('credits_pro_per_month', 1500, 'Monthly credits for pro/giftedPro plan users'),
  ('credits_business_per_month', 5000, 'Monthly credits for business/giftedAgency plan users');

-- Enable RLS
ALTER TABLE public.ai_credit_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone authenticated can read settings
CREATE POLICY "Anyone can view credit settings"
  ON public.ai_credit_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS: Only admins can update settings
CREATE POLICY "Admins can update credit settings"
  ON public.ai_credit_settings
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. ai_allowance_periods table (user monthly allowances)
CREATE TABLE public.ai_allowance_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tokens_granted BIGINT NOT NULL DEFAULT 0,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  source TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_ai_allowance_periods_user_id ON public.ai_allowance_periods (user_id);
CREATE INDEX idx_ai_allowance_periods_period ON public.ai_allowance_periods (period_start, period_end);
CREATE INDEX idx_ai_allowance_periods_user_current ON public.ai_allowance_periods (user_id, period_start, period_end);

-- Enable RLS
ALTER TABLE public.ai_allowance_periods ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own periods, admins can view all
CREATE POLICY "Users can view their own allowance periods"
  ON public.ai_allowance_periods
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS: Admins can insert periods
CREATE POLICY "Admins can insert allowance periods"
  ON public.ai_allowance_periods
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS: Admins can update periods
CREATE POLICY "Admins can update allowance periods"
  ON public.ai_allowance_periods
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS: Service role can manage all (for edge functions)
CREATE POLICY "Service role can manage all allowance periods"
  ON public.ai_allowance_periods
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_ai_allowance_periods_updated_at
  BEFORE UPDATE ON public.ai_allowance_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. llm_usage_events table (append-only audit ledger)
CREATE TABLE public.llm_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  feature TEXT,
  model TEXT,
  provider TEXT,
  prompt_tokens BIGINT NOT NULL DEFAULT 0,
  completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  credits_charged NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_llm_usage_events_user_id ON public.llm_usage_events (user_id);
CREATE INDEX idx_llm_usage_events_created_at ON public.llm_usage_events (created_at DESC);
CREATE INDEX idx_llm_usage_events_feature ON public.llm_usage_events (feature);
CREATE INDEX idx_llm_usage_events_user_created ON public.llm_usage_events (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.llm_usage_events ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only view their own events, admins can view all
CREATE POLICY "Users can view their own usage events"
  ON public.llm_usage_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- RLS: Service role can insert (for edge functions)
CREATE POLICY "Service role can insert usage events"
  ON public.llm_usage_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- RLS: Service role can manage all
CREATE POLICY "Service role can manage all usage events"
  ON public.llm_usage_events
  FOR ALL
  USING (auth.role() = 'service_role');