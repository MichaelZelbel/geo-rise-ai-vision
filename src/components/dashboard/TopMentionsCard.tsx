import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TopMentionsCardProps {
  isPro: boolean;
}

const TopMentionsCard = ({ isPro }: TopMentionsCardProps) => {
  const navigate = useNavigate();

  const sampleMentions = [
    { query: "best [BLURRED] tools", engine: "[BLURRED]", position: "[BLURRED]" },
    { query: "top [BLURRED] experts", engine: "[BLURRED]", position: "[BLURRED]" },
    { query: "how to [BLURRED]", engine: "[BLURRED]", position: "[BLURRED]" },
  ];

  if (!isPro) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm relative overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Where You're Mentioned
          </h3>
          <p className="text-sm text-muted-foreground">
            Sample queries where AI engines cite you
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 blur-sm select-none">
          {sampleMentions.map((mention, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-muted/30 border border-border"
            >
              <p className="text-sm font-medium text-card-foreground mb-2">
                Query: {mention.query}
              </p>
              <p className="text-xs text-muted-foreground mb-1">
                Mentioned by: {mention.engine}
              </p>
              <p className="text-xs text-muted-foreground">
                Position: {mention.position}
              </p>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <Lock className="h-12 w-12 text-accent mx-auto mb-3" />
            <p className="text-lg font-semibold text-card-foreground mb-3">
              See full query data with Pro
            </p>
            <Button
              onClick={() => navigate("/pricing")}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          Where You're Mentioned
        </h3>
        <p className="text-sm text-muted-foreground">
          Queries where AI engines cite you
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sampleMentions.map((mention, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg bg-muted/30 border border-border"
          >
            <p className="text-sm font-medium text-card-foreground mb-2">
              Query: {mention.query}
            </p>
            <p className="text-xs text-muted-foreground mb-1">
              Mentioned by: {mention.engine}
            </p>
            <p className="text-xs text-muted-foreground">
              Position: {mention.position}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopMentionsCard;
