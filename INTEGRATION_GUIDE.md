# GEORISE N8N Integration Guide

Complete guide for integrating n8n workflows with the GEORISE webapp for automated GEO (Generative Engine Optimization) visibility analysis.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Deployment](#deployment)
4. [Usage Examples](#usage-examples)
5. [Troubleshooting](#troubleshooting)

## Overview

This integration moves AI visibility analysis from Supabase Edge Functions to n8n workflows, providing:

- ✅ **Better Scalability** - No timeout issues, handles 20+ queries per analysis
- ✅ **Parallel Processing** - Ready to add multiple AI engines (Perplexity, ChatGPT, Claude)
- ✅ **Visual Debugging** - See exactly what's happening in n8n UI
- ✅ **Async Pattern** - Webapp triggers and immediately returns, polls for results
- ✅ **Error Resilience** - Individual query failures don't break the whole analysis

### Architecture

```
React App → N8N Webhook → Async Processing → Supabase → React Polling
```

## Quick Start

### 1. Apply Database Migration

```bash
cd supabase
supabase db push

# Or apply manually in Supabase SQL Editor:
# supabase/migrations/20251108170000_create_analysis_runs_table.sql
```

This creates:
- `analysis_runs` table (tracks analysis jobs)
- Extends `analyses` table with new columns
- Helper functions for polling

### 2. Deploy N8N Workflows

**Option A: N8N Cloud** (Recommended for production)

1. Sign up at [n8n.io/cloud](https://n8n.io/cloud)
2. Import both workflows:
   - `n8n/workflows/GEORISE_Analysis_Starter_v2.json`
   - `n8n/workflows/GEORISE_Analysis_Processor_v2.json`
3. Configure credentials:
   - **Supabase PostgreSQL**: Connection details from Supabase Dashboard
   - **Perplexity API**: API key from Perplexity settings
4. Activate both workflows
5. Copy webhook URL

**Option B: Local Development**

```bash
# Install n8n
npm install -g n8n

# Start n8n
n8n start

# Access at http://localhost:5678
```

See [n8n/README.md](./n8n/README.md) for detailed setup instructions.

### 3. Configure Webapp

Add n8n webhook URL to environment variables:

```env
# .env or .env.local
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/georise-analysis-start
```

For local development:
```env
VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook/georise-analysis-start
```

### 4. Test Integration

```bash
# Start your React app
npm run dev

# Trigger a test analysis from your dashboard
# Monitor progress in real-time
```

## Deployment

### Database Setup

The migration creates these tables and functions:

**Tables:**
- `analysis_runs` - Tracks each analysis job (status, progress, scores)
- `analyses` - Extended with `mentioned`, `query_index`, `context`, `full_response` columns

**Functions:**
- `get_analysis_progress(run_id)` - Helper for polling status

**Views:**
- `latest_brand_analyses` - Most recent analysis for each brand
- `analysis_run_summary` - Analysis runs with aggregate query data

### N8N Credentials

**Supabase PostgreSQL:**
```
Host: db.YOUR_PROJECT_REF.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: (from Supabase Dashboard → Settings → Database)
```

**Perplexity API:**
```
API Key: (from https://www.perplexity.ai/settings/api)
```

### Workflow Configuration

The workflows use the **Config Node Pattern** for easy testing and maintenance:

**Starter Workflow:**
- Manual Trigger: For testing without webhook
- Config Node: Provides default test values
- Webhook Trigger: Production entry point

**Processor Workflow:**
- Manual Trigger: Test with sample data
- Config Node: Constants (BATCH_SIZE, RATE_LIMIT_MS, TOTAL_QUERIES)
- Execute Workflow Trigger: Called by Starter

## Usage Examples

### Basic Integration

```typescript
import { useState } from 'react';
import { RunAnalysisButton } from '@/components/dashboard/RunAnalysisButton';
import { AnalysisProgress } from '@/components/dashboard/AnalysisProgress';

function Dashboard() {
  const [runId, setRunId] = useState<string | null>(null);

  return (
    <div>
      <RunAnalysisButton
        brandId={brand.id}
        brandName={brand.name}
        topic={brand.topic}
        userId={user.id}
        onAnalysisStarted={(runId) => setRunId(runId)}
      />

      {runId && <AnalysisProgress runId={runId} />}
    </div>
  );
}
```

### Manual Trigger (Service Layer)

```typescript
import { triggerAnalysis } from '@/lib/n8nService';
import { toast } from 'sonner';

async function handleStartAnalysis() {
  try {
    const runId = await triggerAnalysis({
      brandId: '123e4567-e89b-12d3-a456-426614174000',
      brandName: 'Nike',
      topic: 'running shoes',
      userId: '123e4567-e89b-12d3-a456-426614174001',
    });

    console.log('Analysis started:', runId);
    toast.success('Analysis started successfully!');
  } catch (error) {
    toast.error('Failed to start analysis');
  }
}
```

### Poll Analysis Status

```typescript
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';

function AnalysisMonitor({ runId }: { runId: string }) {
  const {
    status,
    progress,
    visibilityScore,
    isComplete,
    isRunning,
    error,
  } = useAnalysisStatus(runId);

  if (error) return <Error message={error} />;
  if (isRunning) return <ProgressBar value={progress} />;
  if (isComplete) return <Results score={visibilityScore} />;

  return null;
}
```

### Query Results Directly

```typescript
import { supabase } from '@/integrations/supabase/client';

// Get latest analysis for a brand
const { data: latestRun } = await supabase
  .from('analysis_runs')
  .select('*')
  .eq('brand_id', brandId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// Get all query results for an analysis
const { data: queries } = await supabase
  .from('analyses')
  .select('*')
  .eq('run_id', runId)
  .order('query_index');

// Filter for mentions only
const { data: mentions } = await supabase
  .from('analyses')
  .select('*')
  .eq('run_id', runId)
  .eq('mentioned', true)
  .order('position');
```

## Troubleshooting

### Webhook Returns 404

**Problem:** `POST /webhook/georise-analysis-start` returns 404

**Solutions:**
1. Ensure Starter workflow is **activated** in n8n
2. Check webhook path matches exactly: `georise-analysis-start`
3. Verify n8n is accessible from your webapp
4. Test with curl:
   ```bash
   curl -X POST http://localhost:5678/webhook/georise-analysis-start \
     -H "Content-Type: application/json" \
     -d '{"brandId":"test","brandName":"Test","topic":"testing","userId":"test"}'
   ```

### Analysis Stuck in "Processing"

**Problem:** Status never changes from "processing"

**Solutions:**
1. Check n8n executions for errors
2. View workflow execution logs in n8n UI
3. Manually update status:
   ```sql
   UPDATE analysis_runs
   SET status = 'failed', error_message = 'Manual intervention'
   WHERE run_id = 'YOUR_RUN_ID';
   ```

### Perplexity API Errors

**Problem:** "Rate limit exceeded" or "API key invalid"

**Solutions:**
1. Verify Perplexity API key in n8n credentials
2. Check API quota at https://www.perplexity.ai/settings/api
3. Increase `RATE_LIMIT_MS` in Processor workflow Config node
4. Reduce `TOTAL_QUERIES` for testing

### Database Connection Failed

**Problem:** "Connection to database failed"

**Solutions:**
1. Verify PostgreSQL credentials in n8n
2. Check Supabase database is running
3. Ensure n8n can access Supabase (not blocked by firewall)
4. Test connection in n8n credential settings
5. Use connection pooler URL if needed:
   ```
   Host: aws-0-us-west-1.pooler.supabase.com
   Port: 6543
   ```

### Missing Tables

**Problem:** "relation 'analysis_runs' does not exist"

**Solutions:**
1. Apply database migration:
   ```bash
   cd supabase
   supabase db push
   ```
2. Or run SQL manually in Supabase SQL Editor
3. Verify migration was applied:
   ```sql
   SELECT * FROM analysis_runs LIMIT 1;
   ```

## File Structure

```
geo-rise-ai-vision/
├── n8n/
│   ├── workflows/
│   │   ├── GEORISE_Analysis_Starter_v2.json      # Webhook trigger workflow
│   │   ├── GEORISE_Analysis_Processor_v2.json    # Async processing workflow
│   │   └── (v1 originals)
│   └── README.md                                  # N8N deployment guide
├── supabase/
│   └── migrations/
│       └── 20251108170000_create_analysis_runs_table.sql
├── src/
│   ├── lib/
│   │   └── n8nService.ts                         # Trigger analysis function
│   ├── hooks/
│   │   └── useAnalysisStatus.ts                   # Poll status hook
│   └── components/dashboard/
│       ├── RunAnalysisButton.tsx                  # Trigger button component
│       ├── AnalysisProgress.tsx                   # Progress display component
│       └── AnalysisIntegrationExample.tsx         # Integration example
└── INTEGRATION_GUIDE.md                           # This file
```

## Next Steps

1. **Test locally** - Run workflows with Manual Trigger
2. **Deploy n8n** - Use n8n Cloud or self-host
3. **Update UI** - Integrate components into your dashboard
4. **Add more AIs** - Extend Processor workflow for ChatGPT, Claude, etc.
5. **Optimize queries** - Customize query templates in Processor workflow
6. **Add insights** - Use LangChain agents for sentiment analysis

## Resources

- [N8N Documentation](https://docs.n8n.io/)
- [N8N Workflow Templates](https://n8n.io/workflows/)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Perplexity API Docs](https://docs.perplexity.ai/)
- [N8N Workflow Best Practices](/.claude/skills/n8n-workflow-vibe-coding/skill.md)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review n8n execution logs
3. Query database directly to diagnose
4. Check n8n workflow JSON for errors

---

**Built with love for GEORISE 🚀**
