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
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - 3 stacked cards */}
          <div className="flex-1 space-y-6">
            <CompetitorIntelligenceCard isPro={true} />
            <ActionPlanCard />
            <SemanticAnalysisCard />
          </div>
          
          {/* Right Column - Coach GEOvanni */}
          <div className="flex-1 flex flex-col">
            <CoachGEOvanniCard brandId="test-brand-id" userPlan="pro" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLayout;
