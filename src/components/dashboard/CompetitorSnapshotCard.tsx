import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CompetitorSnapshotCardProps {
  isPro: boolean;
}

const CompetitorSnapshotCard = ({ isPro }: CompetitorSnapshotCardProps) => {
  const navigate = useNavigate();

  const competitors = [
    { rank: 1, name: "Competitor A", score: 78 },
    { rank: 2, name: "Competitor B", score: 65 },
    { rank: 3, name: "Competitor C", score: 52 },
  ];

  if (!isPro) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border shadow-sm relative overflow-hidden">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Top Competitors
          </h3>
          <p className="text-sm text-muted-foreground">
            Who else is ranking for your topic
          </p>
        </div>
        <div className="space-y-3 blur-sm select-none">
          {competitors.map((comp) => (
            <div
              key={comp.rank}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground">
                  #{comp.rank}
                </span>
                <span className="text-sm font-medium text-card-foreground">
                  {comp.name}
                </span>
              </div>
              <span className="text-lg font-bold text-muted-foreground">
                {comp.score}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <Lock className="h-12 w-12 text-accent mx-auto mb-3" />
            <p className="text-lg font-semibold text-card-foreground mb-3">
              Unlock Competitor Analysis
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
          Top Competitors
        </h3>
        <p className="text-sm text-muted-foreground">
          Who else is ranking for your topic
        </p>
      </div>
      <div className="space-y-3">
        {competitors.map((comp) => (
          <div
            key={comp.rank}
            className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-accent">#{comp.rank}</span>
              <span className="text-sm font-medium text-card-foreground">
                {comp.name}
              </span>
            </div>
            <span className="text-lg font-bold text-card-foreground">
              {comp.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompetitorSnapshotCard;
