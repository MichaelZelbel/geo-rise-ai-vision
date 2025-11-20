import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReportsOverview from "@/components/reports/ReportsOverview";
import ScoreTrendChart from "@/components/reports/ScoreTrendChart";
import AnalysisHistoryTable from "@/components/reports/AnalysisHistoryTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface AnalysisRun {
  runId: string;
  date: string;
  score: number;
  mentions: string;
  totalQueries: number;
  mentionCount: number;
  change?: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPlan, setUserPlan] = useState<string>("free");
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [analysisRuns, setAnalysisRuns] = useState<AnalysisRun[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserEmail(session.user.email || "");
    await fetchUserData(session.user.id);
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Get user plan
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .single();

      if (profile) {
        setUserPlan(profile.plan);
      }

      // Get user's first brand
      const { data: brands } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (brands && brands.length > 0) {
        setSelectedBrand(brands[0]);
        await fetchAnalysisData(brands[0].id);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisData = async (brandId: string) => {
    try {
      // Fetch analysis runs directly from analysis_runs table
      const { data: runs, error } = await supabase
        .from("analysis_runs")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching analysis runs:", error);
        setAnalysisRuns([]);
        return;
      }

      if (!runs || runs.length === 0) {
        setAnalysisRuns([]);
        return;
      }

      // Map to AnalysisRun format
      const formattedRuns: AnalysisRun[] = runs.map((run, index) => ({
        runId: run.run_id,
        date: run.created_at,
        score: run.visibility_score || 0,
        mentions: `${run.total_mentions || 0}/${run.total_queries || 20}`,
        totalQueries: run.total_queries || 20,
        mentionCount: run.total_mentions || 0,
        change: index < runs.length - 1 ? (run.visibility_score || 0) - (runs[index + 1].visibility_score || 0) : undefined,
      }));

      setAnalysisRuns(formattedRuns);
    } catch (error) {
      console.error("Error fetching analysis data:", error);
      setAnalysisRuns([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader userEmail={userEmail} />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96 mb-8" />
          <Skeleton className="h-64" />
        </main>
      </div>
    );
  }

  if (!selectedBrand || analysisRuns.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader userEmail={userEmail} />
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Reports</h1>
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-border">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No reports yet</h2>
            <p className="text-muted-foreground mb-6">
              Run your first analysis to see insights
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail={userEmail} />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">
              Track your GEO visibility over time
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Brand: <span className="font-semibold text-foreground">{selectedBrand.name}</span>
          </div>
        </div>

        <ReportsOverview 
          analysisRuns={analysisRuns}
          brandCreatedAt={selectedBrand.created_at}
        />

        <ScoreTrendChart 
          analysisRuns={analysisRuns}
          userPlan={userPlan}
        />

        <div className="mt-8">
          <AnalysisHistoryTable 
            analysisRuns={analysisRuns}
            userPlan={userPlan}
            brandId={selectedBrand.id}
          />
        </div>
      </main>
    </div>
  );
};

export default Reports;
