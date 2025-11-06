import { TrendingUp, Target } from "lucide-react";
import { format } from "date-fns";

interface VisibilityScoreCardProps {
  score: number;
  lastRun?: string | null;
}

const VisibilityScoreCard = ({ score, lastRun }: VisibilityScoreCardProps) => {
  const getScoreColor = (score: number) => {
    if (score <= 30) return "text-destructive";
    if (score <= 60) return "text-yellow-500";
    return "text-green-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score <= 30) return "bg-destructive/10";
    if (score <= 60) return "bg-yellow-500/10";
    return "bg-green-500/10";
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Your GEO Visibility Score
          </p>
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${getScoreBgColor(score)}`}>
          <Target className={`h-6 w-6 ${getScoreColor(score)}`} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          No change
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Last updated: {lastRun ? format(new Date(lastRun), "MMM d, yyyy") : "Never"}
        </p>
      </div>
    </div>
  );
};

export default VisibilityScoreCard;
