create table public.ai_engine_weights (
  id uuid primary key default gen_random_uuid(),
  engine_key text not null,        -- e.g. 'chatgpt', 'claude', 'perplexity'
  engine_query text not null,      -- e.g. 'chatgpt', 'claude ai', 'perplexity ai'
  trend_value numeric not null,    -- e.g. 51, 64, 30
  weight numeric not null,         -- e.g. 0.3517
  created_at timestamptz not null default now()
);

-- Helpful index for "latest per engine" queries
create index ai_engine_weights_engine_created_idx
  on public.ai_engine_weights (engine_key, created_at desc);