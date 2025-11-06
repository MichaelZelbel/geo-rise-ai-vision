import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface AnalysisStatusCardProps {
  hasAnalysis: boolean;
  isPro: boolean;
  brandId?: string;
  brandName?: string;
  topic?: string;
}

const AnalysisStatusCard = ({ hasAnalysis, isPro, brandId, brandName, topic }: AnalysisStatusCardProps) => {
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

      const { error } = await supabase.functions.invoke('run-analysis', {
        body: {
          brandId,
          brandName,
          topic,
          userId: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Analysis Started",
        description: "Your visibility analysis is running. Results will be ready in a few minutes.",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start analysis",
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
            Your first analysis is pending
          </p>
          <p className="text-sm text-muted-foreground">
            We'll scan the AIverse and update your score within 24 hours
          </p>
        </div>
      ) : !isPro ? (
        <div className="text-center py-4">
          <Clock className="h-12 w-12 text-accent mx-auto mb-3" />
          <p className="text-2xl font-bold text-card-foreground mb-1">7 days</p>
          <p className="text-sm text-muted-foreground mb-4">
            Next free analysis available in
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Pro users get daily updates
          </p>
          <Button
            onClick={() => navigate("/pricing")}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            Upgrade to Pro
          </Button>
        </div>
      ) : (
        <div className="text-center py-4">
          <Clock className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-card-foreground font-medium mb-2">
            Daily analysis active
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Your next analysis will run tomorrow
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
  );
};

export default AnalysisStatusCard;
