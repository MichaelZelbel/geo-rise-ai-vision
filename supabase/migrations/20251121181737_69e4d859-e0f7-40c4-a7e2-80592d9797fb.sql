-- Add 9 competitor columns to analysis_runs table for flattened competitor intelligence data
-- This replaces the separate competitors table with embedded fields in analysis_runs

ALTER TABLE analysis_runs
ADD COLUMN IF NOT EXISTS competitor_1_name text,
ADD COLUMN IF NOT EXISTS competitor_1_score integer,
ADD COLUMN IF NOT EXISTS competitor_1_gap text,
ADD COLUMN IF NOT EXISTS competitor_2_name text,
ADD COLUMN IF NOT EXISTS competitor_2_score integer,
ADD COLUMN IF NOT EXISTS competitor_2_gap text,
ADD COLUMN IF NOT EXISTS competitor_3_name text,
ADD COLUMN IF NOT EXISTS competitor_3_score integer,
ADD COLUMN IF NOT EXISTS competitor_3_gap text;

-- Drop the old competitors table as we're now using flattened structure
DROP TABLE IF EXISTS competitors;

-- Add comment explaining the new structure
COMMENT ON COLUMN analysis_runs.competitor_1_name IS 'Top competitor name (flattened from competitors table)';
COMMENT ON COLUMN analysis_runs.competitor_1_score IS 'Top competitor visibility score';
COMMENT ON COLUMN analysis_runs.competitor_1_gap IS 'Gap analysis for top competitor';