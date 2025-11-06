import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface EmptyStateProps {
  onStartAnalysis: () => void;
}

const EmptyState = ({ onStartAnalysis }: EmptyStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="p-6 bg-gradient-to-br from-primary to-secondary rounded-2xl">
            <Sparkles className="h-16 w-16 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Welcome to GEO RISE! 👋
        </h1>
        <p className="text-muted-foreground mb-6">
          Let's analyze your AI visibility and discover how the AIverse sees you
        </p>
        <Button
          onClick={onStartAnalysis}
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
        >
          Start Your First Analysis
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
