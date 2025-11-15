-- Add weighted scoring fields to analyses table
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS question_type text,
  ADD COLUMN IF NOT EXISTS question_weight integer,
  ADD COLUMN IF NOT EXISTS points_earned integer DEFAULT 0;

-- Add index for filtering by question type
CREATE INDEX IF NOT EXISTS idx_analyses_question_type ON public.analyses(question_type);

-- Add comment for documentation
COMMENT ON COLUMN public.analyses.question_type IS 'Type of question: leader, newcomer, wide_net, direct_awareness';
COMMENT ON COLUMN public.analyses.question_weight IS 'Points available for this question (10, 5, 2, or 1)';
COMMENT ON COLUMN public.analyses.points_earned IS 'Points earned: question_weight if mentioned, 0 otherwise';