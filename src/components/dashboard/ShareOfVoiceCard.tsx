import { TrendingUp, Users } from "lucide-react";

interface ShareOfVoiceCardProps {
  shareOfVoice: number;
  change?: number;
}

const ShareOfVoiceCard = ({ shareOfVoice, change = 0 }: ShareOfVoiceCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Share of Voice
          </p>
          <div className="text-5xl font-bold text-primary">
            {shareOfVoice}%
          </div>
        </div>
        <div className="p-3 rounded-lg bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <TrendingUp className="h-4 w-4 text-green-500" />
        <span className="text-green-500">
          {change > 0 ? `+${change}` : change}%
        </span>
        <span className="text-muted-foreground">vs last run</span>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Your visibility across all AI engines
        </p>
      </div>
    </div>
  );
};

export default ShareOfVoiceCard;
