import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AnalysisStatusCardProps {
  hasAnalysis: boolean;
  isPro: boolean;
}

const AnalysisStatusCard = ({ hasAnalysis, isPro }: AnalysisStatusCardProps) => {
  const navigate = useNavigate();

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
          <p className="text-sm text-muted-foreground">
            Your next analysis will run tomorrow
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisStatusCard;
