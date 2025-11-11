-- Create analysis_runs table for n8n workflow integration
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL UNIQUE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  queries_completed INTEGER DEFAULT 0,
  total_queries INTEGER DEFAULT 20,
  visibility_score INTEGER,
  total_mentions INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analysis runs"
  ON public.analysis_runs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis runs"
  ON public.analysis_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis runs"
  ON public.analysis_runs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_analysis_runs_run_id ON public.analysis_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_brand_id ON public.analysis_runs(brand_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_user_id ON public.analysis_runs(user_id);

-- Enable realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_runs;