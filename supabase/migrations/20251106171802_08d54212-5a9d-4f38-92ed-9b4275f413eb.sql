-- Add tenant_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Add last_run to brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS last_run timestamptz;

-- Create analyses table
CREATE TABLE IF NOT EXISTS public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  run_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ai_engine text NOT NULL CHECK (ai_engine IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'bing')),
  query text NOT NULL,
  position integer CHECK (position >= 1 AND position <= 10),
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  mention_type text CHECK (mention_type IN ('name_only', 'citation', 'attribution')),
  url text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_analyses_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE
);

-- Create competitors table
CREATE TABLE IF NOT EXISTS public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  competitor_name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  delta integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_competitors_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE
);

-- Create insights table
CREATE TABLE IF NOT EXISTS public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL,
  run_id uuid,
  type text NOT NULL CHECK (type IN ('optimization_tip', 'gap', 'alert')),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_insights_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE
);

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id bigserial PRIMARY KEY,
  ip_hash text NOT NULL,
  user_agent text,
  last_run timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id uuid PRIMARY KEY,
  stripe_customer_id text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  active_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on new tables
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analyses table
CREATE POLICY "Users can view analyses for their brands"
  ON public.analyses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = analyses.brand_id
        AND brands.user_id = auth.uid()
    )
  );

-- RLS Policies for competitors table
CREATE POLICY "Users can view competitors for their brands"
  ON public.competitors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = competitors.brand_id
        AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert competitors for their brands"
  ON public.competitors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = competitors.brand_id
        AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update competitors for their brands"
  ON public.competitors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = competitors.brand_id
        AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete competitors for their brands"
  ON public.competitors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = competitors.brand_id
        AND brands.user_id = auth.uid()
    )
  );

-- RLS Policies for insights table
CREATE POLICY "Users can view insights for their brands"
  ON public.insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = insights.brand_id
        AND brands.user_id = auth.uid()
    )
  );

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_brand_id ON public.analyses(brand_id);
CREATE INDEX IF NOT EXISTS idx_analyses_run_id ON public.analyses(run_id);
CREATE INDEX IF NOT EXISTS idx_analyses_ai_engine ON public.analyses(ai_engine);
CREATE INDEX IF NOT EXISTS idx_competitors_brand_id ON public.competitors(brand_id);
CREATE INDEX IF NOT EXISTS idx_insights_brand_id ON public.insights(brand_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_hash ON public.rate_limits(ip_hash);

-- Helper function to get user plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT plan FROM public.profiles WHERE id = user_uuid;
$$;

-- Helper function to check if user can add more brands
CREATE OR REPLACE FUNCTION public.can_add_brand(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan text;
  brand_count integer;
BEGIN
  SELECT plan INTO user_plan FROM public.profiles WHERE id = user_uuid;
  SELECT COUNT(*) INTO brand_count FROM public.brands WHERE user_id = user_uuid;
  
  RETURN CASE
    WHEN user_plan = 'free' THEN brand_count < 1
    WHEN user_plan = 'pro' OR user_plan = 'giftedPro' THEN brand_count < 3
    WHEN user_plan = 'business' OR user_plan = 'giftedAgency' THEN brand_count < 10
    ELSE false
  END;
END;
$$;

-- Create trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();