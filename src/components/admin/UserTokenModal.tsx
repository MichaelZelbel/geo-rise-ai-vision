import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  adminId: string;
}

interface AllowancePeriod {
  id: string;
  user_id: string;
  tokens_granted: number;
  tokens_used: number;
  period_start: string;
  period_end: string;
  source: string | null;
  metadata: Record<string, unknown>;
}

export function UserTokenModal({
  open,
  onOpenChange,
  userId,
  userEmail,
  adminId,
}: UserTokenModalProps) {
  const [period, setPeriod] = useState<AllowancePeriod | null>(null);
  const [tokensGranted, setTokensGranted] = useState(0);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokensPerCredit, setTokensPerCredit] = useState(200);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchUserAllowance();
    }
  }, [open, userId]);

  const fetchUserAllowance = async () => {
    setIsLoading(true);
    try {
      // Call ensure-token-allowance to ensure period exists
      const { data, error } = await supabase.functions.invoke('ensure-token-allowance', {
        body: { user_id: userId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.period) {
        setPeriod(data.period);
        setTokensGranted(data.period.tokens_granted);
        setTokensUsed(data.period.tokens_used);
      }

      // Fetch tokens_per_credit setting
      const { data: settings } = await supabase
        .from('ai_credit_settings')
        .select('value_int')
        .eq('key', 'tokens_per_credit')
        .single();

      if (settings) {
        setTokensPerCredit(settings.value_int);
      }
    } catch (err) {
      console.error('Error fetching user allowance:', err);
      toast.error('Failed to fetch user allowance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!period) return;

    setIsSaving(true);
    try {
      const previousGranted = period.tokens_granted;
      const previousUsed = period.tokens_used;
      const grantedDelta = tokensGranted - previousGranted;
      const usedDelta = tokensUsed - previousUsed;

      // Update the allowance period
      const { error: updateError } = await supabase
        .from('ai_allowance_periods')
        .update({
          tokens_granted: tokensGranted,
          tokens_used: tokensUsed,
        })
        .eq('id', period.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Log to llm_usage_events
      const idempotencyKey = `admin_adjustment_${adminId}_${userId}_${Date.now()}`;
      
      const { error: logError } = await supabase
        .from('llm_usage_events')
        .insert({
          user_id: userId,
          idempotency_key: idempotencyKey,
          feature: 'admin_balance_adjustment',
          total_tokens: Math.abs(grantedDelta),
          metadata: {
            admin_id: adminId,
            target_user_id: userId,
            target_user_email: userEmail,
            previous_tokens_granted: previousGranted,
            new_tokens_granted: tokensGranted,
            tokens_granted_delta: grantedDelta,
            previous_tokens_used: previousUsed,
            new_tokens_used: tokensUsed,
            tokens_used_delta: usedDelta,
            period_id: period.id,
            adjustment_reason: 'Manual admin adjustment',
          },
        });

      if (logError) {
        console.error('Failed to log adjustment:', logError);
        // Don't fail the save if logging fails
      }

      // Update local state
      setPeriod({
        ...period,
        tokens_granted: tokensGranted,
        tokens_used: tokensUsed,
      });

      toast.success('Token balance updated', {
        description: `Updated balance for ${userEmail}`,
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Error saving token balance:', err);
      toast.error('Failed to update token balance');
    } finally {
      setIsSaving(false);
    }
  };

  const remainingTokens = tokensGranted - tokensUsed;
  const creditsGranted = tokensGranted / tokensPerCredit;
  const creditsUsed = tokensUsed / tokensPerCredit;
  const creditsRemaining = remainingTokens / tokensPerCredit;

  const hasChanges = period && (
    tokensGranted !== period.tokens_granted || 
    tokensUsed !== period.tokens_used
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Token Balance</DialogTitle>
          <DialogDescription>
            Adjust AI token allowance for {userEmail}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : period ? (
          <div className="space-y-6">
            {/* Period info (read-only) */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Period Start</Label>
                <p className="font-medium">
                  {format(new Date(period.period_start), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Period End</Label>
                <p className="font-medium">
                  {format(new Date(period.period_end), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokens-granted">Tokens Granted</Label>
                <Input
                  id="tokens-granted"
                  type="number"
                  min="0"
                  value={tokensGranted}
                  onChange={(e) => setTokensGranted(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokens-used">Tokens Used</Label>
                <Input
                  id="tokens-used"
                  type="number"
                  min="0"
                  max={tokensGranted}
                  value={tokensUsed}
                  onChange={(e) => setTokensUsed(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Calculated values */}
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining Tokens</span>
                <span className="font-medium">{remainingTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Credits Granted</span>
                <span className="font-medium">{creditsGranted.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Credits Used</span>
                <span className="font-medium">{creditsUsed.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                <span className="text-muted-foreground font-medium">Credits Remaining</span>
                <span className="font-bold text-primary">{creditsRemaining.toFixed(1)}</span>
              </div>
            </div>

            {/* Save button */}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No allowance period found for this user.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
