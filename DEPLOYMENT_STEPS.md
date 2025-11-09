# GEORISE Database Deployment Guide

Complete step-by-step guide to deploy the enhanced database schema to your self-hosted Supabase instance.

## Prerequisites

- Access to Supabase Dashboard: https://supabase-georise.agentpool.cloud
- Database credentials ready
- Enhanced schema file: `database-schema-enhanced.sql`
- Data dump file: `database-dump.sql`

## Step 1: Execute Enhanced Schema

1. Open your Supabase Dashboard at https://supabase-georise.agentpool.cloud
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `database-schema-enhanced.sql` from this repository
5. Paste into the SQL Editor
6. Click **Run** or press `Ctrl/Cmd + Enter`

**Expected Result:**
```
CREATE EXTENSION
CREATE TYPE
CREATE TABLE (profiles)
CREATE TABLE (brands)
CREATE TABLE (user_roles)
CREATE TABLE (analyses)
CREATE TABLE (competitors)
CREATE TABLE (insights)
CREATE TABLE (coach_conversations)
CREATE TABLE (subscriptions)
CREATE TABLE (rate_limits)
CREATE TABLE (analysis_runs)
...
Success. No rows returned
```

## Step 2: Import Data

1. In the same SQL Editor, open a **New Query**
2. Copy the entire contents of `database-dump.sql`
3. Paste into the SQL Editor
4. Click **Run**

**Expected Result:**
```
INSERT 0 5   (profiles)
INSERT 0 5   (brands)
INSERT 0 6   (user_roles)
INSERT 0 15  (analyses)
INSERT 0 2   (coach_conversations)
```

## Step 3: Verify Tables

Run this verification query:

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Tables:**
- analyses
- analysis_runs
- brands
- coach_conversations
- competitors
- insights
- profiles
- rate_limits
- subscriptions
- user_roles

## Step 4: Verify Data

```sql
-- Check data was imported
SELECT
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM brands) as brands_count,
  (SELECT COUNT(*) FROM user_roles) as user_roles_count,
  (SELECT COUNT(*) FROM analyses) as analyses_count,
  (SELECT COUNT(*) FROM coach_conversations) as coach_conversations_count;
```

**Expected Result:**
```
profiles_count: 5
brands_count: 5
user_roles_count: 6
analyses_count: 15
coach_conversations_count: 2
```

## Step 5: Test N8N Integration Tables

```sql
-- Verify analysis_runs table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'analysis_runs'
ORDER BY ordinal_position;

-- Test get_analysis_progress function
SELECT * FROM get_analysis_progress('test-run-id');
```

## Step 6: Create Auth Users

**Important:** You need to create auth.users records for the 5 test users. Use Supabase Dashboard:

1. Navigate to **Authentication** → **Users**
2. Click **Invite User** for each:

| Email | Password (temporary) | Plan |
|-------|---------------------|------|
| michael@zelbel.de | changeme123 | free |
| fred@free.com | changeme123 | free |
| peter@pro.com | changeme123 | giftedPro |
| benny@business.com | changeme123 | giftedAgency |
| alice@admin.com | changeme123 | giftedPro |

**Note:** The `handle_new_user()` trigger will automatically create corresponding profiles and user_roles entries.

## Step 7: Verify RLS Policies

```sql
-- Check Row Level Security is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;
```

All tables should show RLS enabled except `rate_limits`.

## Step 8: Test Database Connection from N8N

In your n8n instance (https://your-n8n-instance/), test the PostgreSQL connection:

1. Go to **Credentials**
2. Add **Postgres** credential
3. Fill in:
   ```
   Host: supabase-db-vokkcgog8ckogkkgc8o8sswg
   Database: postgres
   User: postgres
   Password: p5MKR3sqIBm4ertk9f1IvE9FnPKeYaF4
   Port: 5432
   ```
4. Click **Test Connection**

## Troubleshooting

### Extension Already Exists
If you see `ERROR: extension "uuid-ossp" already exists`, this is fine. The schema uses `IF NOT EXISTS`.

### Table Already Exists
If tables exist from previous runs, you have two options:

**Option A: Drop and recreate** (DESTRUCTIVE - loses all data)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
-- Then run schema again
```

**Option B: Selective drop** (safer)
```sql
-- Only drop specific tables
DROP TABLE IF EXISTS analysis_runs CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;
-- etc.
```

### Auth Trigger Not Working
The trigger `on_auth_user_created` must be created on `auth.users`:

```sql
-- Run this in SQL Editor
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### RLS Blocking Queries
If you need to bypass RLS for testing:

```sql
-- Disable RLS temporarily (NOT recommended for production)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## Next Steps

After successful deployment:

1. ✅ Database schema deployed
2. ✅ Sample data imported
3. ✅ Auth users created
4. → Deploy N8N workflows (see `/n8n/README.md`)
5. → Update environment variables (see `/INTEGRATION_GUIDE.md`)
6. → Test integration with webapp

## Verification Checklist

- [ ] All 10 tables created
- [ ] 5 profiles imported
- [ ] 5 brands imported
- [ ] 6 user_roles imported
- [ ] 15 analyses imported
- [ ] 2 coach_conversations imported
- [ ] analysis_runs table created (empty)
- [ ] get_analysis_progress function exists
- [ ] latest_brand_analyses view exists
- [ ] analysis_run_summary view exists
- [ ] RLS enabled on all tables
- [ ] 5 auth.users created
- [ ] handle_new_user trigger active
- [ ] N8N can connect to database

---

**Need Help?** Check the troubleshooting section or review the full integration guide in `/INTEGRATION_GUIDE.md`.
