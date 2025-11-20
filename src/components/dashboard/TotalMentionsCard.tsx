import { MessageSquare, TrendingUp } from "lucide-react";

interface TotalMentionsCardProps {
  count: number;
  growth?: number;
}

const TotalMentionsCard = ({ count, growth = 0 }: TotalMentionsCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Total Mentions
          </p>
          <div className="text-5xl font-bold text-accent">
            {count}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-accent/10">
          <MessageSquare className="h-6 w-6 text-accent" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <span className="text-green-500">
          {growth > 0 ? `+${growth}` : growth}%
        </span>
        <span className="text-muted-foreground">growth</span>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Times your brand appeared in AI responses
        </p>
      </div>
    </div>
  );
};

export default TotalMentionsCard;
