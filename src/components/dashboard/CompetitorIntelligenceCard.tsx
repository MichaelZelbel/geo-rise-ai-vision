import { TrendingUp, Lock, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CompetitorIntelligenceCardProps {
  isPro: boolean;
  competitorData?: Array<{
    name: string;
    score: number;
    gap?: string;
  }> | null;
}

const CompetitorIntelligenceCard = ({ isPro, competitorData }: CompetitorIntelligenceCardProps) => {
  const navigate = useNavigate();

  if (!isPro) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <Lock className="h-12 w-12 mx-auto text-primary" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Competitor Intelligence</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track and compare your visibility against competitors
              </p>
            </div>
            <Button onClick={() => navigate("/pricing")}>
              Upgrade to Pro
            </Button>
          </div>
        </div>

        <div className="blur-sm">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Competitor Intelligence
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Competitor Intelligence
        </h3>
        <Button variant="ghost" size="icon" onClick={() => navigate("/account?tab=brands")}>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="space-y-3">
        {competitorData && competitorData.length > 0 ? (
          competitorData.map((competitor, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-card-foreground">
                  {competitor.name}
                </span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-accent">{competitor.score}</span>
                </div>
              </div>
              {competitor.gap && (
                <p className="text-xs text-muted-foreground italic">
                  Gap: {competitor.gap}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>No competitor data available yet.</p>
            <p className="mt-1">Run an analysis to see results.</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
        AI-powered competitive analysis
      </p>
    </div>
  );
};

export default CompetitorIntelligenceCard;
