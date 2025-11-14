import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

interface RecentActivityProps {
  userId: string;
}

const RecentActivity = ({ userId }: RecentActivityProps) => {
  const { data: recentRuns = [] } = useQuery({
    queryKey: ["recent-runs", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analysis_runs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/reports">
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No analysis runs yet. Start your first analysis!
            </p>
          ) : (
            recentRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{run.brand_name}</h4>
                  <p className="text-sm text-muted-foreground">{run.topic}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(run.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {run.visibility_score !== null && (
                    <div className="text-right">
                      <p className="text-2xl font-bold">{run.visibility_score}</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  )}
                  {getStatusBadge(run.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
