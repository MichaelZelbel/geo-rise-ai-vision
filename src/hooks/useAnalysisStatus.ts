import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalysisStatus {
  runId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  queriesCompleted: number;
  totalQueries: number;
  visibilityScore: number | null;
  totalMentions: number;
  errorMessage: string | null;
}

interface UseAnalysisStatusOptions {
  /** Polling interval in milliseconds (default: 3000) */
  pollInterval?: number;
  /** Whether to start polling immediately (default: true) */
  enabled?: boolean;
}

/**
 * Hook to poll analysis status from Supabase
 *
 * Automatically polls analysis_runs table for status updates until
 * analysis is completed or failed.
 *
 * @param runId - The analysis run ID to track
 * @param options - Polling configuration
 * @returns Analysis status and control functions
 *
 * @example
 * ```tsx
 * const { status, progress, visibilityScore, isComplete, error } = useAnalysisStatus(runId);
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * if (isComplete) return <Results score={visibilityScore} />;
 * return <ProgressBar progress={progress} />;
 * ```
 */
export function useAnalysisStatus(
  runId: string | null,
  options: UseAnalysisStatusOptions = {}
) {
  const { pollInterval = 3000, enabled = true } = options;

  const [data, setData] = useState<AnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch status from Supabase
  const fetchStatus = async () => {
    if (!runId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: analysisRun, error: dbError } = await supabase
        .from('analysis_runs')
        .select('*')
        .eq('run_id', runId)
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (!analysisRun) {
        throw new Error('Analysis run not found');
      }

      setData({
        runId: analysisRun.run_id,
        status: analysisRun.status as 'pending' | 'processing' | 'completed' | 'failed',
        progress: analysisRun.progress || 0,
        queriesCompleted: analysisRun.queries_completed || 0,
        totalQueries: analysisRun.total_queries || 20,
        visibilityScore: analysisRun.visibility_score,
        totalMentions: analysisRun.total_mentions || 0,
        errorMessage: analysisRun.error_message,
      });

      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch analysis status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (enabled && runId) {
      fetchStatus();
    }
  }, [runId, enabled]);

  // Poll for updates
  useEffect(() => {
    if (!enabled || !runId || !data) {
      return;
    }

    // Stop polling if analysis is complete or failed
    if (data.status === 'completed' || data.status === 'failed') {
      return;
    }

    const intervalId = setInterval(fetchStatus, pollInterval);

    return () => clearInterval(intervalId);
  }, [runId, enabled, data?.status, pollInterval]);

  // Subscribe to real-time updates (optional, for instant updates)
  useEffect(() => {
    if (!enabled || !runId) {
      return;
    }

    const channel = supabase
      .channel(`analysis_run:${runId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analysis_runs',
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setData({
            runId: updated.run_id,
            status: updated.status,
            progress: updated.progress || 0,
            queriesCompleted: updated.queries_completed || 0,
            totalQueries: updated.total_queries || 20,
            visibilityScore: updated.visibility_score,
            totalMentions: updated.total_mentions || 0,
            errorMessage: updated.error_message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId, enabled]);

  return {
    /** Current analysis data */
    data,
    /** Analysis status */
    status: data?.status || null,
    /** Progress percentage (0-100) */
    progress: data?.progress || 0,
    /** Number of queries completed */
    queriesCompleted: data?.queriesCompleted || 0,
    /** Total queries to process */
    totalQueries: data?.totalQueries || 20,
    /** Final visibility score (0-100) */
    visibilityScore: data?.visibilityScore || null,
    /** Number of mentions found */
    totalMentions: data?.totalMentions || 0,
    /** Error message if failed */
    errorMessage: data?.errorMessage || null,
    /** Whether analysis is complete */
    isComplete: data?.status === 'completed',
    /** Whether analysis failed */
    isFailed: data?.status === 'failed',
    /** Whether analysis is running */
    isRunning: data?.status === 'processing' || data?.status === 'pending',
    /** Loading state */
    isLoading,
    /** Error state */
    error,
    /** Manually refetch status */
    refetch: fetchStatus,
  };
}
