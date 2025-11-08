/**
 * N8N Workflow Integration Service
 *
 * Handles communication with n8n workflows for GEO visibility analysis.
 * Workflows run asynchronously - trigger returns immediately with runId,
 * then poll analysis_runs table for status updates.
 */

interface TriggerAnalysisParams {
  brandId: string;
  brandName: string;
  topic: string;
  userId: string;
}

interface TriggerAnalysisResponse {
  success: boolean;
  runId: string;
  message: string;
  error?: string;
}

/**
 * Triggers an n8n workflow to analyze brand visibility across AI platforms
 *
 * @param params - Analysis parameters
 * @returns Promise with runId for polling status
 * @throws Error if webhook fails or validation error
 */
export async function triggerAnalysis(
  params: TriggerAnalysisParams
): Promise<string> {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL ||
                     'http://localhost:5678/webhook/georise-analysis-start';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandId: params.brandId,
        brandName: params.brandName,
        topic: params.topic,
        userId: params.userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data: TriggerAnalysisResponse = await response.json();

    if (!data.success || !data.runId) {
      throw new Error(data.error || 'Failed to start analysis');
    }

    return data.runId;
  } catch (error) {
    console.error('Failed to trigger analysis:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Cannot connect to analysis service. Please ensure n8n is running and accessible.'
      );
    }

    throw error;
  }
}

/**
 * Checks if n8n webhook is accessible
 *
 * @returns Promise<boolean> - true if webhook is reachable
 */
export async function checkN8nHealth(): Promise<boolean> {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL ||
                     'http://localhost:5678/webhook/georise-analysis-start';

  try {
    // Send OPTIONS request to check CORS and webhook availability
    const response = await fetch(webhookUrl, {
      method: 'OPTIONS',
    });
    return response.ok;
  } catch (error) {
    console.error('N8N health check failed:', error);
    return false;
  }
}

/**
 * Gets the configured n8n webhook URL
 *
 * @returns string - Webhook URL
 */
export function getN8nWebhookUrl(): string {
  return import.meta.env.VITE_N8N_WEBHOOK_URL ||
         'http://localhost:5678/webhook/georise-analysis-start';
}
