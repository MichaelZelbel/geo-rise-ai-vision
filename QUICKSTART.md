# GEORISE Quick Start Guide

Get GEORISE running in 15 minutes.

## Prerequisites

- [ ] Supabase instance running (https://supabase-georise.agentpool.cloud)
- [ ] n8n instance running
- [ ] Perplexity API key

## 🚀 3-Step Deployment

### Step 1: Deploy Database (5 min)

**Option A: Automated Script** (if you have PostgreSQL client)
```bash
cd /path/to/geo-rise-ai-vision
./deploy-database.sh
```

**Option B: Manual via Supabase SQL Editor**
1. Open https://supabase-georise.agentpool.cloud
2. Navigate to **SQL Editor** → **New Query**
3. Copy/paste content of `database-schema-enhanced.sql` → **Run**
4. Copy/paste content of `database-dump.sql` → **Run** (optional - sample data)
5. Verify tables created: `SELECT * FROM analysis_runs LIMIT 1;`

### Step 2: Deploy N8N Workflows (5 min)

1. Open your n8n instance
2. Click **Workflows** → **Import from File**
3. Import `n8n/workflows/GEORISE_Analysis_Starter_v2.json`
4. Import `n8n/workflows/GEORISE_Analysis_Processor_v2.json`
5. Configure credentials:

**Supabase PostgreSQL:**
```
Name: Supabase GEORISE
Host: supabase-db-vokkcgog8ckogkkgc8o8sswg
Port: 5432
Database: postgres
User: postgres
Password: p5MKR3sqIBm4ertk9f1IvE9FnPKeYaF4
```

**Perplexity API:**
```
Name: Perplexity
API Key: [your-api-key]
```

6. **Activate both workflows** (toggle switches in workflow list)
7. Copy webhook URL from Starter workflow (should be `/webhook/georise-analysis-start`)

### Step 3: Configure & Test Webapp (5 min)

1. Create `.env.local` in project root:
```env
VITE_SUPABASE_URL=https://supabase-georise.agentpool.cloud
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
VITE_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/georise-analysis-start
```

2. Install dependencies:
```bash
npm install
```

3. Start dev server:
```bash
npm run dev
```

4. Open http://localhost:5173

5. Test the integration:
   - Log in with test account: `michael@zelbel.de` / `changeme123`
   - Navigate to dashboard
   - Click "Run Analysis" on a brand
   - Watch real-time progress!

## 🔍 Verification Checklist

After deployment, verify everything works:

### Database
- [ ] 10 tables exist (profiles, brands, analyses, analysis_runs, etc.)
- [ ] Sample data loaded (5 profiles, 5 brands, 15 analyses)
- [ ] Functions created (get_analysis_progress, can_add_brand, etc.)
- [ ] Views created (latest_brand_analyses, analysis_run_summary)
- [ ] RLS policies enabled

**Verify:**
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Should return: 10

SELECT * FROM get_analysis_progress('test-run-id');
-- Should return: empty result (no error)
```

### N8N Workflows
- [ ] Starter workflow activated
- [ ] Processor workflow activated
- [ ] Supabase credentials configured and tested
- [ ] Perplexity credentials configured and tested
- [ ] Webhook URL accessible

**Test webhook:**
```bash
curl -X POST https://your-n8n.com/webhook/georise-analysis-start \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "test-brand-uuid",
    "brandName": "Test Brand",
    "topic": "testing",
    "userId": "test-user-uuid"
  }'
```

Should return:
```json
{
  "success": true,
  "runId": "run_...",
  "message": "Analysis started"
}
```

### Webapp
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Dev server starts without errors
- [ ] Can log in with test account
- [ ] Dashboard loads with brands
- [ ] "Run Analysis" button works
- [ ] Progress displays in real-time
- [ ] Results appear in database

## 📊 Test Analysis Flow

1. In webapp, click **"Run Analysis"** on any brand
2. Check n8n execution logs:
   - **Starter workflow**: Should show successful execution with runId
   - **Processor workflow**: Should show 20 queries being executed
3. Check Supabase `analysis_runs` table:
   ```sql
   SELECT * FROM analysis_runs ORDER BY created_at DESC LIMIT 1;
   ```
   - Status should change: `pending` → `processing` → `completed`
   - Progress should increase: 0 → 5 → 10 → ... → 100
4. Check `analyses` table for query results:
   ```sql
   SELECT * FROM analyses WHERE run_id = 'your-run-id' ORDER BY query_index;
   ```
5. Webapp should show:
   - Real-time progress bar
   - Final visibility score (0-100)
   - Query results with mentions highlighted

## 🐛 Troubleshooting

### Database connection fails
**Error:** "Could not connect to database"

**Fix:**
- Verify Supabase instance is running
- Check credentials in n8n match Supabase dashboard
- Try connection pooler if direct connection fails:
  - Host: Use pooler URL if available
  - Port: 6543 (for pooler)

### Webhook returns 404
**Error:** `POST /webhook/georise-analysis-start` → 404

**Fix:**
- Ensure Starter workflow is **activated** (not just saved)
- Check webhook path matches exactly in n8n and .env.local
- Test webhook in n8n UI first

### Analysis stuck in "processing"
**Error:** Status never changes to "completed"

**Fix:**
- Check n8n Processor workflow execution logs for errors
- Check Perplexity API quota/rate limits
- Manually check database:
  ```sql
  SELECT status, progress, error_message FROM analysis_runs
  WHERE run_id = 'your-run-id';
  ```

### No data in webapp
**Error:** Dashboard shows "No brands found"

**Fix:**
- Verify auth.users were created in Supabase
- Check RLS policies are correct
- Test direct database query:
  ```sql
  -- Disable RLS temporarily for testing
  SET LOCAL ROLE postgres;
  SELECT * FROM brands;
  ```

## 📚 Full Documentation

For detailed information, see:

- **[DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md)** - Complete deployment guide with troubleshooting
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Architecture, usage examples, advanced topics
- **[n8n/README.md](./n8n/README.md)** - N8N workflow details and customization

## 🎯 What's Next?

After successful deployment:

1. **Add more AI engines**: Extend Processor workflow to query ChatGPT, Claude
2. **Customize queries**: Edit query templates in Processor workflow Config node
3. **Add insights generation**: Use LangChain nodes for sentiment analysis
4. **Create custom dashboard views**: Build visualizations for competitor analysis
5. **Set up monitoring**: Configure n8n error notifications
6. **Deploy to production**: Build and deploy frontend to Vercel/Netlify

## 🆘 Need Help?

1. Check the troubleshooting sections in each guide
2. Review n8n execution logs for detailed error messages
3. Query database directly to diagnose issues
4. Check `.claude/skills/n8n-workflow-vibe-coding/skill.md` for n8n best practices

---

**Ready to optimize your AI visibility? Let's go! 🚀**
