# GEORISE N8N Workflows

This directory contains n8n workflows for automated GEO (Generative Engine Optimization) visibility analysis across AI platforms like Perplexity, ChatGPT, Claude, and others.

## 📁 Workflow Files

### V2 (Recommended - Production Ready)
- **`GEORISE_Analysis_Starter_v2.json`** - Webhook-triggered starter workflow
- **`GEORISE_Analysis_Processor_v2.json`** - Async processor workflow that runs analyses

### V1 (Original from Claude.ai)
- `GEORISE_Analysis_Starter.json` - Original version
- `GEORISE_Analysis_Processor.json` - Original version

## 🏗️ Architecture

```
┌─────────────────┐
│   React App     │
│  (GEORISE UI)   │
└────────┬────────┘
         │
         │ POST /webhook/georise-analysis-start
         ▼
┌─────────────────────────────────────────┐
│  Starter Workflow                       │
│  ┌──────────────────────────────────┐  │
│  │ 1. Webhook Trigger               │  │
│  │ 2. Config Node (input decoupling)│  │
│  │ 3. Validate inputs               │  │
│  │ 4. Create analysis_runs record   │  │
│  │ 5. Trigger Processor (async)     │  │
│  │ 6. Return runId to webapp        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         │ Execute Workflow (async)
         ▼
┌─────────────────────────────────────────┐
│  Processor Workflow                     │
│  ┌──────────────────────────────────┐  │
│  │ 1. Update status: processing     │  │
│  │ 2. Generate 20 test queries      │  │
│  │ 3. Loop through queries:         │  │
│  │    - Call Perplexity API         │  │
│  │    - Check brand mention         │  │
│  │    - Extract position/context    │  │
│  │    - Save to analyses table      │  │
│  │    - Rate limit (2s delay)       │  │
│  │ 4. Calculate visibility scores   │  │
│  │ 5. Update status: completed      │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         │ Writes to Supabase
         ▼
┌─────────────────────────────────────────┐
│  Supabase PostgreSQL                    │
│  ┌──────────────────────────────────┐  │
│  │ - analysis_runs (status/scores)  │  │
│  │ - analyses (query results)       │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         │ Polling: GET /api/analysis-status/{runId}
         ▼
┌─────────────────┐
│   React App     │
│  Shows progress │
└─────────────────┘
```

## 🚀 Deployment Steps

### 1. Database Setup

Run the migration to create required tables:

```bash
# Apply migration in Supabase SQL Editor or via CLI
cd supabase
supabase db push
```

Or manually run:
```sql
-- Located at: supabase/migrations/20251108170000_create_analysis_runs_table.sql
```

This creates:
- `analysis_runs` table (tracks each analysis job)
- Extends `analyses` table with new columns
- RLS policies
- Helper functions for polling

### 2. N8N Setup

#### Install N8N

```bash
# Using Docker (recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Or using npm
npm install -g n8n
n8n start
```

#### Configure Credentials

1. **Supabase PostgreSQL**
   - Name: `supabase_postgres`
   - Host: `db.YOUR_PROJECT_REF.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: (from Supabase Dashboard → Settings → Database → Connection string)

2. **Perplexity API**
   - Name: `perplexity_api`
   - API Key: Get from [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

#### Import Workflows

1. Open N8N at `http://localhost:5678`
2. Go to Workflows → Import from File
3. Import `GEORISE_Analysis_Starter_v2.json`
4. Import `GEORISE_Analysis_Processor_v2.json`
5. Activate both workflows

#### Configure Workflow Connection

In the Starter workflow:
1. Open "Trigger Processor" node
2. In `workflowId` dropdown, select "GEORISE Analysis Processor"
3. Save workflow

### 3. Test Workflows

#### Test with Manual Trigger

1. Open "GEORISE Analysis Processor" workflow
2. Click "Execute Workflow" button (uses Manual Trigger)
3. Check execution - should process 20 queries
4. Verify data in Supabase:
   ```sql
   SELECT * FROM analysis_runs ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM analyses WHERE run_id = 'YOUR_RUN_ID';
   ```

#### Test with Webhook

```bash
# Get webhook URL from Starter workflow
# Should be: http://localhost:5678/webhook/georise-analysis-start

curl -X POST http://localhost:5678/webhook/georise-analysis-start \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "123e4567-e89b-12d3-a456-426614174000",
    "brandName": "Nike",
    "topic": "running shoes",
    "userId": "123e4567-e89b-12d3-a456-426614174001"
  }'

# Response:
# {
#   "success": true,
#   "runId": "run_1699564123456_123e4567-e89b-12d3-a456-426614174000",
#   "message": "Analysis started. Poll /api/analysis-status/run_... for updates."
# }
```

### 4. Production Deployment

#### Deploy N8N

**Option A: N8N Cloud**
1. Sign up at [https://n8n.io/cloud](https://n8n.io/cloud)
2. Import workflows
3. Configure credentials
4. Get production webhook URL

**Option B: Self-hosted (Docker)**
```bash
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_password
      - N8N_HOST=n8n.yourdomain.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.yourdomain.com/
    volumes:
      - ~/.n8n:/home/node/.n8n
```

#### Update Webapp

Add webhook URL to environment variables:

```env
# .env
VITE_N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/georise-analysis-start
```

## 📊 Workflow Details

### Starter Workflow

**Trigger:** Webhook at `/webhook/georise-analysis-start`

**Input:**
```json
{
  "brandId": "uuid",
  "brandName": "string",
  "topic": "string",
  "userId": "uuid"
}
```

**Output:**
```json
{
  "success": true,
  "runId": "run_1699564123456_brandId",
  "message": "Analysis started. Poll /api/analysis-status/... for updates."
}
```

**Nodes:**
1. Manual Trigger (for testing)
2. Webhook Trigger (production)
3. **Config** - Decouples inputs, provides defaults for manual testing
4. Validate and Prepare - Validates required fields
5. Create Run Record - Inserts into `analysis_runs` table
6. Trigger Processor - Calls processor workflow asynchronously
7. Respond Success - Returns runId to webapp

### Processor Workflow

**Trigger:** Execute Workflow Trigger (called by Starter)

**Process:**
1. Updates status to "processing"
2. Generates 20 test queries based on topic
3. Loops through queries:
   - Calls Perplexity API
   - Checks if brand mentioned
   - Calculates position (1-4 based on location in response)
   - Extracts context and citations
   - Saves to `analyses` table
   - Rate limits (2s delay between calls)
4. Calculates aggregate scores
5. Updates `analysis_runs` with final results
6. Sets status to "completed"

**Error Handling:**
- Perplexity API failures are caught
- Failed queries saved with `mentioned=false`
- Workflow continues even if some queries fail
- Retries up to 3 times on API errors

**Output Data:**
- `visibility_score`: 0-100 (mention rate percentage)
- `total_mentions`: Count of queries where brand mentioned
- `mention_rate`: Percentage of queries with mentions
- `citation_count`: Count of mentions with citations
- `top_position_count`: Count of position=1 mentions
- `avg_position`: Average position when mentioned

## 🔗 Webapp Integration

See `/src/lib/n8nService.ts` for integration code.

**Trigger Analysis:**
```typescript
import { triggerAnalysis } from '@/lib/n8nService';

const runId = await triggerAnalysis({
  brandId: brand.id,
  brandName: brand.name,
  topic: brand.topic,
  userId: user.id
});
```

**Poll Status:**
```typescript
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';

const { status, progress, score, isComplete } = useAnalysisStatus(runId);
```

## 🐛 Debugging

### View Execution Logs

1. Go to N8N → Executions
2. Find your workflow execution
3. Click to view detailed logs

### Common Issues

**Error: "Missing required field"**
- Ensure all fields (brandId, brandName, topic, userId) are provided
- Check they are valid UUIDs where required

**Error: "Supabase connection failed"**
- Verify PostgreSQL credentials
- Check Supabase is accessible from N8N
- Test connection in N8N credential settings

**Error: "Perplexity API rate limit"**
- Default rate limit is 2000ms between calls
- Adjust `RATE_LIMIT_MS` in Config node
- Check Perplexity API quota

**Workflow stuck in "processing"**
- Check N8N executions for errors
- Query database:
  ```sql
  UPDATE analysis_runs
  SET status = 'failed', error_message = 'Manual intervention'
  WHERE run_id = 'YOUR_RUN_ID';
  ```

## 📈 Extending

### Add More AI Engines

1. Duplicate the Processor workflow
2. Modify "Call Perplexity" node to call different AI:
   - Use ChatGPT node for OpenAI
   - Use Claude node for Anthropic
   - Use HTTP Request for custom APIs
3. Update `ai_engine` field in "Analyze Response"

### Modify Query Templates

Edit the `Generate Queries` node code:
```javascript
const templates = [
  `Your custom query about ${topic}`,
  `Another query for ${brandName}`,
  // ... add more
];
```

### Add Sentiment Analysis

After "Analyze Response", add a LangChain AI Agent node:
```javascript
// Use structured output parser for sentiment
{
  "sentiment": "positive|neutral|negative",
  "confidence": 0.95
}
```

## 📝 License

MIT - Part of GEORISE project
