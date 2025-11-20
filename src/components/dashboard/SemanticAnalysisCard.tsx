import { Brain, Tag } from "lucide-react";

interface SemanticAnalysisCardProps {
  score?: number;
  keywords?: string[];
}

const defaultKeywords = ["Innovative", "Expert", "Leader", "Professional", "Reliable"];

const SemanticAnalysisCard = ({ score = 0, keywords = defaultKeywords }: SemanticAnalysisCardProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-destructive";
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Semantic Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Brand attribute alignment
          </p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">Alignment score</p>
      </div>
      
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
          <Tag className="h-3 w-3" />
          Associated Keywords
        </p>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
        How AI engines describe your brand
      </p>
    </div>
  );
};

export default SemanticAnalysisCard;
