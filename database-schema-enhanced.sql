-- ============================================
-- GEORISE COMPLETE DATABASE SCHEMA
-- Enhanced with N8N Integration
-- Date: 2025-11-09
-- ============================================
-- This schema includes:
-- 1. Original Lovable Cloud schema
-- 2. N8N workflow integration (analysis_runs table)
-- 3. All indexes, functions, and RLS policies
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE app_role AS ENUM ('user', 'admin');

-- ============================================
-- CORE TABLES
-- ============================================

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  plan TEXT NOT NULL DEFAULT 'free',
  tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: brands
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  visibility_score INTEGER NOT NULL DEFAULT 0,
  last_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- ============================================
-- N8N INTEGRATION: Analysis Runs Tracking
-- ============================================

-- Table: analysis_runs (NEW - for N8N workflow tracking)
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT UNIQUE NOT NULL,
  brand_id UUID NOT NULL,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_queries INTEGER DEFAULT 20,
  queries_completed INTEGER DEFAULT 0,
  visibility_score NUMERIC(5, 2),
  total_mentions INTEGER DEFAULT 0,
  mention_rate NUMERIC(5, 2),
  citation_count INTEGER DEFAULT 0,
  top_position_count INTEGER DEFAULT 0,
  avg_position NUMERIC(3, 1),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table: analyses (ENHANCED for N8N)
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  run_id TEXT NOT NULL, -- Changed from UUID to TEXT for N8N compatibility
  ai_engine TEXT NOT NULL CHECK (ai_engine IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'bing')),
  query TEXT NOT NULL,
  position INTEGER CHECK (position >= 1 AND position <= 10),
  mention_type TEXT CHECK (mention_type IN ('name_only', 'citation', 'attribution')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  url TEXT,
  -- NEW COLUMNS FOR N8N INTEGRATION:
  mentioned BOOLEAN DEFAULT false,
  query_index INTEGER,
  context TEXT,
  full_response TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: competitors
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  competitor_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: insights
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  run_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('optimization_tip', 'gap', 'alert', 'quick_win')),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: coach_conversations
CREATE TABLE IF NOT EXISTS public.coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id UUID PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  stripe_customer_id TEXT,
  active_until TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: rate_limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id BIGSERIAL PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  last_run TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Brands indexes
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Analysis runs indexes (N8N)
CREATE INDEX IF NOT EXISTS idx_analysis_runs_run_id ON public.analysis_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_brand_id ON public.analysis_runs(brand_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_user_id ON public.analysis_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_status ON public.analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_created_at ON public.analysis_runs(created_at DESC);

-- Analyses indexes
CREATE INDEX IF NOT EXISTS idx_analyses_brand_id ON public.analyses(brand_id);
CREATE INDEX IF NOT EXISTS idx_analyses_run_id ON public.analyses(run_id);
CREATE INDEX IF NOT EXISTS idx_analyses_ai_engine ON public.analyses(ai_engine);
CREATE INDEX IF NOT EXISTS idx_analyses_mentioned ON public.analyses(mentioned);
CREATE INDEX IF NOT EXISTS idx_analyses_query_index ON public.analyses(query_index);

-- Competitors indexes
CREATE INDEX IF NOT EXISTS idx_competitors_brand_id ON public.competitors(brand_id);

-- Insights indexes
CREATE INDEX IF NOT EXISTS idx_insights_brand_id ON public.insights(brand_id);
CREATE INDEX IF NOT EXISTS idx_insights_run_id ON public.insights(run_id);

-- Coach conversations indexes
CREATE INDEX IF NOT EXISTS idx_coach_conversations_brand_id ON public.coach_conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_id ON public.coach_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_created_at ON public.coach_conversations(created_at DESC);

-- Rate limits indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_hash ON public.rate_limits(ip_hash);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, plan)
  VALUES (
    new.id,
    new.email,
    'user',
    'free'
  );

  -- Add default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '';

-- Function: get_user_plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_uuid UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT plan FROM public.profiles WHERE id = user_uuid;
$$;

-- Function: can_add_brand
CREATE OR REPLACE FUNCTION public.can_add_brand(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Function: get_analysis_progress (N8N polling)
CREATE OR REPLACE FUNCTION public.get_analysis_progress(p_run_id TEXT)
RETURNS TABLE (
  run_id TEXT,
  status TEXT,
  progress INTEGER,
  queries_completed INTEGER,
  total_queries INTEGER,
  visibility_score NUMERIC,
  total_mentions INTEGER,
  error_message TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ar.run_id,
    ar.status,
    ar.progress,
    ar.queries_completed,
    ar.total_queries,
    ar.visibility_score,
    ar.total_mentions,
    ar.error_message
  FROM analysis_runs ar
  WHERE ar.run_id = p_run_id;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: update_updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_updated_at on brands
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_updated_at on analysis_runs (N8N)
CREATE TRIGGER update_analysis_runs_updated_at
  BEFORE UPDATE ON public.analysis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for brands
CREATE POLICY "Users can view their own brands"
  ON public.brands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brands"
  ON public.brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands"
  ON public.brands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands"
  ON public.brands FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for analysis_runs (N8N)
CREATE POLICY "Users can view their own analysis runs"
  ON public.analysis_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis runs"
  ON public.analysis_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis runs"
  ON public.analysis_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all analysis runs"
  ON public.analysis_runs FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for analyses
CREATE POLICY "Users can view analyses for their brands"
  ON public.analyses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = analyses.brand_id
      AND brands.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage all analyses"
  ON public.analyses FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for competitors
CREATE POLICY "Users can view competitors for their brands"
  ON public.competitors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = competitors.brand_id
      AND brands.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert competitors for their brands"
  ON public.competitors FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = competitors.brand_id
      AND brands.user_id = auth.uid()
  ));

CREATE POLICY "Users can update competitors for their brands"
  ON public.competitors FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = competitors.brand_id
      AND brands.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete competitors for their brands"
  ON public.competitors FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = competitors.brand_id
      AND brands.user_id = auth.uid()
  ));

-- Policies for insights
CREATE POLICY "Users can view insights for their brands"
  ON public.insights FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = insights.brand_id
      AND brands.user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage all insights"
  ON public.insights FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for coach_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.coach_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON public.coach_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- VIEWS FOR FRONTEND QUERIES
-- ============================================

-- View: Latest analysis for each brand
CREATE OR REPLACE VIEW public.latest_brand_analyses AS
SELECT DISTINCT ON (brand_id)
  id,
  run_id,
  brand_id,
  brand_name,
  topic,
  status,
  visibility_score,
  total_mentions,
  mention_rate,
  created_at,
  completed_at
FROM public.analysis_runs
ORDER BY brand_id, created_at DESC;

-- View: Analysis run summary with query details
CREATE OR REPLACE VIEW public.analysis_run_summary AS
SELECT
  ar.id,
  ar.run_id,
  ar.brand_id,
  ar.brand_name,
  ar.topic,
  ar.status,
  ar.progress,
  ar.total_queries,
  ar.queries_completed,
  ar.visibility_score,
  ar.total_mentions,
  ar.mention_rate,
  ar.citation_count,
  ar.top_position_count,
  ar.avg_position,
  ar.created_at,
  ar.updated_at,
  ar.completed_at,
  COUNT(a.id) as actual_results_count,
  SUM(CASE WHEN a.mentioned = true THEN 1 ELSE 0 END) as actual_mentions_count
FROM public.analysis_runs ar
LEFT JOIN public.analyses a ON a.run_id = ar.run_id
GROUP BY ar.id, ar.run_id, ar.brand_id, ar.brand_name, ar.topic, ar.status,
         ar.progress, ar.total_queries, ar.queries_completed, ar.visibility_score,
         ar.total_mentions, ar.mention_rate, ar.citation_count, ar.top_position_count,
         ar.avg_position, ar.created_at, ar.updated_at, ar.completed_at;

-- Grant permissions to authenticated users
GRANT SELECT ON public.latest_brand_analyses TO authenticated;
GRANT SELECT ON public.analysis_run_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analysis_progress(TEXT) TO authenticated;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.analysis_runs IS 'Tracks each GEO visibility analysis run with status and aggregate results (N8N integration)';
COMMENT ON COLUMN public.analysis_runs.run_id IS 'Unique identifier for the analysis run, generated by n8n workflow';
COMMENT ON COLUMN public.analysis_runs.status IS 'Current status: pending (queued), processing (running), completed (success), failed (error)';
COMMENT ON COLUMN public.analysis_runs.progress IS 'Progress percentage from 0-100';
COMMENT ON COLUMN public.analysis_runs.visibility_score IS 'Calculated GEO visibility score (0-100)';
COMMENT ON FUNCTION public.get_analysis_progress(TEXT) IS 'Poll function for webapp to check analysis status by run_id';

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this schema file (you can do it now!)
-- 2. Then run database-dump.sql to import existing data
-- 3. Create auth.users via Supabase dashboard Auth section
-- 4. Update .env with your new Supabase credentials
-- ============================================
