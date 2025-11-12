# GEORISE Scheduler Setup Guide

## Overview

The GEORISE Scheduler automates GEO visibility analyses across multiple AI engines for monitored brands. It respects tier limits (Free: weekly, Pro/Business: daily) and handles errors robustly.

## Architecture

```
Scheduler Workflow (runs hourly)
  ↓
Query monitoring_configs_due (brands+topics due to run)
  ↓
For each config:
  For each enabled AI engine:
    1. Create analysis_run record
    2. Execute appropriate Processor workflow (WAIT for completion)
    3. Update next_run_at timestamp
  ↓
Aggregate results
  ↓
If errors: Send email notification to michael@zelbel.de
```

## Components

### 1. Database Schema (`20251112000000_create_monitoring_configs.sql`)

**Tables:**
- `monitoring_configs`: Defines what to monitor (brand+topic+engines+schedule)
- `analysis_runs`: Extended with `ai_engine`, `retry_count`, `monitoring_config_id`

**Key Fields:**
- `enabled_engines`: Array of engines to test (e.g., `['perplexity', 'chatgpt', 'claude']`)
- `frequency`: `'weekly'` (Free) or `'daily'` (Pro/Business)
- `next_run_at`: When the next analysis should run
- `active`: Toggle to enable/disable monitoring

**Views:**
- `monitoring_configs_due`: Scheduler queries this for configs that need to run now

**Functions:**
- `can_create_monitoring_config()`: Enforces tier limits (1/3/10 brands)
- `calculate_next_run_at()`: Computes next run based on frequency

### 2. Scheduler Workflow (`GEORISE_Scheduler.json`)

**Triggers:**
- Cron: Every hour (checks for due configs)
- Manual: For testing

**Flow:**
1. **Initialize Stats**: Track successes/errors across entire run
2. **Get Configs Due**: Query `monitoring_configs_due` view
3. **Loop Through Configs**: Process each brand+topic sequentially
4. **Expand Engines**: Each config → multiple runs (one per enabled engine)
5. **Create Run Record**: Insert into `analysis_runs` table
6. **Execute Processor**: Call engine-specific workflow with `waitForCompletion: true`
7. **Handle Success**: Increment counter, update `next_run_at`
8. **Handle Failure**: Log error, mark run as failed, retry 3x with 5s delay
9. **Aggregate Results**: Collect all successes/failures
10. **Send Email**: If any errors, email michael@zelbel.de with details

**Error Handling:**
- `continueOnFail: true` on all critical nodes
- `retryOnFail: true` with 3 attempts on Processor execution
- Errors accumulate in array throughout workflow
- Failed runs marked in database with error message
- Email sent only if errors occurred

**Sequential Processing:**
- `waitForCompletion: true` ensures Brand 2 waits for Brand 1 to finish
- Respects Perplexity rate limits (2s between queries within each analysis)
- No parallel execution = no rate limit violations

### 3. Processor Workflows

**Current:**
- `GEORISE Analysis Processor` (Perplexity)

**Future:**
- `GEORISE_Processor_chatgpt`
- `GEORISE_Processor_claude`
- `GEORISE_Processor_gemini`

Each processor:
- Receives: `runId`, `brandId`, `brandName`, `topic`, `userId`
- Executes: 20 queries with 2s rate limiting
- Stores: Results in `analyses` table
- Updates: `analysis_runs` with scores and completion status

## Deployment Steps

### Step 1: Database Migration

Execute in Lovable Supabase SQL Editor:

```bash
# Run the migration
cat supabase/migrations/20251112000000_create_monitoring_configs.sql
```

Copy the contents and run in SQL Editor.

**Verify:**
```sql
SELECT * FROM monitoring_configs LIMIT 1;
SELECT * FROM monitoring_configs_due;
```

### Step 2: Import Scheduler Workflow

1. Open n8n: Your Coolify n8n instance
2. Click "Import from File"
3. Select: `n8n/workflows/GEORISE_Scheduler.json`
4. Configure credentials:
   - Supabase: Use existing "Lovable Supabase" credential
   - Gmail: Create new OAuth credential for michael@zelbel.de

### Step 3: Gmail OAuth Setup

1. n8n → Credentials → New Credential → Gmail OAuth2
2. Follow prompts to authorize michael@zelbel.de
3. Test by clicking "Test Credential"
4. Assign credential ID `gmail_oauth` (or update workflow JSON)

### Step 4: Test Manually

Create a test monitoring config:

```sql
INSERT INTO monitoring_configs (
  brand_id,
  user_id,
  topic,
  enabled_engines,
  frequency,
  active,
  next_run_at
)
SELECT
  id as brand_id,
  user_id,
  'AI automation' as topic,
  ARRAY['perplexity'] as enabled_engines,
  'daily' as frequency,
  true as active,
  now() as next_run_at
FROM brands
LIMIT 1;
```

**Run Scheduler:**
1. Open "GEORISE Scheduler" workflow
2. Click "Execute Workflow" (uses Manual Trigger)
3. Watch execution flow
4. Verify:
   - `analysis_runs` has new record
   - Processor workflow was triggered
   - `next_run_at` updated to tomorrow

### Step 5: Activate Scheduler

1. In "GEORISE Scheduler" workflow
2. Toggle "Active" to ON
3. Scheduler now runs every hour automatically
4. Check executions in n8n dashboard

## Monitoring Configs Management

### Create Config (User Action in Frontend)

Users configure monitoring in the web app:

```typescript
// Frontend would call Supabase to insert:
const { data } = await supabase
  .from('monitoring_configs')
  .insert({
    brand_id: selectedBrand.id,
    user_id: user.id,
    topic: 'AI automation',
    enabled_engines: ['perplexity'], // User selects which engines
    frequency: userPlan === 'free' ? 'weekly' : 'daily',
    active: true,
    next_run_at: new Date()
  });
```

### View Configs (User Dashboard)

```sql
SELECT
  mc.id,
  b.name as brand_name,
  mc.topic,
  mc.enabled_engines,
  mc.frequency,
  mc.last_run_at,
  mc.next_run_at,
  mc.active
FROM monitoring_configs mc
JOIN brands b ON b.id = mc.brand_id
WHERE mc.user_id = auth.uid()
ORDER BY mc.next_run_at ASC;
```

### Disable Config

```sql
UPDATE monitoring_configs
SET active = false
WHERE id = '<config_id>' AND user_id = auth.uid();
```

## Tier Limits Enforcement

**Free Plan:**
- 1 brand max (enforced by `can_create_monitoring_config()`)
- Weekly analyses (168 hours between runs)
- 20 queries per analysis

**Pro Plan:**
- 3 brands max
- Daily analyses (24 hours between runs)
- 20 queries per analysis (can be increased)

**Business Plan:**
- 10 brands max
- Daily analyses (24 hours between runs)
- 20 queries per analysis (can be increased)

Limits enforced:
1. **Database level**: `can_create_monitoring_config()` function
2. **Scheduler level**: Reads `user_plan` and sets `next_run_at` accordingly
3. **Frontend level**: UI prevents creating more configs than plan allows

## Adding New AI Engines

### Option A: Separate Processor Per Engine

1. Duplicate `GEORISE_Analysis_Processor_v2.json`
2. Rename to `GEORISE_Processor_chatgpt.json`
3. Replace "Call Perplexity" node with "OpenAI Chat" node
4. Update credentials
5. Import into n8n
6. Scheduler will auto-detect by engine name

### Option B: Use OpenRouter for All Engines

1. Create OpenRouter account → Get API key
2. Modify Processor to use HTTP Request node
3. Set model parameter: `perplexity/sonar`, `openai/gpt-4`, `anthropic/claude-3.5-sonnet`
4. Single processor handles all engines via parameter

**Recommended: Option B (OpenRouter)**
- Single API key for all models
- Simpler credential management
- Easier to add new engines
- Cost tracking in one place

Example OpenRouter HTTP Request:

```javascript
// Node: Call AI via OpenRouter
{
  "method": "POST",
  "url": "https://openrouter.ai/api/v1/chat/completions",
  "headers": {
    "Authorization": "Bearer {{ $credentials.openRouterApi.apiKey }}",
    "Content-Type": "application/json"
  },
  "body": {
    "model": "={{ $json.ai_engine === 'perplexity' ? 'perplexity/sonar' : $json.ai_engine === 'chatgpt' ? 'openai/gpt-4' : 'anthropic/claude-3.5-sonnet' }}",
    "messages": [
      {
        "role": "user",
        "content": "={{ $json.query }}"
      }
    ]
  }
}
```

## Error Handling Details

### Retry Logic

**Processor Execution:**
- Retries: 3 attempts
- Delay: 5 seconds between attempts
- Applies to: Network failures, API rate limits

**Database Operations:**
- `continueOnFail: true` on all Supabase nodes
- Errors logged but don't stop workflow

### Email Notifications

Sent to: michael@zelbel.de

**Trigger:** Any errors during scheduler run

**Content:**
```
Subject: ⚠️ GEORISE Scheduler: 2 Failed Analyses

Body:
GEORISE Scheduler Run Failed
=============================

Run Summary:
- Started: 2025-11-12T01:00:00.000Z
- Completed: 2025-11-12T01:15:23.000Z
- Total Runs: 5
- Successful: 3
- Failed: 2

Errors:
1. Brand: Lovable
   Topic: AI automation
   Engine: perplexity
   Error: Rate limit exceeded
   Time: 2025-11-12T01:05:12.000Z

2. Brand: Acme Corp
   Topic: no-code tools
   Engine: chatgpt
   Error: API key invalid
   Time: 2025-11-12T01:10:45.000Z
```

## Troubleshooting

### Scheduler not running analyses

1. Check `monitoring_configs_due` view: `SELECT * FROM monitoring_configs_due;`
   - If empty, no configs are due
2. Check `next_run_at` in configs: Should be <= now()
3. Check scheduler workflow is active in n8n
4. Check scheduler executions in n8n for errors

### Processor fails immediately

1. Check Processor workflow credentials (Perplexity API)
2. Check Supabase credential (service_role key)
3. Test Processor manually with test data
4. Check database has required tables/columns

### Email not sent

1. Check Gmail OAuth credential is valid
2. Re-authorize if token expired
3. Check "Send Error Email" node in execution log
4. Verify email address: michael@zelbel.de

### Database errors

1. Verify migration ran successfully:
   ```sql
   SELECT * FROM monitoring_configs LIMIT 1;
   SELECT * FROM analysis_runs WHERE ai_engine IS NOT NULL LIMIT 1;
   ```
2. Check RLS policies allow service_role access
3. Verify service_role key is used in n8n credential

## Future Enhancements

1. **Multi-Engine Support:**
   - Add ChatGPT, Claude, Gemini processors
   - Or migrate to single OpenRouter-based processor

2. **Dynamic Query Templates:**
   - Store query templates in database
   - Let users customize queries per brand

3. **Advanced Scheduling:**
   - Custom schedules per config (e.g., Mon/Wed/Fri only)
   - Time-of-day preferences

4. **Notifications:**
   - In-app notifications when analysis completes
   - Email digest with visibility scores
   - Slack/Discord webhooks

5. **Rate Limit Optimization:**
   - Parallel execution within rate limits
   - Smart batching across brands

6. **Analytics:**
   - Track scheduler performance metrics
   - Cost per analysis (API usage)
   - Success/failure rates by engine

## Support

Issues with scheduler:
1. Check n8n execution logs
2. Check database `analysis_runs` table for errors
3. Email notifications should alert you to failures
4. Manual test via "Manual Trigger for Testing"

Questions: michael@zelbel.de
