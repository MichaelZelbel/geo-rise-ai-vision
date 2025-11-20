-- Add individual competitor columns to brands table
ALTER TABLE brands 
ADD COLUMN competitor_1 text DEFAULT 'Auto',
ADD COLUMN competitor_2 text DEFAULT 'Auto',
ADD COLUMN competitor_3 text DEFAULT 'Auto';

-- Add competitor_data JSONB to analysis_runs table
ALTER TABLE analysis_runs 
ADD COLUMN competitor_data jsonb;