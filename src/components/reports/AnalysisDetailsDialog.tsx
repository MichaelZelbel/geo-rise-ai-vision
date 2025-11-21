import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AnalysisDetailsDialogProps {
  runId: string;
  brandId: string;
  open: boolean;
  onClose: () => void;
  userPlan: string;
}

const AnalysisDetailsDialog = ({ runId, brandId, open, onClose, userPlan }: AnalysisDetailsDialogProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<any[]>([]);
  
  const isPro = userPlan === "pro" || userPlan === "giftedPro" || userPlan === "business" || userPlan === "giftedAgency";

  useEffect(() => {
    if (open) {
      fetchDetails();
    }
  }, [open, runId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .eq("run_id", runId)
        .eq("brand_id", brandId);

      if (data) {
        setAnalyses(data);
      }
    } catch (error) {
      console.error("Error fetching analysis details:", error);
    } finally {
      setLoading(false);
    }
  };

  const mentions = analyses.filter(a => a.position !== null);
  const totalQueries = new Set(analyses.map(a => a.query)).size;
  const engineBreakdown = analyses.reduce((acc: any, analysis) => {
    const engine = analysis.ai_engine;
    if (!acc[engine]) {
      acc[engine] = { total: 0, mentioned: 0 };
    }
    acc[engine].total++;
    if (analysis.position !== null) {
      acc[engine].mentioned++;
    }
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analysis Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Run Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-sm text-muted-foreground mb-1">Total Queries</p>
                <p className="text-2xl font-bold">{totalQueries}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-sm text-muted-foreground mb-1">Mentions Found</p>
                <p className="text-2xl font-bold">{mentions.length}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-sm text-muted-foreground mb-1">Mention Rate</p>
                <p className="text-2xl font-bold">
                  {Math.round((mentions.length / totalQueries) * 100)}%
                </p>
              </div>
            </div>

            {/* AI Engine Breakdown */}
            <div>
              <h3 className="font-semibold mb-3">AI Engine Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(engineBreakdown).map(([engine, stats]: [string, any]) => (
                  <div key={engine} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <span className="font-medium capitalize">{engine}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {stats.mentioned}/{stats.total} queries
                      </span>
                      <Badge variant={stats.mentioned > 0 ? "default" : "outline"}>
                        {Math.round((stats.mentioned / stats.total) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Query Results */}
            <div className="relative">
              <h3 className="font-semibold mb-3">Query Results</h3>
              {isPro ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead>Engine</TableHead>
                        <TableHead>Mentioned</TableHead>
                        <TableHead>Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analyses.map((analysis) => (
                        <TableRow key={analysis.id}>
                          <TableCell className="max-w-md">
                            <p className="text-sm">{analysis.query}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {analysis.ai_engine}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {analysis.position !== null ? (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {analysis.position || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="relative">
                  <div className="blur-sm opacity-50 pointer-events-none">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead>Engine</TableHead>
                          <TableHead>Mentioned</TableHead>
                          <TableHead>Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyses.slice(0, 3).map((analysis) => (
                          <TableRow key={analysis.id}>
                            <TableCell>Query text...</TableCell>
                            <TableCell><Badge>Engine</Badge></TableCell>
                            <TableCell><Badge>Yes</Badge></TableCell>
                            <TableCell>1</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-card border border-border rounded-lg p-6 text-center shadow-lg">
                      <Lock className="h-12 w-12 mx-auto mb-3 text-primary" />
                      <h4 className="font-semibold mb-2">Upgrade for Full Query Breakdown</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        See detailed results for all queries
                      </p>
                      <Button onClick={() => navigate("/pricing")}>
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisDetailsDialog;
