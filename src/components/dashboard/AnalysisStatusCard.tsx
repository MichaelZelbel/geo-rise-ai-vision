import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { Progress } from "@/components/ui/progress";

interface AnalysisStatusCardProps {
  hasAnalysis: boolean;
  isPro: boolean;
  brandId?: string;
  brandName?: string;
  topic?: string;
  userId?: string;
  onAnalysisStarted?: (runId: string) => void;
  lastRunDate?: string;
  lastRunScore?: number;
  lastRunMentions?: number;
  completionPercentage?: number;
  analysisStatus?: string;
}

const AnalysisStatusCard = ({ hasAnalysis, isPro, brandId, brandName, topic, userId, onAnalysisStarted, lastRunDate, lastRunScore, lastRunMentions, completionPercentage, analysisStatus }: AnalysisStatusCardProps) => {
  const navigate = useNavigate();
  const [localAnalysisStarted, setLocalAnalysisStarted] = useState(false);
  
  // Calculate display percentage: completion_percentage + 5, capped at 100
  const displayPercentage = completionPercentage 
    ? Math.min(completionPercentage + 5, 100) 
    : 5;
  
  // Show progress bar when analysis is running (either from server status OR locally started)
  const isAnalysisRunning = analysisStatus === 'pending' || analysisStatus === 'processing' || localAnalysisStarted;
  
  const handleAnalysisStarted = (runId: string) => {
    setLocalAnalysisStarted(true);
    if (onAnalysisStarted) {
      onAnalysisStarted(runId);
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-primary/20 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Analysis Status
        </h3>
      </div>
      {!hasAnalysis ? (
        <div className="text-center py-4">
          <Clock className="h-12 w-12 text-accent mx-auto mb-3" />
          <p className="text-card-foreground font-medium mb-2">
            Ready for your first analysis
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Get your AI visibility score and insights
          </p>
          {brandId && brandName && topic && userId && (
            <>
              <RunAnalysisButton
                brandId={brandId}
                brandName={brandName}
                topic={topic}
                userId={userId}
                onAnalysisStarted={handleAnalysisStarted}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full"
                isAnalysisRunning={isAnalysisRunning}
              />
              
              {isAnalysisRunning && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Analysis Progress</span>
                    <span className="font-semibold text-primary">{displayPercentage}%</span>
                  </div>
                  <Progress value={displayPercentage} className="h-2" />
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="py-4">
          {lastRunDate && lastRunScore !== undefined && (
            <div className="mb-4 pb-4 border-b border-border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-muted-foreground">Last Run</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(lastRunDate).toLocaleDateString()} at {new Date(lastRunDate).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl font-bold text-card-foreground">{lastRunScore}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Mentions</span>
                <span className="font-medium text-card-foreground">{lastRunMentions || 0}</span>
              </div>
            </div>
          )}
          {!isPro ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Next free analysis in <span className="font-semibold">7 days</span>
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Pro users get daily updates
              </p>
              <Button
                onClick={() => navigate("/pricing")}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full"
              >
                Upgrade to Pro
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Daily analysis active - Next run tomorrow
              </p>
              {brandId && brandName && topic && userId && (
                <>
                  <RunAnalysisButton
                    brandId={brandId}
                    brandName={brandName}
                    topic={topic}
                    userId={userId}
                    onAnalysisStarted={handleAnalysisStarted}
                    variant="outline"
                    className="w-full"
                    isAnalysisRunning={isAnalysisRunning}
                  />
                  
                  {isAnalysisRunning && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Analysis Progress</span>
                        <span className="font-semibold text-primary">{displayPercentage}%</span>
                      </div>
                      <Progress value={displayPercentage} className="h-2" />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisStatusCard;
