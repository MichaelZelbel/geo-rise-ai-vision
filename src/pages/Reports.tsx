import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReportsOverview from "@/components/reports/ReportsOverview";
import ScoreTrendChart from "@/components/reports/ScoreTrendChart";
import AnalysisHistoryTable from "@/components/reports/AnalysisHistoryTable";
import InsightsPanel from "@/components/reports/InsightsPanel";
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
  const [insights, setInsights] = useState<any[]>([]);

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
      // Fetch all analyses for this brand
      const { data: analyses } = await supabase
        .from("analyses")
        .select("*")
        .eq("brand_id", brandId)
        .order("occurred_at", { ascending: false });

      if (!analyses || analyses.length === 0) {
        setAnalysisRuns([]);
        return;
      }

      // Group by run_id
      const runMap = new Map<string, any[]>();
      analyses.forEach(analysis => {
        if (!runMap.has(analysis.run_id)) {
          runMap.set(analysis.run_id, []);
        }
        runMap.get(analysis.run_id)!.push(analysis);
      });

      // Calculate stats for each run
      const runs: AnalysisRun[] = Array.from(runMap.entries()).map(([runId, runAnalyses]) => {
        const mentions = runAnalyses.filter(a => a.position !== null).length;
        const totalQueries = new Set(runAnalyses.map(a => a.query)).size;
        const date = runAnalyses[0].occurred_at;
        
        return {
          runId,
          date,
          score: selectedBrand.visibility_score,
          mentions: `${mentions}/${totalQueries}`,
          totalQueries,
          mentionCount: mentions,
        };
      });

      // Calculate changes
      for (let i = 0; i < runs.length - 1; i++) {
        runs[i].change = runs[i].score - runs[i + 1].score;
      }

      setAnalysisRuns(runs);

      // Fetch insights for latest run
      if (runs.length > 0) {
        const { data: insightsData } = await supabase
          .from("insights")
          .select("*")
          .eq("brand_id", brandId)
          .eq("run_id", runs[0].runId);

        if (insightsData) {
          setInsights(insightsData);
        }
      }
    } catch (error) {
      console.error("Error fetching analysis data:", error);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2">
            <AnalysisHistoryTable 
              analysisRuns={analysisRuns}
              userPlan={userPlan}
              brandId={selectedBrand.id}
            />
          </div>
          <div>
            <InsightsPanel 
              insights={insights}
              userPlan={userPlan}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
