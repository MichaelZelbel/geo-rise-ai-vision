import ActionPlanCard from "@/components/dashboard/ActionPlanCard";
import SemanticAnalysisCard from "@/components/dashboard/SemanticAnalysisCard";
import CompetitorIntelligenceCard from "@/components/dashboard/CompetitorIntelligenceCard";
import CoachGEOvanniCard from "@/components/dashboard/CoachGEOvanniCard";

const TestLayout = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Layout Test - No Auth Required</h1>
        
        {/* Third Row - Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6">
          {/* Left Column - 3 stacked cards */}
          <div className="space-y-6">
            <CompetitorIntelligenceCard isPro={true} />
            <ActionPlanCard />
            <SemanticAnalysisCard />
          </div>
          
          {/* Right Column - Coach GEOvanni (should match left column height) */}
          <div className="min-h-full">
            <CoachGEOvanniCard brandId="test-brand-id" userPlan="pro" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLayout;
