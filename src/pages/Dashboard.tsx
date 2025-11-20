import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HeroMetricsCard from "@/components/dashboard/HeroMetricsCard";
import AIEngineCard from "@/components/dashboard/AIEngineCard";
import ActionPlanCard from "@/components/dashboard/ActionPlanCard";
import SemanticAnalysisCard from "@/components/dashboard/SemanticAnalysisCard";
import CompetitorIntelligenceCard from "@/components/dashboard/CompetitorIntelligenceCard";
import CoachGEOvanniCard from "@/components/dashboard/CoachGEOvanniCard";
import EmptyState from "@/components/dashboard/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { WizardModal } from "@/components/wizard/WizardModal";

interface Brand {
  id: string;
  name: string;
  topic: string;
  visibility_score: number;
  last_run: string | null;
}

interface Profile {
  plan: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mentionedEngines, setMentionedEngines] = useState<string[]>([]);
  const [engineScores, setEngineScores] = useState<Record<string, { score: number; status: string }>>({});
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // React Query for latest analysis run - polls only when analysis is running
  const { data: lastAnalysisRun } = useQuery({
    queryKey: ["latest-analysis-run", brand?.id],
    queryFn: async () => {
      if (!brand?.id) return null;

      const { data: latestRun } = await supabase
        .from("analysis_runs")
        .select("*")
        .eq("brand_id", brand.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return latestRun ? {
        date: latestRun.completed_at || latestRun.created_at,
        score: latestRun.visibility_score || 0,
        mentions: latestRun.total_mentions || 0,
        completionPercentage: latestRun.completion_percentage || 0,
        status: latestRun.status,
      } : null;
    },
    enabled: !!brand?.id,
    refetchInterval: (query) => {
      // Only poll every 2 seconds when analysis is running
      const status = query.state.data?.status;
      return (status === 'pending' || status === 'processing') ? 2000 : false;
    },
  });

  const topicParam = searchParams.get("topic");
  const brandParam = searchParams.get("brand");

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadDashboardData(session.user.id);

        // Create brand if we have the data from wizard
        if (topicParam && brandParam) {
          createBrand(session.user.id, brandParam, topicParam);
        }
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [topicParam, brandParam]);

  // Realtime subscription for analysis_runs updates
  useEffect(() => {
    if (!brand?.id) return;

    const channel = supabase
      .channel('analysis-runs-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'analysis_runs',
          filter: `brand_id=eq.${brand.id}`
        },
        (payload) => {
          console.log('Realtime analysis update:', payload);
          // Invalidate query to refetch latest data
          queryClient.invalidateQueries({ queryKey: ["latest-analysis-run", brand.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [brand?.id, queryClient]);


  const createBrand = async (userId: string, brandName: string, topicName: string) => {
    try {
      const { data: newBrand, error } = await supabase.from("brands").insert({
        user_id: userId,
        name: brandName,
        topic: topicName,
      }).select().single();

      if (error) throw error;

      toast.success("Brand created successfully!");

      // Clear URL params
      navigate("/dashboard", { replace: true });

      // Trigger analysis in background
      if (newBrand) {
        toast.info("Starting AI visibility analysis...");

        supabase.functions
          .invoke('run-analysis', {
            body: {
              brandId: newBrand.id,
              brandName: brandName,
              topic: topicName,
              userId: userId
            }
          })
          .then(({ data, error }) => {
            if (error) {
              console.error("Analysis error:", error);
              toast.error(error.message || "Failed to start analysis.");
            } else {
              // Invalidate query immediately to start polling
              queryClient.invalidateQueries({ queryKey: ["latest-analysis-run", newBrand.id] });
              toast.success("Analysis started! We'll refresh your dashboard when complete.");
            }
          })
          .catch((err) => {
            console.error("Analysis request failed:", err);
            toast.error(err?.message || "Failed to send request to analysis function.");
          });
      }

      loadDashboardData(userId);
    } catch (err) {
      console.error("Error creating brand:", err);
      toast.error("Failed to create brand");
    }
  };

  const loadDashboardData = async (userId: string) => {
    try {
      // Fetch user's brand
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (brandError) throw brandError;
      setBrand(brandData);

      // Fetch user's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // If brand exists, fetch analyses
      if (brandData) {
        const { data: analysesData, error: analysesError } = await supabase
          .from("analyses")
          .select("ai_engine, points_earned, sentiment, mentioned")
          .eq("brand_id", brandData.id);

        if (analysesError) throw analysesError;

        const engines = [...new Set(analysesData?.map((a) => a.ai_engine) || [])];
        setMentionedEngines(engines);
        setHasAnalysis(analysesData && analysesData.length > 0);

        // Calculate per-engine scores
        const scores: Record<string, { score: number; status: string }> = {};
        engines.forEach(engine => {
          const engineData = analysesData?.filter(a => a.ai_engine === engine) || [];
          const avgScore = engineData.reduce((sum, a) => sum + (a.points_earned || 0), 0) / (engineData.length || 1);
          const positiveSentiment = engineData.filter(a => a.sentiment === 'positive').length;
          const negativeSentiment = engineData.filter(a => a.sentiment === 'negative').length;

          let status = "Sentiment Unknown";
          if (positiveSentiment > negativeSentiment) status = "Sentiment Positive";
          else if (negativeSentiment > 0) status = "Issues Found";

          scores[engine] = { score: Math.round(avgScore), status };
        });
        setEngineScores(scores);

        // Invalidate query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ["latest-analysis-run", brandData.id] });
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      toast.error("Failed to load dashboard data");
      setLoading(false);
    }
  };

  const handleStartAnalysis = () => {
    setShowWizard(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <DashboardHeader userEmail={user?.email} userPlan={profile?.plan} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const isPro = profile?.plan === 'pro' || profile?.plan === 'business' ||
    profile?.plan === 'giftedPro' || profile?.plan === 'giftedAgency';

  // Calculate Share of Voice
  const shareOfVoice = lastAnalysisRun?.score
    ? Math.round((lastAnalysisRun.mentions / (lastAnalysisRun.score / 5 || 1)) * 100)
    : 0;

  // All 8 AI engines
  const allEngines = [
    { id: "chatgpt", name: "ChatGPT" },
    { id: "claude", name: "Claude" },
    { id: "gemini", name: "Gemini" },
    { id: "perplexity", name: "Perplexity" },
    { id: "deepseek", name: "DeepSeek" },
    { id: "grok", name: "Grok" },
    { id: "mistral", name: "Mistral" },
    { id: "metaai", name: "Meta AI" }
  ];

  return (
    <div className="min-h-screen bg-background pt-20">
      <DashboardHeader userEmail={user.email} userPlan={profile?.plan} />
      <main className="container mx-auto px-4 py-8">
        {!brand ? (
          <EmptyState onStartAnalysis={handleStartAnalysis} />
        ) : (
          <div className="space-y-6">
            {/* First Row - Unified Hero Metrics */}
            <HeroMetricsCard
              visibilityScore={brand.visibility_score}
              shareOfVoice={shareOfVoice}
              totalMentions={lastAnalysisRun?.mentions || 0}
              brandName={brand.name}
              topic={brand.topic}
              brandId={brand.id}
              userId={user.id}
              lastRun={brand.last_run}
              isAnalysisRunning={lastAnalysisRun?.status === 'pending' || lastAnalysisRun?.status === 'processing'}
              analysisStatus={lastAnalysisRun?.status}
              analysisProgress={lastAnalysisRun?.completionPercentage}
              onAnalysisStarted={(runId) => {
                queryClient.invalidateQueries({ queryKey: ["latest-analysis-run", brand.id] });
              }}
            />

            {/* Second Row - AI Engine Breakdown (4x2 grid) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allEngines.map((engine) => {
                const hasData = mentionedEngines.includes(engine.id);
                const engineData = engineScores[engine.id];
                return (
                  <AIEngineCard
                    key={engine.id}
                    name={engine.name}
                    score={engineData?.score}
                    status={engineData?.status}
                    hasData={hasData}
                  />
        open = { showWizard }
                onOpenChange = { setShowWizard }
                  />
    </div>
            );
};

            export default Dashboard;
