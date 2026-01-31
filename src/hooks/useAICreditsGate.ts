import { useCallback } from 'react';
import { useAICredits } from './useAICredits';
import { toast } from 'sonner';

export function useAICreditsGate() {
  const { credits, isLoading, error, refetch } = useAICredits();

  const hasCredits = isLoading || (credits?.remainingCredits ?? 0) > 0;

  const checkCredits = useCallback((): boolean => {
    // Fail-open while loading - server will catch if no credits
    if (isLoading) {
      return true;
    }

    // Check if user has remaining credits
    if (credits && credits.remainingCredits > 0) {
      return true;
    }

    // No credits - show toast and return false
    toast.error('No AI Credits Available', {
      description: 'Please wait until your AI Credits reset at the start of your next billing period.',
      duration: 5000,
    });

    return false;
  }, [credits, isLoading]);

  return {
    hasCredits,
    isLoading,
    checkCredits,
    credits,
    refetchCredits: refetch,
  };
}
