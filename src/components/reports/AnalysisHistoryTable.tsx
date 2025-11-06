import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus, ChevronRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AnalysisDetailsDialog from "./AnalysisDetailsDialog";

interface AnalysisHistoryTableProps {
  analysisRuns: any[];
  userPlan: string;
  brandId: string;
}

const AnalysisHistoryTable = ({ analysisRuns, userPlan, brandId }: AnalysisHistoryTableProps) => {
  const navigate = useNavigate();
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  
  const isPro = userPlan === "pro" || userPlan === "giftedPro" || userPlan === "business" || userPlan === "giftedAgency";
  
  // Show only first analysis for free users
  const displayRuns = isPro ? analysisRuns : analysisRuns.slice(0, 1);

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <CardTitle>Analysis History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Mentions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRuns.map((run, index) => (
                  <TableRow 
                    key={run.runId}
                    className={!isPro && index > 0 ? "opacity-50 blur-sm" : ""}
                  >
                    <TableCell className="font-medium">
                      {format(new Date(run.date), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <span className="text-2xl font-bold">{run.score}</span>
                    </TableCell>
                    <TableCell>
                      {run.change !== undefined ? (
                        <div className={`flex items-center gap-1 ${
                          run.change > 0 ? 'text-green-500' : 
                          run.change < 0 ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {run.change > 0 && <TrendingUp className="h-4 w-4" />}
                          {run.change < 0 && <TrendingDown className="h-4 w-4" />}
                          {run.change === 0 && <Minus className="h-4 w-4" />}
                          {run.change !== 0 && (
                            <span className="font-semibold">
                              {run.change > 0 ? '+' : ''}{run.change}
                            </span>
                          )}
                          {run.change === 0 && <span>No change</span>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{run.mentions}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Complete
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRun(run.runId)}
                        disabled={!isPro && index > 0}
                      >
                        View <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!isPro && analysisRuns.length > 1 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Upgrade for Full History</p>
                  <p className="text-sm text-muted-foreground">
                    View all {analysisRuns.length} analyses and track your progress
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate("/pricing")}>
                Upgrade
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedRun && (
        <AnalysisDetailsDialog
          runId={selectedRun}
          brandId={brandId}
          open={!!selectedRun}
          onClose={() => setSelectedRun(null)}
          userPlan={userPlan}
        />
      )}
    </>
  );
};

export default AnalysisHistoryTable;
