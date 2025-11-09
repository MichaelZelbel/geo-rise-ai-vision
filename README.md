# GEORISE - Generative Engine Optimization Platform

AI-powered brand visibility analysis platform. Track how your brand appears in AI responses across Perplexity, ChatGPT, Claude, and other AI engines.

## 🚀 What is GEORISE?

GEORISE determines your brand's visibility score in AI-generated responses. Like SEO for Google, GEO (Generative Engine Optimization) optimizes your presence in AI platforms.

**Key Features:**
- Multi-AI analysis (Perplexity, ChatGPT, Claude)
- Real-time visibility scoring (0-100)
- Competitor analysis
- AI-powered optimization coaching
- Async workflow processing via n8n
- Beautiful dashboard with real-time progress

## 📊 Current Status: Migration to Self-Hosted Supabase

This project was originally built on Lovable Cloud (Supabase) and is being migrated to self-hosted infrastructure for better scalability and n8n integration.

**Migration Files:**
- `database-schema-enhanced.sql` - Complete schema with n8n integration
- `database-dump.sql` - Sample data from Lovable Cloud
- `DEPLOYMENT_STEPS.md` - Step-by-step deployment guide
- `verify-deployment.sql` - Database verification script

## 🔗 Project Links

**Original Lovable Project**: https://lovable.dev/projects/910e0a01-6abc-4cfd-bbe7-e42ad504e874

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/910e0a01-6abc-4cfd-bbe7-e42ad504e874) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 📚 Documentation

### Quick Start Guides
- **[DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md)** - Deploy database schema to Supabase
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Complete n8n integration walkthrough
- **[n8n/README.md](./n8n/README.md)** - n8n workflow deployment guide

### Key Files
- **Workflows**: `n8n/workflows/GEORISE_Analysis_Starter_v2.json` and `GEORISE_Analysis_Processor_v2.json`
- **React Integration**: `src/lib/n8nService.ts`, `src/hooks/useAnalysisStatus.ts`
- **Components**: `src/components/dashboard/RunAnalysisButton.tsx`, `AnalysisProgress.tsx`
- **Database Migration**: `supabase/migrations/20251108170000_create_analysis_runs_table.sql`

### Architecture

```
React App → N8N Webhook → Async Processing → Supabase → React Polling
```

**Flow:**
1. User clicks "Run Analysis" → Triggers n8n webhook
2. n8n Starter creates `analysis_runs` record → Returns `runId`
3. n8n Processor executes 20 AI queries in background
4. Results written to Supabase (`analyses` table)
5. React app polls for updates → Shows real-time progress
6. Final visibility score calculated and displayed

## What technologies are used for this project?

This project is built with:

**Frontend:**
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

**Backend:**
- Supabase (PostgreSQL with Row Level Security)
- n8n (workflow automation)
- Perplexity API (AI analysis)
- OpenAI API (planned)
- Anthropic Claude API (planned)

## How can I deploy this project?

### Self-Hosted Deployment (Recommended)

**Prerequisites:**
- Self-hosted Supabase instance
- n8n instance (cloud or self-hosted)
- Perplexity API key

**Steps:**

1. **Deploy Database** (see [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md))
   ```bash
   # Execute in Supabase SQL Editor:
   # 1. database-schema-enhanced.sql
   # 2. database-dump.sql (optional - sample data)
   # 3. Create auth.users
   ```

2. **Deploy N8N Workflows** (see [n8n/README.md](./n8n/README.md))
   - Import `GEORISE_Analysis_Starter_v2.json`
   - Import `GEORISE_Analysis_Processor_v2.json`
   - Configure Supabase and Perplexity credentials
   - Activate both workflows

3. **Configure Environment Variables**
   ```env
   # .env.local
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/georise-analysis-start
   ```

4. **Deploy Frontend**
   ```bash
   npm run build
   # Deploy dist/ folder to Vercel, Netlify, or your hosting
   ```

### Lovable Cloud Deployment (Legacy)

For the original Lovable Cloud version, open [Lovable](https://lovable.dev/projects/910e0a01-6abc-4cfd-bbe7-e42ad504e874) and click on Share → Publish.

**Note:** Lovable Cloud version has limitations with n8n integration (no PostgreSQL admin access).

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
