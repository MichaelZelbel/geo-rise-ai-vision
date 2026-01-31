import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreditSettings {
  tokens_per_credit: number;
  credits_free_per_month: number;
  credits_pro_per_month: number;
  credits_business_per_month: number;
  [key: string]: number;
}

interface AICredits {
  id: string | null;
  tokensGranted: number;
  tokensUsed: number;
  remainingTokens: number;
  creditsGranted: number;
  creditsUsed: number;
  remainingCredits: number;
  periodStart: string | null;
  periodEnd: string | null;
  source: string | null;
  rolloverTokens: number;
  baseTokens: number;
  planBaseCredits: number;
  tokensPerCredit: number;
}

interface UseAICreditsResult {
  credits: AICredits | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultCredits: AICredits = {
  id: null,
  tokensGranted: 0,
  tokensUsed: 0,
  remainingTokens: 0,
  creditsGranted: 0,
  creditsUsed: 0,
  remainingCredits: 0,
  periodStart: null,
  periodEnd: null,
  source: null,
  rolloverTokens: 0,
  baseTokens: 0,
  planBaseCredits: 0,
  tokensPerCredit: 200,
};

function getCreditsForPlan(plan: string, settings: CreditSettings): number {
  switch (plan) {
    case 'free':
      return settings.credits_free_per_month;
    case 'pro':
    case 'giftedPro':
      return settings.credits_pro_per_month;
    case 'business':
    case 'giftedAgency':
      return settings.credits_business_per_month;
    default:
      return settings.credits_free_per_month;
  }
}

export function useAICredits(): UseAICreditsResult {
  const [credits, setCredits] = useState<AICredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const warningShownRef = useRef(false);

  const fetchCredits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCredits(null);
        setIsLoading(false);
        return;
      }

      // Call ensure-token-allowance to ensure period exists
      const { error: fnError } = await supabase.functions.invoke('ensure-token-allowance', {
        body: {},
      });

      if (fnError) {
        console.error('Error ensuring token allowance:', fnError);
        // Continue anyway - the period might already exist
      }

      // Fetch all data in parallel
      const [allowanceResult, settingsResult, profileResult] = await Promise.all([
        supabase
          .from('v_ai_allowance_current')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('ai_credit_settings')
          .select('key, value_int'),
        supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single(),
      ]);

      if (settingsResult.error) {
        throw new Error(`Failed to fetch settings: ${settingsResult.error.message}`);
      }

      if (profileResult.error) {
        throw new Error(`Failed to fetch profile: ${profileResult.error.message}`);
      }

      // Parse settings
      const settings: CreditSettings = {
        tokens_per_credit: 200,
        credits_free_per_month: 0,
        credits_pro_per_month: 1500,
        credits_business_per_month: 5000,
      };

      for (const row of settingsResult.data || []) {
        if (row.key in settings) {
          settings[row.key] = row.value_int;
        }
      }

      const userPlan = profileResult.data?.plan || 'free';
      const planBaseCredits = getCreditsForPlan(userPlan, settings);

      // Parse allowance data
      const allowance = allowanceResult.data;
      
      if (!allowance) {
        // No current period - use defaults with plan info
        setCredits({
          ...defaultCredits,
          planBaseCredits,
          tokensPerCredit: settings.tokens_per_credit,
        });
        setIsLoading(false);
        return;
      }

      // Extract metadata
      const metadata = (allowance.metadata || {}) as Record<string, unknown>;
      const rolloverTokens = (metadata.rollover_tokens as number) || 0;
      const baseTokens = (metadata.base_tokens as number) || 0;

      const creditsData: AICredits = {
        id: allowance.id,
        tokensGranted: allowance.tokens_granted || 0,
        tokensUsed: allowance.tokens_used || 0,
        remainingTokens: allowance.remaining_tokens || 0,
        creditsGranted: allowance.credits_granted || 0,
        creditsUsed: allowance.credits_used || 0,
        remainingCredits: allowance.remaining_credits || 0,
        periodStart: allowance.period_start,
        periodEnd: allowance.period_end,
        source: allowance.source,
        rolloverTokens,
        baseTokens,
        planBaseCredits,
        tokensPerCredit: allowance.tokens_per_credit || settings.tokens_per_credit,
      };

      setCredits(creditsData);
    } catch (err) {
      console.error('Error fetching AI credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AI credits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Low credit warning effect
  useEffect(() => {
    if (!credits || warningShownRef.current || isLoading) return;

    const totalCredits = credits.planBaseCredits + (credits.rolloverTokens / credits.tokensPerCredit);
    const warningThreshold = totalCredits * 0.15;

    if (credits.remainingCredits > 0 && credits.remainingCredits < warningThreshold) {
      warningShownRef.current = true;
      toast.warning('Low AI Credits', {
        description: `You have ${Math.floor(credits.remainingCredits)} credits remaining. They will reset at the start of your next billing period.`,
        duration: 8000,
      });
    }
  }, [credits, isLoading]);

  return {
    credits,
    isLoading,
    error,
    refetch: fetchCredits,
  };
}
