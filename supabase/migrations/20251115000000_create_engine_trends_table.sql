-- Migration: Create engine_trends table for AI engine popularity tracking
-- Created: 2025-11-15
-- Purpose: Store daily weights from Google Trends for AI engine scoring

-- Create engine_trends table to track daily trend weights
CREATE TABLE IF NOT EXISTS public.engine_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  chatgpt_weight numeric(10, 8) NOT NULL CHECK (chatgpt_weight >= 0 AND chatgpt_weight <= 1),
  claude_weight numeric(10, 8) NOT NULL CHECK (claude_weight >= 0 AND claude_weight <= 1),
  gemini_weight numeric(10, 8) NOT NULL CHECK (gemini_weight >= 0 AND gemini_weight <= 1),
  kimi_weight numeric(10, 8) NOT NULL CHECK (kimi_weight >= 0 AND kimi_weight <= 1),
  perplexity_weight numeric(10, 8) NOT NULL CHECK (perplexity_weight >= 0 AND perplexity_weight <= 1),
  chatgpt_raw_value integer DEFAULT 0,
  claude_raw_value integer DEFAULT 0,
  gemini_raw_value integer DEFAULT 0,
  kimi_raw_value integer DEFAULT 0,
  perplexity_raw_value integer DEFAULT 0,
  total_value integer DEFAULT 0,
  data_points integer DEFAULT 0,
  source text NOT NULL DEFAULT 'google_trends_api',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_weights_sum CHECK (
    chatgpt_weight + claude_weight + gemini_weight + kimi_weight + perplexity_weight <= 1.01
    AND chatgpt_weight + claude_weight + gemini_weight + kimi_weight + perplexity_weight >= 0.99
  )
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_engine_trends_timestamp ON public.engine_trends(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_engine_trends_created_at ON public.engine_trends(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_engine_trends_source ON public.engine_trends(source);

-- Create unique index to prevent duplicate entries for the same timestamp
CREATE UNIQUE INDEX IF NOT EXISTS idx_engine_trends_unique_timestamp
  ON public.engine_trends(DATE(timestamp), source);

-- Function to get the latest engine weights
CREATE OR REPLACE FUNCTION public.get_latest_engine_weights()
RETURNS TABLE (
  engine text,
  weight numeric,
  raw_value integer,
  timestamp timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest AS (
    SELECT *
    FROM engine_trends
    ORDER BY timestamp DESC
    LIMIT 1
  )
  SELECT 'chatgpt'::text, chatgpt_weight, chatgpt_raw_value, timestamp FROM latest
  UNION ALL
  SELECT 'claude'::text, claude_weight, claude_raw_value, timestamp FROM latest
  UNION ALL
  SELECT 'gemini'::text, gemini_weight, gemini_raw_value, timestamp FROM latest
  UNION ALL
  SELECT 'kimi'::text, kimi_weight, kimi_raw_value, timestamp FROM latest
  UNION ALL
  SELECT 'perplexity'::text, perplexity_weight, perplexity_raw_value, timestamp FROM latest;
$$;

-- Function to get engine weight by name and optional date
CREATE OR REPLACE FUNCTION public.get_engine_weight(
  p_engine text,
  p_date timestamptz DEFAULT NOW()
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weight numeric;
BEGIN
  SELECT
    CASE LOWER(p_engine)
      WHEN 'chatgpt' THEN chatgpt_weight
      WHEN 'claude' THEN claude_weight
      WHEN 'gemini' THEN gemini_weight
      WHEN 'kimi' THEN kimi_weight
      WHEN 'perplexity' THEN perplexity_weight
      ELSE 0
    END INTO v_weight
  FROM engine_trends
  WHERE timestamp <= p_date
  ORDER BY timestamp DESC
  LIMIT 1;

  RETURN COALESCE(v_weight, 0);
END;
$$;

-- View: Engine trend history (last 30 days)
CREATE OR REPLACE VIEW public.engine_trends_30d AS
SELECT
  timestamp,
  chatgpt_weight,
  claude_weight,
  gemini_weight,
  kimi_weight,
  perplexity_weight,
  total_value,
  created_at
FROM public.engine_trends
WHERE timestamp >= NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;

-- Grant permissions to authenticated users (read-only)
GRANT SELECT ON public.engine_trends TO authenticated;
GRANT SELECT ON public.engine_trends_30d TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_engine_weights() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_engine_weight(text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_engine_weight(text) TO authenticated;

-- Grant insert/update to service role (for n8n workflows)
GRANT INSERT, UPDATE ON public.engine_trends TO service_role;

-- Comments for documentation
COMMENT ON TABLE public.engine_trends IS 'Stores daily Google Trends weights for AI engines used in GEO scoring calculation';
COMMENT ON COLUMN public.engine_trends.timestamp IS 'Timestamp of the trend data from Google Trends';
COMMENT ON COLUMN public.engine_trends.chatgpt_weight IS 'Normalized weight for ChatGPT (0-1), used in scoring calculation';
COMMENT ON COLUMN public.engine_trends.claude_weight IS 'Normalized weight for Claude (0-1), used in scoring calculation';
COMMENT ON COLUMN public.engine_trends.gemini_weight IS 'Normalized weight for Gemini (0-1), used in scoring calculation';
COMMENT ON COLUMN public.engine_trends.kimi_weight IS 'Normalized weight for Kimi (0-1), used in scoring calculation';
COMMENT ON COLUMN public.engine_trends.perplexity_weight IS 'Normalized weight for Perplexity (0-1), used in scoring calculation';
COMMENT ON COLUMN public.engine_trends.chatgpt_raw_value IS 'Raw trend value from Google Trends for ChatGPT';
COMMENT ON COLUMN public.engine_trends.source IS 'Data source identifier (e.g., google_trends_api)';
COMMENT ON FUNCTION public.get_latest_engine_weights() IS 'Returns the most recent engine weights in a pivoted format';
COMMENT ON FUNCTION public.get_engine_weight(text, timestamptz) IS 'Get weight for a specific engine at a specific date (or latest if date not provided)';
