import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { triggerAnalysis } from "@/lib/n8nService";

interface AnalysisStatusCardProps {
  hasAnalysis: boolean;
  isPro: boolean;
  brandId?: string;
  brandName?: string;
  topic?: string;
  onAnalysisStarted?: (runId: string) => void;
  lastRunDate?: string;
  lastRunScore?: number;
  lastRunMentions?: number;
}

const AnalysisStatusCard = ({ hasAnalysis, isPro, brandId, brandName, topic, onAnalysisStarted, lastRunDate, lastRunScore, lastRunMentions }: AnalysisStatusCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAnalysis = async () => {
    if (!brandId || !brandName || !topic) {
      toast({
        title: "Error",
        description: "Brand information missing",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // Use n8n webhook to trigger analysis
      const runId = await triggerAnalysis({
        brandId,
        brandName,
        topic,
        userId: user.id
      });

      // Notify parent component about the new analysis
      if (runId && onAnalysisStarted) {
        onAnalysisStarted(runId);
      }

      toast({
        title: "Analysis Started",
        description: "Your visibility analysis is running. We'll refresh automatically when complete.",
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Parse structured error response
      let errorMessage = error.message || "Failed to start analysis";
      let description = errorMessage;
      
      // Check if it's a structured error from n8n
      if (error.error?.code) {
        switch(error.error.code) {
          case 'VALIDATION_ERROR':
            description = "Please check that all brand information is filled in correctly.";
            break;
          case 'DATABASE_ERROR':
            description = "Database error. Please try again in a moment.";
            break;
          case 'SUBWORKFLOW_ERROR':
            description = "Analysis service error. Our team has been notified.";
            break;
          default:
            description = errorMessage;
        }
      }
      
      toast({
        title: "Error",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
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
          <Button
            onClick={handleRunAnalysis}
            disabled={isRunning}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running Analysis...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run First Analysis
              </>
            )}
          </Button>
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
              <Button
                onClick={handleRunAnalysis}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running Analysis...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Analysis Now
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisStatusCard;
