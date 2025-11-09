-- ============================================
-- GEORISE DATABASE SCHEMA
-- Complete schema export for migration
-- Date: 2025-11-09
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE app_role AS ENUM ('user', 'admin');

-- ============================================
-- TABLES
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: analyses
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL,
  run_id UUID NOT NULL DEFAULT gen_random_uuid(),
  ai_engine TEXT NOT NULL,
  query TEXT NOT NULL,
  position INTEGER,
  mention_type TEXT,
  sentiment TEXT,
  url TEXT,
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
  run_id UUID,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: coach_conversations
CREATE TABLE IF NOT EXISTS public.coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_id UUID NOT NULL,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id UUID PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free',
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: handle_new_user on auth.users
-- Note: This should be created on auth.users table
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

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

-- Policies for analyses
CREATE POLICY "Users can view analyses for their brands"
  ON public.analyses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.brands
    WHERE brands.id = analyses.brand_id
      AND brands.user_id = auth.uid()
  ));

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
-- NOTES
-- ============================================
-- After running this schema:
-- 1. Create auth.users records using Supabase dashboard or auth API
-- 2. The handle_new_user trigger will auto-create profiles and user_roles
-- 3. Then run database-dump.sql to import the data
-- 4. Update your .env file with new Supabase credentials
-- ============================================
