-- ============================================
-- GEORISE DATABASE VERIFICATION SCRIPT
-- Run this after deploying schema and data
-- ============================================

\echo '=== STEP 1: Verify Tables Exist ==='
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''
\echo '=== STEP 2: Verify Data Counts ==='
SELECT
  'profiles' as table_name,
  COUNT(*) as row_count
FROM profiles
UNION ALL
SELECT 'brands', COUNT(*) FROM brands
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles
UNION ALL
SELECT 'analyses', COUNT(*) FROM analyses
UNION ALL
SELECT 'competitors', COUNT(*) FROM competitors
UNION ALL
SELECT 'insights', COUNT(*) FROM insights
UNION ALL
SELECT 'coach_conversations', COUNT(*) FROM coach_conversations
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'rate_limits', COUNT(*) FROM rate_limits
UNION ALL
SELECT 'analysis_runs', COUNT(*) FROM analysis_runs
ORDER BY table_name;

\echo ''
\echo '=== STEP 3: Verify Functions ==='
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_updated_at_column',
    'has_role',
    'handle_new_user',
    'get_user_plan',
    'can_add_brand',
    'get_analysis_progress'
  )
ORDER BY routine_name;

\echo ''
\echo '=== STEP 4: Verify Views ==='
SELECT
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('latest_brand_analyses', 'analysis_run_summary')
ORDER BY table_name;

\echo ''
\echo '=== STEP 5: Verify RLS Policies ==='
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN qual IS NOT NULL THEN 'USING clause defined'
    WHEN with_check IS NOT NULL THEN 'WITH CHECK clause defined'
    ELSE 'No restrictions'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo '=== STEP 6: Verify RLS is Enabled ==='
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '=== STEP 7: Verify Indexes ==='
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''
\echo '=== STEP 8: Verify Triggers ==='
SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation as trigger_event,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '=== STEP 9: Sample Data Check ==='
SELECT
  'Profiles' as data_type,
  email,
  role,
  plan
FROM profiles
ORDER BY created_at
LIMIT 5;

\echo ''
SELECT
  'Brands' as data_type,
  name,
  topic,
  visibility_score,
  last_run
FROM brands
ORDER BY created_at
LIMIT 5;

\echo ''
SELECT
  'User Roles' as data_type,
  user_id,
  role
FROM user_roles
ORDER BY created_at
LIMIT 6;

\echo ''
\echo '=== STEP 10: Test N8N Integration ==='
-- Test analysis_runs table columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'analysis_runs'
ORDER BY ordinal_position;

\echo ''
-- Test analyses table new columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'analyses'
  AND column_name IN ('mentioned', 'query_index', 'context', 'full_response')
ORDER BY ordinal_position;

\echo ''
\echo '=== STEP 11: Test Helper Functions ==='
-- Test get_analysis_progress with non-existent run
SELECT * FROM get_analysis_progress('test-run-id-does-not-exist');

\echo ''
-- Test has_role function
SELECT has_role(
  (SELECT id FROM profiles LIMIT 1),
  'user'::app_role
) as user_has_user_role;

\echo ''
-- Test can_add_brand function
SELECT
  p.email,
  p.plan,
  can_add_brand(p.id) as can_add_brand,
  (SELECT COUNT(*) FROM brands WHERE user_id = p.id) as current_brands
FROM profiles p
ORDER BY p.created_at;

\echo ''
\echo '=== VERIFICATION COMPLETE ==='
\echo 'Expected Results:'
\echo '  - 10 tables (profiles, brands, user_roles, analyses, competitors, insights, coach_conversations, subscriptions, rate_limits, analysis_runs)'
\echo '  - 6 functions (update_updated_at_column, has_role, handle_new_user, get_user_plan, can_add_brand, get_analysis_progress)'
\echo '  - 2 views (latest_brand_analyses, analysis_run_summary)'
\echo '  - 18+ RLS policies across all tables'
\echo '  - RLS enabled on 9 tables (all except rate_limits)'
\echo '  - 5 profiles, 5 brands, 6 user_roles, 15 analyses, 2 coach_conversations'
\echo ''
\echo 'Next Steps:'
\echo '  1. Create auth.users records (see DEPLOYMENT_STEPS.md Step 6)'
\echo '  2. Deploy N8N workflows (see n8n/README.md)'
\echo '  3. Update environment variables (see INTEGRATION_GUIDE.md)'
\echo '  4. Test integration (see INTEGRATION_GUIDE.md Usage Examples)'
