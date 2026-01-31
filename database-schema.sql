-- ============================================
-- GeoRise Database Schema
-- Generated: 2025-01-20
-- Updated: 2025-01-31 (AI Credits System)
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE app_role AS ENUM ('user', 'admin');

-- ============================================
-- TABLES
-- ============================================

-- ============================================
-- AI CREDITS SYSTEM
-- ============================================
-- 
-- ARCHITECTURE: Tokens as Source of Truth
-- ----------------------------------------
-- The AI credits system uses TOKENS as the single source of truth.
-- Credits are NEVER stored in the database - they are always calculated
-- dynamically from tokens using the formula:
--
--   credits = tokens / tokens_per_credit
--
-- This design allows:
-- - Instant policy changes (adjust tokens_per_credit, affects all users)
-- - Precise usage tracking (tokens match LLM API responses exactly)
-- - Simple audit trail (llm_usage_events logs raw token counts)
-- - Flexible display (UI can show credits, tokens, or both)
--
-- TOKEN-TO-CREDIT CONVERSION
-- --------------------------
-- The conversion rate is stored in ai_credit_settings.tokens_per_credit
-- Changing this value immediately affects ALL users' displayed credits.
-- Historical records in llm_usage_events store credits_charged at the
-- time of the event for audit purposes.
--
-- ROLLOVER LOGIC
-- --------------
-- Unused tokens roll over to the next period, capped at the plan's
-- monthly allowance. Example: Pro plan gets 300,000 tokens/month.
-- If user has 50,000 remaining, they roll over 50,000 (not exceeding cap).
--
-- PERIOD INITIALIZATION
-- ---------------------
-- A daily cron job (00:05 UTC) calls ensure-token-allowance with batch_init
-- to pre-create periods for all users. This ensures:
-- - No lazy initialization delays on the 1st of the month
-- - Rollover calculations happen automatically
-- - Users always have a current period ready
-- ============================================

-- AI Credit Settings Table
-- Configuration values for the AI credits system.
-- These are global settings that affect all users.
CREATE TABLE public.ai_credit_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value_int INTEGER NOT NULL,
  description TEXT
);

-- Default values:
-- INSERT INTO ai_credit_settings (key, value_int, description) VALUES
--   ('tokens_per_credit', 200, 'Number of tokens that equal 1 credit. Changing this affects all users immediately.'),
--   ('credits_free_per_month', 0, 'Monthly credits for free plan users'),
--   ('credits_pro_per_month', 1500, 'Monthly credits for Pro plan users'),
--   ('credits_business_per_month', 5000, 'Monthly credits for Business plan users');

-- AI Allowance Periods Table
-- Tracks token grants and usage per user per billing period.
-- This is the SOURCE OF TRUTH for user balances.
-- Credits are calculated: (tokens_granted - tokens_used) / tokens_per_credit
CREATE TABLE public.ai_allowance_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tokens_granted BIGINT NOT NULL DEFAULT 0,     -- Total tokens available this period (base + rollover)
  tokens_used BIGINT NOT NULL DEFAULT 0,        -- Tokens consumed by AI operations
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT,                                   -- 'free_tier', 'subscription', 'top_up', 'admin_grant'
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,   -- Contains: base_tokens, rollover_tokens, plan, credits_granted
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- LLM Usage Events Table
-- Immutable audit ledger for all LLM API calls.
-- Used for billing reconciliation, debugging, and usage analytics.
CREATE TABLE public.llm_usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,          -- Prevents duplicate charges: {feature}_{userId}_{timestamp}
  feature TEXT,                                   -- 'chat_coach', 'analysis', 'admin_balance_adjustment'
  model TEXT,                                     -- 'google/gemini-2.5-flash', 'gpt-4', etc.
  provider TEXT,                                  -- 'lovable', 'openai', 'anthropic'
  prompt_tokens BIGINT NOT NULL DEFAULT 0,
  completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  credits_charged NUMERIC NOT NULL DEFAULT 0,    -- Snapshot at time of event for historical reference
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,   -- Feature-specific data (brand_id, admin_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================
-- AI CREDITS VIEWS
-- ============================================

-- v_ai_allowance_current View
-- Provides real-time credit calculations for the current period.
-- All credit values are CALCULATED, never stored.
-- 
-- Columns:
--   id, user_id           - Period identification
--   tokens_granted        - Total tokens available this period
--   tokens_used           - Tokens consumed
--   remaining_tokens      - tokens_granted - tokens_used
--   tokens_per_credit     - Current conversion rate from settings
--   credits_granted       - tokens_granted / tokens_per_credit
--   credits_used          - tokens_used / tokens_per_credit
--   remaining_credits     - remaining_tokens / tokens_per_credit
--   period_start/end      - Billing period boundaries
--   source, metadata      - Grant source and details
--   created_at, updated_at
--
-- CREATE VIEW v_ai_allowance_current AS
-- SELECT 
--   ap.*,
--   ap.tokens_granted - ap.tokens_used AS remaining_tokens,
--   (SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit') AS tokens_per_credit,
--   ap.tokens_granted::numeric / NULLIF((SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'), 0) AS credits_granted,
--   ap.tokens_used::numeric / NULLIF((SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'), 0) AS credits_used,
--   (ap.tokens_granted - ap.tokens_used)::numeric / NULLIF((SELECT value_int FROM ai_credit_settings WHERE key = 'tokens_per_credit'), 0) AS remaining_credits
-- FROM ai_allowance_periods ap
-- WHERE now() >= ap.period_start AND now() < ap.period_end;

-- ============================================
-- AI CREDITS INDEXES
-- ============================================

CREATE INDEX idx_ai_allowance_periods_user_id ON public.ai_allowance_periods (user_id);
CREATE INDEX idx_ai_allowance_periods_period ON public.ai_allowance_periods (period_start, period_end);
CREATE INDEX idx_ai_allowance_periods_current ON public.ai_allowance_periods (user_id, period_start, period_end);
CREATE INDEX idx_llm_usage_events_user_id ON public.llm_usage_events (user_id);
CREATE INDEX idx_llm_usage_events_created_at ON public.llm_usage_events (created_at DESC);
CREATE INDEX idx_llm_usage_events_feature ON public.llm_usage_events (feature);
CREATE INDEX idx_llm_usage_events_idempotency ON public.llm_usage_events (idempotency_key);

-- ============================================
-- AI CREDITS CRON JOB
-- ============================================
-- Daily job at 00:05 UTC to pre-initialize allowance periods
-- This ensures all users have their new period ready on the 1st
-- and rollover calculations happen automatically.
--
-- SELECT cron.schedule(
--   'daily-token-allowance-reset',
--   '5 0 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/ensure-token-allowance',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer <service-role-key>"}'::jsonb,
--     body := '{"batch_init": true}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- ============================================
-- CORE TABLES
-- ============================================

-- AI Engine Weights Table
CREATE TABLE public.ai_engine_weights (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  engine_key TEXT NOT NULL,
  engine_query TEXT NOT NULL,
  trend_value NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Analyses Table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  run_id TEXT NOT NULL DEFAULT gen_random_uuid(),
  ai_engine TEXT NOT NULL,
  query TEXT NOT NULL,
  position INTEGER,
  sentiment TEXT,
  mention_type TEXT,
  url TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mentioned BOOLEAN DEFAULT false,
  query_index INTEGER,
  context TEXT,
  full_response TEXT,
  question_type TEXT,
  question_weight INTEGER,
  points_earned INTEGER DEFAULT 0,
  PRIMARY KEY (id)
);

-- Analysis Runs Table
CREATE TABLE public.analysis_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL,
  brand_id UUID NOT NULL,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  total_queries INTEGER DEFAULT 20,
  queries_completed INTEGER DEFAULT 0,
  visibility_score NUMERIC,
  total_mentions INTEGER DEFAULT 0,
  mention_rate NUMERIC,
  citation_count INTEGER DEFAULT 0,
  top_position_count INTEGER DEFAULT 0,
  avg_position NUMERIC,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  ai_engine TEXT DEFAULT 'perplexity'::text,
  retry_count INTEGER DEFAULT 0,
  monitoring_config_id UUID,
  completion_percentage INTEGER DEFAULT 0,
  competitor_data JSONB,
  competitor_1_name TEXT,
  competitor_1_score INTEGER,
  competitor_1_gap TEXT,
  competitor_2_name TEXT,
  competitor_2_score INTEGER,
  competitor_2_gap TEXT,
  competitor_3_name TEXT,
  competitor_3_score INTEGER,
  competitor_3_gap TEXT,
  PRIMARY KEY (id),
  UNIQUE (run_id)
);

-- Brands Table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  topic TEXT NOT NULL,
  visibility_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_run TIMESTAMP WITH TIME ZONE,
  competitor_1 TEXT DEFAULT 'Auto'::text,
  competitor_2 TEXT DEFAULT 'Auto'::text,
  competitor_3 TEXT DEFAULT 'Auto'::text,
  PRIMARY KEY (id)
);

-- Coach Conversations Table
CREATE TABLE public.coach_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Competitors Table
CREATE TABLE public.competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  competitor_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Insights Table
CREATE TABLE public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  run_id UUID,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Monitoring Configs Table
CREATE TABLE public.monitoring_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  enabled_engines TEXT[] NOT NULL DEFAULT ARRAY['perplexity'::text],
  frequency TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user'::app_role,
  plan TEXT NOT NULL DEFAULT 'free'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  PRIMARY KEY (id)
);

-- Rate Limits Table
CREATE TABLE public.rate_limits (
  id BIGINT NOT NULL DEFAULT nextval('rate_limits_id_seq'::regclass),
  ip_hash TEXT NOT NULL,
  user_agent TEXT,
  last_run TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Subscriptions Table
CREATE TABLE public.subscriptions (
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free'::text,
  active_until TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- User Roles Table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE (user_id, role)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX ai_engine_weights_engine_created_idx ON public.ai_engine_weights (engine_key, created_at DESC);
CREATE INDEX idx_analyses_ai_engine ON public.analyses (ai_engine);
CREATE INDEX idx_analyses_brand_id ON public.analyses (brand_id);
CREATE INDEX idx_analyses_mentioned ON public.analyses (mentioned);
CREATE INDEX idx_analyses_query_index ON public.analyses (query_index);
CREATE INDEX idx_analyses_question_type ON public.analyses (question_type);
CREATE INDEX idx_analyses_run_id ON public.analyses (run_id);
CREATE INDEX idx_analysis_runs_ai_engine ON public.analysis_runs (ai_engine);
CREATE INDEX idx_analysis_runs_brand_id ON public.analysis_runs (brand_id);
CREATE INDEX idx_analysis_runs_created_at ON public.analysis_runs (created_at DESC);
CREATE INDEX idx_analysis_runs_monitoring_config ON public.analysis_runs (monitoring_config_id);
CREATE INDEX idx_analysis_runs_run_id ON public.analysis_runs (run_id);
CREATE INDEX idx_analysis_runs_status ON public.analysis_runs (status);
CREATE INDEX idx_analysis_runs_user_id ON public.analysis_runs (user_id);
CREATE INDEX idx_brands_user_id ON public.brands (user_id);
CREATE INDEX idx_coach_conversations_brand_id ON public.coach_conversations (brand_id);
CREATE INDEX idx_coach_conversations_created_at ON public.coach_conversations (created_at DESC);
CREATE INDEX idx_competitors_brand_id ON public.competitors (brand_id);
CREATE INDEX idx_insights_brand_id ON public.insights (brand_id);
CREATE INDEX idx_monitoring_configs_active ON public.monitoring_configs (active);
CREATE INDEX idx_monitoring_configs_brand_active ON public.monitoring_configs (brand_id, active);
CREATE INDEX idx_monitoring_configs_brand_id ON public.monitoring_configs (brand_id);
CREATE INDEX idx_monitoring_configs_next_run ON public.monitoring_configs (next_run_at);
CREATE INDEX idx_monitoring_configs_user_id ON public.monitoring_configs (user_id);
CREATE INDEX unique_brand_topic ON public.monitoring_configs (brand_id, topic);
CREATE INDEX idx_rate_limits_ip_hash ON public.rate_limits (ip_hash);

-- ============================================
-- FUNCTIONS (see database for full definitions)
-- ============================================
-- calculate_next_run_at(text)
-- can_add_brand(uuid)
-- can_create_monitoring_config(uuid, uuid)
-- get_analysis_progress(text)
-- get_user_plan(uuid)
-- handle_new_user()
-- has_role(uuid, app_role)
-- update_analysis_runs_updated_at()
-- update_monitoring_configs_updated_at()
-- update_monitoring_next_run()
-- update_updated_at_column()

-- ============================================
-- VIEWS
-- ============================================
-- ai_engine_weights_latest
-- analysis_run_summary
-- latest_brand_analyses
-- monitoring_configs_due
-- v_ai_allowance_current (AI Credits - see above)

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- RLS is enabled on all tables with appropriate policies
