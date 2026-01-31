import { useAICredits } from '@/hooks/useAICredits';
import { Check, Loader2, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';

export function CreditsDisplay() {
  const { credits, isLoading, error } = useAICredits();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load AI credits: {error}
      </div>
    );
  }

  if (!credits) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
        No credit data available. Please sign in to view your AI credits.
      </div>
    );
  }

  // Calculate display values
  const rolloverCredits = credits.rolloverTokens / credits.tokensPerCredit;
  const displayTotal = credits.planBaseCredits + rolloverCredits;
  const usagePercentage = displayTotal > 0 
    ? (credits.remainingCredits / displayTotal) * 100 
    : 0;
  
  // Calculate rollover section percentage (for visual indicator)
  const rolloverPercentage = displayTotal > 0 
    ? (rolloverCredits / displayTotal) * 100 
    : 0;

  // Check if within 5 days of period end
  const now = new Date();
  const periodEnd = credits.periodEnd ? new Date(credits.periodEnd) : null;
  const daysUntilReset = periodEnd ? differenceInDays(periodEnd, now) : null;
  const showRolloverPreview = daysUntilReset !== null && daysUntilReset <= 5 && daysUntilReset >= 0;

  // Calculate potential rollover (capped at plan base)
  const potentialRollover = Math.min(
    Math.floor(credits.remainingCredits),
    credits.planBaseCredits
  );

  // Format the reset date
  const resetDateFormatted = periodEnd ? format(periodEnd, 'MMM d, yyyy') : 'N/A';

  // Days text for rollover preview
  const getDaysText = () => {
    if (daysUntilReset === 0) return 'today';
    if (daysUntilReset === 1) return 'tomorrow';
    return `in ${daysUntilReset} days`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">AI Credits remaining</h3>
        <span className="text-sm font-semibold text-foreground">
          {Math.floor(credits.remainingCredits)} of {Math.floor(displayTotal)}
        </span>
      </div>

      {/* Progress bar with rollover indicator */}
      <div className="relative">
        <Progress value={usagePercentage} className="h-3" />
        {/* Rollover section indicator - darker section at the end */}
        {rolloverPercentage > 0 && (
          <div 
            className="absolute top-0 right-0 h-3 rounded-r-full bg-primary/40 pointer-events-none"
            style={{ width: `${rolloverPercentage}%` }}
          />
        )}
      </div>

      {/* Rollover preview banner */}
      {showRolloverPreview && potentialRollover > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
          <span className="text-foreground">
            <span className="font-medium">{potentialRollover} credits</span>
            {' '}will carry over to next period ({getDaysText()})
          </span>
        </div>
      )}

      {/* Info lines */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary shrink-0" />
          <span>Up to {Math.floor(credits.planBaseCredits)} credits rollover</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary shrink-0" />
          <span>{Math.floor(credits.planBaseCredits)} credits reset on {resetDateFormatted}</span>
        </div>
      </div>
    </div>
  );
}
