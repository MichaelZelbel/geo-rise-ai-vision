-- Enable RLS on ai_engine_weights table
alter table public.ai_engine_weights enable row level security;

-- Allow service role to manage all data (for backend operations)
create policy "Service role can manage all engine weights"
  on public.ai_engine_weights
  for all
  to service_role
  using (true)
  with check (true);

-- Allow authenticated users to view engine weights (read-only for users)
create policy "Authenticated users can view engine weights"
  on public.ai_engine_weights
  for select
  to authenticated
  using (true);