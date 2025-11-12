-- Change run_id from UUID to TEXT in analyses table
-- Need to drop dependent view first, then recreate it

-- Drop the view that depends on the run_id column
DROP VIEW IF EXISTS public.analysis_run_summary;

-- Change run_id from UUID to TEXT
ALTER TABLE public.analyses 
  ALTER COLUMN run_id TYPE text;

-- Recreate the view with the updated column type
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
GRANT SELECT ON public.analysis_run_summary TO authenticated;