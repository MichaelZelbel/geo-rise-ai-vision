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
  partialSuccess?: boolean; // True if at least one processor succeeded
  runId?: string; // Legacy support
  message?: string; // Legacy support
  data?: {
    runId: string;
    message: string;
    brandId: string;
    brandName: string;
    processors?: {
      perplexityStatus: 'completed' | 'failed';
      chatgptStatus: 'completed' | 'failed';
      totalProcessors: number;
      successfulProcessors: number;
    };
    results?: {
      perplexity: any;
      chatgpt: any;
    };
    errors?: {
      perplexity: any;
      chatgpt: any;
    } | null;
  };
  error?: {
    message: string;
    code: string;
    node?: string;
    timestamp?: string;
    isRetryable?: boolean;
  } | string; // Support both structured and simple error
  metadata?: {
    executionId: string;
    workflowName: string;
    receivedData?: string;
  };
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
                     'https://n8n-georise-v2.agentpool.cloud/webhook/analysis';

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

    // Handle the structured response from the enhanced n8n workflow
    if (!data.success) {
      // Workflow returned an error (validation, database, subworkflow failure)
      const errorMsg = typeof data.error === 'string'
        ? data.error
        : data.error?.message || 'Failed to start analysis';
      throw new Error(errorMsg);
    }

    // Warn if partial success (one processor failed)
    if (data.partialSuccess) {
      console.warn('Analysis started with partial success. Some AI engines may have failed:', {
        processors: data.data?.processors,
        errors: data.data?.errors
      });
    }

    // Extract runId from the data object (new structure) or root (legacy)
    const runId = data.data?.runId || data.runId;
    if (!runId) {
      throw new Error('No runId returned from analysis workflow');
    }

    return runId;
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
                     'https://n8n-georise-v2.agentpool.cloud/webhook/analysis';

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
         'https://n8n-georise-v2.agentpool.cloud/webhook/analysis';
}
