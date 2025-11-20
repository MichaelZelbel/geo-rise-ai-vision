import { TrendingUp, TrendingDown, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface ReportsOverviewProps {
  analysisRuns: any[];
  brandCreatedAt: string;
}

const ReportsOverview = ({ analysisRuns, brandCreatedAt }: ReportsOverviewProps) => {
  const navigate = useNavigate();
  const latestRun = analysisRuns[0];
  const change = latestRun?.change || 0;
  
  const bestScore = Math.max(...analysisRuns.map(r => r.score));
  const bestScoreRun = analysisRuns.find(r => r.score === bestScore);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Current Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Current Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold">{latestRun?.score || 0}</div>
            <div className={`p-3 rounded-lg ${
              change > 0 ? 'bg-green-500/10' : 
              change < 0 ? 'bg-destructive/10' : 
              'bg-muted'
            }`}>
              <Target className={`h-6 w-6 ${
                change > 0 ? 'text-green-500' : 
                change < 0 ? 'text-destructive' : 
                'text-muted-foreground'
              }`} />
            </div>
          </div>
          {change !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              change > 0 ? 'text-green-500' : 'text-destructive'
            }`}>
              {change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {change > 0 ? '+' : ''}{change} from last run
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {latestRun ? format(new Date(latestRun.date), "MMM d, yyyy") : "Never"}
          </p>
          <Button 
            onClick={() => navigate("/dashboard")} 
            variant="default" 
            size="sm"
            className="w-full mt-4"
          >
            Analysis
          </Button>
        </CardContent>
      </Card>

      {/* Total Analyses Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold">{analysisRuns.length}</div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Since {format(new Date(brandCreatedAt), "MMM d, yyyy")}
          </p>
        </CardContent>
      </Card>

      {/* Best Score Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Best Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold">{bestScore}</div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Peak on {bestScoreRun ? format(new Date(bestScoreRun.date), "MMM d, yyyy") : "N/A"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsOverview;
