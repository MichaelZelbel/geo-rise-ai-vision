import { Bot, AlertCircle, CheckCircle, Sparkles } from "lucide-react";

interface AIEngineCardProps {
  name: string;
  score?: number;
  status?: string;
  hasData: boolean;
}

const AIEngineCard = ({ name, score, status, hasData }: AIEngineCardProps) => {
  const getStatusIcon = () => {
    if (!hasData) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    if (status?.includes("Positive")) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status?.includes("Issues")) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <Sparkles className="h-4 w-4 text-accent" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">{name}</h3>
        </div>
        {getStatusIcon()}
      </div>
      
      <div className="space-y-2">
        {hasData ? (
          <>
            <div className={`text-3xl font-bold ${score ? getScoreColor(score) : 'text-muted-foreground'}`}>
              {score || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {status || "Sentiment Unknown"}
            </p>
          </>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Not Yet Configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              Coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIEngineCard;
