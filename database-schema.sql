-- ============================================
-- GeoRise Database Schema
-- Generated: 2025-01-20
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
-- TABLES
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

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
-- RLS is enabled on all tables with appropriate policies
