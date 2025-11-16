create view public.ai_engine_weights_latest as
select distinct on (engine_key)
  engine_key,
  engine_query,
  trend_value,
  weight,
  created_at
from public.ai_engine_weights
order by engine_key, created_at desc;