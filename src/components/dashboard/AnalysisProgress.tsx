import { useAnalysisStatus } from '@/hooks/useAnalysisStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AnalysisProgressProps {
  runId: string;
  onComplete?: (score: number) => void;
}

export function AnalysisProgress({ runId, onComplete }: AnalysisProgressProps) {
  const {
    status,
    progress,
    queriesCompleted,
    totalQueries,
    visibilityScore,
    totalMentions,
    errorMessage,
    isComplete,
    isFailed,
    isRunning,
    isLoading,
    error,
  } = useAnalysisStatus(runId);

  // Call onComplete callback when analysis finishes
  if (isComplete && visibilityScore !== null && onComplete) {
    onComplete(visibilityScore);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading analysis status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isRunning && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {isComplete && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {isFailed && <XCircle className="h-5 w-5 text-destructive" />}
              Analysis Status
            </CardTitle>
            <CardDescription>Run ID: {runId}</CardDescription>
          </div>
          <Badge
            variant={
              status === 'completed'
                ? 'default'
                : status === 'failed'
                ? 'destructive'
                : 'secondary'
            }
          >
            {status?.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {queriesCompleted} of {totalQueries} queries completed
          </p>
        </div>

        {/* Results (shown when complete) */}
        {isComplete && visibilityScore !== null && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Visibility Score</p>
              <p className="text-3xl font-bold text-primary">{visibilityScore.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Mentions</p>
              <p className="text-3xl font-bold">{totalMentions}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {isFailed && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Analysis Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Running Status */}
        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {status === 'pending'
                ? 'Analysis queued, starting soon...'
                : 'Analyzing brand visibility across AI platforms...'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
