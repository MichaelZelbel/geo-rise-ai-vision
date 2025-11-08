/**
 * Example Component: How to integrate n8n analysis workflows
 *
 * This file demonstrates how to use the n8n integration in your dashboard.
 * Copy and adapt this code to your actual dashboard components.
 */

import { useState } from 'react';
import { RunAnalysisButton } from './RunAnalysisButton';
import { AnalysisProgress } from './AnalysisProgress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

interface AnalysisIntegrationExampleProps {
  /** Current brand being analyzed */
  brand: {
    id: string;
    name: string;
    topic: string;
  };
  /** Current user */
  user: {
    id: string;
    email: string;
  };
}

export function AnalysisIntegrationExample({
  brand,
  user,
}: AnalysisIntegrationExampleProps) {
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const handleAnalysisStarted = (runId: string) => {
    console.log('Analysis started with runId:', runId);
    setCurrentRunId(runId);
    setShowProgress(true);
  };

  const handleAnalysisComplete = (score: number) => {
    console.log('Analysis completed with score:', score);
    // You can update your brand record here, show celebration, etc.
  };

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>N8N Integration Example</AlertTitle>
        <AlertDescription>
          This component demonstrates how to trigger and monitor n8n analysis workflows.
          Copy this code to integrate into your actual dashboard.
        </AlertDescription>
      </Alert>

      {/* Trigger Analysis Card */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Visibility Analysis</CardTitle>
          <CardDescription>
            Analyze how {brand.name} appears in AI responses about {brand.topic}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RunAnalysisButton
            brandId={brand.id}
            brandName={brand.name}
            topic={brand.topic}
            userId={user.id}
            onAnalysisStarted={handleAnalysisStarted}
            disabled={showProgress}
          />
        </CardContent>
      </Card>

      {/* Progress Card (shown when analysis is running) */}
      {showProgress && currentRunId && (
        <AnalysisProgress
          runId={currentRunId}
          onComplete={handleAnalysisComplete}
        />
      )}

      {/* Integration Instructions */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Integration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">1. Add environment variable</h4>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
              VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/georise-analysis-start
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Import components</h4>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
{`import { RunAnalysisButton } from '@/components/dashboard/RunAnalysisButton';
import { AnalysisProgress } from '@/components/dashboard/AnalysisProgress';`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Add to your dashboard</h4>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
{`const [runId, setRunId] = useState<string | null>(null);

<RunAnalysisButton
  brandId={brand.id}
  brandName={brand.name}
  topic={brand.topic}
  userId={user.id}
  onAnalysisStarted={(runId) => setRunId(runId)}
/>

{runId && <AnalysisProgress runId={runId} />}`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. Database queries</h4>
            <p className="text-muted-foreground mb-2">
              You can also query analysis results directly:
            </p>
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
{`// Get latest analysis for a brand
const { data } = await supabase
  .from('analysis_runs')
  .select('*')
  .eq('brand_id', brandId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// Get query results for an analysis
const { data: queries } = await supabase
  .from('analyses')
  .select('*')
  .eq('run_id', runId)
  .order('query_index');`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
