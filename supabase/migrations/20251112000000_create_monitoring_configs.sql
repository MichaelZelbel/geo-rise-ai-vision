-- Migration: Create monitoring_configs table for scheduled analyses
-- Created: 2025-11-12
-- Purpose: Track which brand+topic+engine combinations to monitor automatically

-- 1. Create monitoring_configs table
CREATE TABLE IF NOT EXISTS public.monitoring_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  user_id uuid NOT NULL,
  topic text NOT NULL,
  enabled_engines text[] NOT NULL DEFAULT ARRAY['perplexity'], -- ['perplexity', 'chatgpt', 'claude', 'gemini']
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'daily')),
  active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_monitoring_configs_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE,
  CONSTRAINT fk_monitoring_configs_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_brand_topic UNIQUE(brand_id, topic)
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_brand_id ON public.monitoring_configs(brand_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_user_id ON public.monitoring_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_active ON public.monitoring_configs(active);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_next_run ON public.monitoring_configs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_configs_brand_active ON public.monitoring_configs(brand_id, active);

-- 3. Function to calculate next run time based on frequency
CREATE OR REPLACE FUNCTION public.calculate_next_run_at(p_frequency text)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_frequency = 'daily' THEN now() + interval '24 hours'
    WHEN p_frequency = 'weekly' THEN now() + interval '7 days'
    ELSE now() + interval '24 hours'
  END;
$$;

-- 4. Function to update next_run_at after analysis completes
CREATE OR REPLACE FUNCTION public.update_monitoring_next_run()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_run_at = now();
  NEW.next_run_at = calculate_next_run_at(NEW.frequency);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_monitoring_configs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_monitoring_configs_updated_at
  BEFORE UPDATE ON public.monitoring_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_monitoring_configs_updated_at();

-- 6. Add ai_engine field to analysis_runs if not exists
ALTER TABLE public.analysis_runs
  ADD COLUMN IF NOT EXISTS ai_engine text DEFAULT 'perplexity',
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monitoring_config_id uuid REFERENCES public.monitoring_configs(id) ON DELETE SET NULL;

-- Index for filtering by engine
CREATE INDEX IF NOT EXISTS idx_analysis_runs_ai_engine ON public.analysis_runs(ai_engine);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_monitoring_config ON public.analysis_runs(monitoring_config_id);

-- 7. Enable Row Level Security on monitoring_configs
ALTER TABLE public.monitoring_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monitoring_configs
CREATE POLICY "Users can view their own monitoring configs"
  ON public.monitoring_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monitoring configs"
  ON public.monitoring_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitoring configs"
  ON public.monitoring_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitoring configs"
  ON public.monitoring_configs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all monitoring configs"
  ON public.monitoring_configs FOR ALL
  USING (auth.role() = 'service_role');

-- 8. Function to check if user can create monitoring config (respects tier limits)
CREATE OR REPLACE FUNCTION public.can_create_monitoring_config(p_user_id uuid, p_brand_id uuid)
RETURNS TABLE (
  can_create boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_config_count integer;
  v_brand_limit integer;
  v_brand_count integer;
BEGIN
  -- Get user's plan
  SELECT plan INTO v_plan
  FROM profiles
  WHERE id = p_user_id;

  -- Get current monitoring config count
  SELECT COUNT(*) INTO v_config_count
  FROM monitoring_configs
  WHERE user_id = p_user_id AND active = true;

  -- Get user's active brand count
  SELECT COUNT(*) INTO v_brand_count
  FROM brands
  WHERE user_id = p_user_id;

  -- Determine brand limit based on plan
  v_brand_limit := CASE
    WHEN v_plan = 'free' THEN 1
    WHEN v_plan IN ('pro', 'giftedPro') THEN 3
    WHEN v_plan IN ('business', 'giftedAgency') THEN 10
    ELSE 0
  END;

  -- Check if user can create more configs (should match brand limit)
  IF v_brand_count <= v_brand_limit THEN
    RETURN QUERY SELECT true, 'Can create monitoring config'::text;
  ELSE
    RETURN QUERY SELECT false, format('Plan %s allows maximum %s brands', v_plan, v_brand_limit)::text;
  END IF;
END;
$$;

-- 9. View for scheduler to query configs that need to run
CREATE OR REPLACE VIEW public.monitoring_configs_due AS
SELECT
  mc.id as config_id,
  mc.brand_id,
  mc.user_id,
  mc.topic,
  mc.enabled_engines,
  mc.frequency,
  b.name as brand_name,
  p.plan as user_plan,
  mc.last_run_at,
  mc.next_run_at
FROM public.monitoring_configs mc
JOIN public.brands b ON b.id = mc.brand_id
JOIN public.profiles p ON p.id = mc.user_id
WHERE mc.active = true
  AND mc.next_run_at <= now()
ORDER BY mc.next_run_at ASC;

-- Grant permissions
GRANT SELECT ON public.monitoring_configs_due TO authenticated;
GRANT SELECT ON public.monitoring_configs TO authenticated;
GRANT INSERT ON public.monitoring_configs TO authenticated;
GRANT UPDATE ON public.monitoring_configs TO authenticated;
GRANT DELETE ON public.monitoring_configs TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_monitoring_config(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_next_run_at(text) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.monitoring_configs IS 'Defines which brand+topic+AI engine combinations to monitor automatically';
COMMENT ON COLUMN public.monitoring_configs.enabled_engines IS 'Array of AI engines to test: perplexity, chatgpt, claude, gemini, etc.';
COMMENT ON COLUMN public.monitoring_configs.frequency IS 'How often to run: daily (Pro/Business) or weekly (Free)';
COMMENT ON COLUMN public.monitoring_configs.next_run_at IS 'When the next scheduled analysis should run';
COMMENT ON VIEW public.monitoring_configs_due IS 'View for scheduler workflow to query configs that need to run now';
