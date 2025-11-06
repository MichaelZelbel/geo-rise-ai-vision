import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScoreTrendChartProps {
  analysisRuns: any[];
  userPlan: string;
}

const ScoreTrendChart = ({ analysisRuns, userPlan }: ScoreTrendChartProps) => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<"30" | "90" | "all">("all");
  
  const isPro = userPlan === "pro" || userPlan === "giftedPro" || userPlan === "business" || userPlan === "giftedAgency";
  
  // Prepare chart data
  const chartData = analysisRuns
    .slice()
    .reverse()
    .map(run => ({
      date: format(new Date(run.date), "MMM d"),
      score: run.score,
      fullDate: run.date,
    }));

  // Show only last 2 points for free users
  const displayData = isPro ? chartData : chartData.slice(-2);

  if (analysisRuns.length === 1) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">
              Run another analysis to see trends
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Refresh Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Score Trend</CardTitle>
          {isPro && (
            <div className="flex gap-2">
              <Button
                variant={timeRange === "30" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("30")}
              >
                30d
              </Button>
              <Button
                variant={timeRange === "90" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("90")}
              >
                90d
              </Button>
              <Button
                variant={timeRange === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("all")}
              >
                All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={displayData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
            />
            <YAxis 
              domain={[0, 100]} 
              className="text-xs"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {!isPro && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center p-6 bg-card border border-border rounded-lg shadow-lg max-w-md">
              <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Upgrade to Pro for Full History</h3>
              <p className="text-sm text-muted-foreground mb-4">
                See unlimited historical data and track your progress over time
              </p>
              <Button onClick={() => navigate("/pricing")}>
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScoreTrendChart;
