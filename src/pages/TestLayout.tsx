import { Skeleton } from "@/components/ui/skeleton";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import HeroMetricsCard from "@/components/dashboard/HeroMetricsCard";
import AIEngineCard from "@/components/dashboard/AIEngineCard";
import ActionPlanCard from "@/components/dashboard/ActionPlanCard";
import SemanticAnalysisCard from "@/components/dashboard/SemanticAnalysisCard";
import CompetitorIntelligenceCard from "@/components/dashboard/CompetitorIntelligenceCard";
import CoachGEOvanniCard from "@/components/dashboard/CoachGEOvanniCard";

const TestLayout = () => {
  // Mock data for testing
  const mockEngineScores = {
    chatgpt: { score: 75, status: "Positive Sentiment" },
    claude: { score: 68, status: "Positive Sentiment" },
    gemini: { score: 82, status: "Positive Sentiment" },
    perplexity: { score: 45, status: "Issues Detected" },
    deepseek: { score: 0, status: "Not Configured" },
    grok: { score: 0, status: "Not Configured" },
    mistral: { score: 0, status: "Not Configured" },
    metaai: { score: 0, status: "Not Configured" }
  };

  const mockMentionedEngines = ["chatgpt", "claude", "gemini", "perplexity"];

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
      <DashboardHeader userEmail="test@example.com" userPlan="pro" />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* First Row - Unified Hero Metrics */}
          <HeroMetricsCard
            visibilityScore={75}
            shareOfVoice={42}
            totalMentions={156}
            brandName="Test Brand"
            topic="AI Marketing"
            brandId="test-brand-id"
            userId="test-user-id"
            lastRun={new Date().toISOString()}
            isAnalysisRunning={false}
            analysisStatus="completed"
            analysisProgress={100}
            onAnalysisStarted={(runId) => { }}
          />

          {/* Second Row - AI Engine Breakdown (4x2 grid) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allEngines.map((engine) => {
              const hasData = mockMentionedEngines.includes(engine.id);
              const engineData = mockEngineScores[engine.id];
              return (
import { Skeleton } from "@/components/ui/skeleton";
              import DashboardHeader from "@/components/dashboard/DashboardHeader";
              import HeroMetricsCard from "@/components/dashboard/HeroMetricsCard";
              import AIEngineCard from "@/components/dashboard/AIEngineCard";
              import ActionPlanCard from "@/components/dashboard/ActionPlanCard";
              import SemanticAnalysisCard from "@/components/dashboard/SemanticAnalysisCard";
              import CompetitorIntelligenceCard from "@/components/dashboard/CompetitorIntelligenceCard";
              import CoachGEOvanniCard from "@/components/dashboard/CoachGEOvanniCard";

              const TestLayout = () => {
                // Mock data for testing
                const mockEngineScores = {
                  chatgpt: { score: 75, status: "Positive Sentiment" },
                  claude: { score: 68, status: "Positive Sentiment" },
                  gemini: { score: 82, status: "Positive Sentiment" },
                  perplexity: { score: 45, status: "Issues Detected" },
                  deepseek: { score: 0, status: "Not Configured" },
                  grok: { score: 0, status: "Not Configured" },
                  mistral: { score: 0, status: "Not Configured" },
                  metaai: { score: 0, status: "Not Configured" }
                };

                const mockMentionedEngines = ["chatgpt", "claude", "gemini", "perplexity"];

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
                    <DashboardHeader userEmail="test@example.com" userPlan="pro" />
                    <main className="container mx-auto px-4 py-8">
                      <div className="space-y-6">
                        {/* First Row - Unified Hero Metrics */}
                        <HeroMetricsCard
                          visibilityScore={75}
                          shareOfVoice={42}
                          totalMentions={156}
                          brandName="Test Brand"
                          topic="AI Marketing"
                          brandId="test-brand-id"
                          userId="test-user-id"
                          lastRun={new Date().toISOString()}
                          isAnalysisRunning={false}
                          analysisStatus="completed"
                          analysisProgress={100}
                          onAnalysisStarted={(runId) => { }}
                        />

                        {/* Second Row - AI Engine Breakdown (4x2 grid) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {allEngines.map((engine) => {
                            const hasData = mockMentionedEngines.includes(engine.id);
                            const engineData = mockEngineScores[engine.id];
                            return (
                              <AIEngineCard
                                key={engine.id}
                                name={engine.name}
                                score={engineData?.score}
                                status={engineData?.status}
                                hasData={hasData}
                              />
                            );
                          })}
                        </div>

                        {/* Third Row - Bottom Section */}
                        <div className="flex flex-col md:flex-row gap-6">
                          {/* Left Column - 3 stacked cards */}
                          <div className="flex-1 space-y-6">
                            <CompetitorIntelligenceCard isPro={true} />
                            <ActionPlanCard />
                            <SemanticAnalysisCard />
                          </div>

                          {/* Right Column - Coach GEOvanni */}
                          <div className="flex-1 flex flex-col h-full">
                            <CoachGEOvanniCard brandId="test-brand-id" userPlan="pro" className="h-full" />
                          </div>
                        </div>
                      </div>
                    </main>
                  </div>
                );
              };

              export default TestLayout;
