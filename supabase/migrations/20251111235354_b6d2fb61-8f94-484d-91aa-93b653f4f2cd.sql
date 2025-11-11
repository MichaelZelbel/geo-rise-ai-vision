-- Migration: Create analysis_runs table and extend analyses table for n8n workflows
-- Created: 2025-11-08
-- Purpose: Support async analysis workflow pattern with run tracking

-- Drop existing analysis_runs table if it exists (from previous migration)
DROP TABLE IF EXISTS public.analysis_runs CASCADE;

-- 1. Create analysis_runs table to track each analysis job
CREATE TABLE public.analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text UNIQUE NOT NULL,
  brand_id uuid NOT NULL,
  user_id uuid NOT NULL,
  brand_name text NOT NULL,
  topic text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_queries integer DEFAULT 20,
  queries_completed integer DEFAULT 0,
  visibility_score numeric(5, 2),
  total_mentions integer DEFAULT 0,
  mention_rate numeric(5, 2),
  citation_count integer DEFAULT 0,
  top_position_count integer DEFAULT 0,
  avg_position numeric(3, 1),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT fk_analysis_runs_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE,
  CONSTRAINT fk_analysis_runs_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX idx_analysis_runs_run_id ON public.analysis_runs(run_id);
CREATE INDEX idx_analysis_runs_brand_id ON public.analysis_runs(brand_id);
CREATE INDEX idx_analysis_runs_user_id ON public.analysis_runs(user_id);
CREATE INDEX idx_analysis_runs_status ON public.analysis_runs(status);
CREATE INDEX idx_analysis_runs_created_at ON public.analysis_runs(created_at DESC);

-- 2. Extend existing analyses table with fields needed by n8n workflows
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS mentioned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS query_index integer,
  ADD COLUMN IF NOT EXISTS context text,
  ADD COLUMN IF NOT EXISTS full_response text;

-- Add indexes for faster lookups on analyses
CREATE INDEX IF NOT EXISTS idx_analyses_run_id ON public.analyses(run_id);
CREATE INDEX IF NOT EXISTS idx_analyses_mentioned ON public.analyses(mentioned);
CREATE INDEX IF NOT EXISTS idx_analyses_query_index ON public.analyses(query_index);

-- 3. Enable Row Level Security on analysis_runs
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analysis_runs
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

-- 4. Update trigger for updated_at on analysis_runs
CREATE OR REPLACE FUNCTION public.update_analysis_runs_updated_at()
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

CREATE TRIGGER update_analysis_runs_updated_at
  BEFORE UPDATE ON public.analysis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_analysis_runs_updated_at();

-- 5. Create useful views for frontend queries

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
LEFT JOIN public.analyses a ON a.run_id::text = ar.run_id
GROUP BY ar.id, ar.run_id, ar.brand_id, ar.brand_name, ar.topic, ar.status,
         ar.progress, ar.total_queries, ar.queries_completed, ar.visibility_score,
         ar.total_mentions, ar.mention_rate, ar.citation_count, ar.top_position_count,
         ar.avg_position, ar.created_at, ar.updated_at, ar.completed_at;

-- 6. Helper function to get analysis progress (for polling)
CREATE OR REPLACE FUNCTION public.get_analysis_progress(p_run_id text)
RETURNS TABLE (
  run_id text,
  status text,
  progress integer,
  queries_completed integer,
  total_queries integer,
  visibility_score numeric,
  total_mentions integer,
  error_message text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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

-- Grant permissions to authenticated users
GRANT SELECT ON public.latest_brand_analyses TO authenticated;
GRANT SELECT ON public.analysis_run_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analysis_progress(text) TO authenticated;

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_runs;

-- Comments for documentation
COMMENT ON TABLE public.analysis_runs IS 'Tracks each GEO visibility analysis run with status and aggregate results';
COMMENT ON COLUMN public.analysis_runs.run_id IS 'Unique identifier for the analysis run, generated by n8n workflow';
COMMENT ON COLUMN public.analysis_runs.status IS 'Current status: pending (queued), processing (running), completed (success), failed (error)';
COMMENT ON COLUMN public.analysis_runs.progress IS 'Progress percentage from 0-100';
COMMENT ON COLUMN public.analysis_runs.visibility_score IS 'Calculated GEO visibility score (0-100)';
COMMENT ON FUNCTION public.get_analysis_progress(text) IS 'Poll function for webapp to check analysis status by run_id';