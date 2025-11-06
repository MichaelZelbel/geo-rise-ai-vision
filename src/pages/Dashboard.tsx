import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import VisibilityScoreCard from "@/components/dashboard/VisibilityScoreCard";
import AIEngineBreakdownCard from "@/components/dashboard/AIEngineBreakdownCard";
import AnalysisStatusCard from "@/components/dashboard/AnalysisStatusCard";
import CompetitorSnapshotCard from "@/components/dashboard/CompetitorSnapshotCard";
import QuickWinsCard from "@/components/dashboard/QuickWinsCard";
import TopMentionsCard from "@/components/dashboard/TopMentionsCard";
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
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
              toast.error("Analysis failed. Please try running it manually.");
            } else {
              toast.success(`Analysis complete! Your visibility score is ${data.score}`);
              loadDashboardData(userId);
            }
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
          .select("ai_engine")
          .eq("brand_id", brandData.id);

        if (analysesError) throw analysesError;

        const engines = [...new Set(analysesData?.map((a) => a.ai_engine) || [])];
        setMentionedEngines(engines);
        setHasAnalysis(analysesData && analysesData.length > 0);
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
      <div className="min-h-screen bg-background">
        <DashboardHeader userEmail={user?.email} />
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail={user.email} />
      <main className="container mx-auto px-4 py-8">
        {!brand ? (
          <EmptyState onStartAnalysis={handleStartAnalysis} />
        ) : (
          <div className="space-y-6">
            {/* First Row - Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <VisibilityScoreCard 
                score={brand.visibility_score} 
                lastRun={brand.last_run}
              />
              <AIEngineBreakdownCard mentionedEngines={mentionedEngines} />
              <AnalysisStatusCard hasAnalysis={hasAnalysis} isPro={isPro} />
            </div>

            {/* Second Row - Competitors and Quick Win */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <CompetitorSnapshotCard isPro={isPro} />
              </div>
              <QuickWinsCard topic={brand.topic} />
            </div>

            {/* Third Row - Top Mentions */}
            <TopMentionsCard isPro={isPro} />
          </div>
        )}
      </main>
      <WizardModal 
        open={showWizard} 
        onOpenChange={setShowWizard} 
      />
    </div>
  );
};

export default Dashboard;
