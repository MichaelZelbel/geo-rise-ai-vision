import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';
import { triggerAnalysis } from '@/lib/n8nService';
import { toast } from 'sonner';

interface RunAnalysisButtonProps {
  brandId: string;
  brandName: string;
  topic: string;
  userId: string;
  onAnalysisStarted?: (runId: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  isAnalysisRunning?: boolean;
}

/**
 * Button component that triggers n8n analysis workflow
 *
 * Handles:
 * - Loading state during API call
 * - Error handling and user feedback
 * - Success callback with runId
 *
 * @example
 * ```tsx
 * <RunAnalysisButton
 *   brandId={brand.id}
 *   brandName={brand.name}
 *   topic={brand.topic}
 *   userId={user.id}
 *   onAnalysisStarted={(runId) => {
 *     navigate(`/analysis/${runId}`);
 *   }}
 * />
 * ```
 */
export function RunAnalysisButton({
  brandId,
  brandName,
  topic,
  userId,
  onAnalysisStarted,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
  isAnalysisRunning = false,
}: RunAnalysisButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const isRunning = isAnalysisRunning || isLoading;

  const handleRunAnalysis = async () => {
    setIsLoading(true);

    try {
      // Trigger n8n workflow
      const runId = await triggerAnalysis({
        brandId,
        brandName,
        topic,
        userId,
      });

      // Toast removed per user request - message shown below button instead

      // Call success callback
      if (onAnalysisStarted) {
        onAnalysisStarted(runId);
      }
    } catch (error) {
      console.error('Failed to start analysis:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to start analysis. Please try again.';

      toast.error('Analysis failed to start', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleRunAnalysis}
        disabled={disabled || isRunning}
        variant={variant}
        size={size}
        className={className}
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Running Analysis...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Run Analysis
          </>
        )}
      </Button>
    </div>
  );
}
