import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InsightsPanelProps {
  insights: any[];
  userPlan: string;
}

const InsightsPanel = ({ insights, userPlan }: InsightsPanelProps) => {
  const navigate = useNavigate();
  const isPro = userPlan === "pro" || userPlan === "giftedPro" || userPlan === "business" || userPlan === "giftedAgency";
  
  const displayInsights = isPro ? insights : insights.slice(0, 2);

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No insights available yet. Run an analysis to get recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayInsights.map((insight, index) => (
          <div 
            key={insight.id}
            className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <Badge variant="outline" className="text-xs">
                {insight.type}
              </Badge>
              <p className="text-sm">{insight.text}</p>
            </div>
          </div>
        ))}

        {!isPro && insights.length > 2 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold mb-1">
              {insights.length - 2} more insights
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Upgrade for all recommendations
            </p>
            <Button size="sm" onClick={() => navigate("/pricing")}>
              Upgrade to Pro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsightsPanel;
