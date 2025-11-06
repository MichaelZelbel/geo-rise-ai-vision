import { Check, X } from "lucide-react";

interface AIEngineBreakdownCardProps {
  mentionedEngines: string[];
}

const engines = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
  { id: "gemini", name: "Gemini" },
  { id: "perplexity", name: "Perplexity" },
  { id: "bing", name: "Bing Copilot" },
];

const AIEngineBreakdownCard = ({ mentionedEngines }: AIEngineBreakdownCardProps) => {
  const isMentioned = (engineId: string) =>
    mentionedEngines.includes(engineId);

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">
          AI Engine Mentions
        </h3>
        <p className="text-sm text-muted-foreground">
          Which AI engines know about you
        </p>
      </div>
      <div className="space-y-3">
        {engines.map((engine) => (
          <div
            key={engine.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
          >
            <span className="text-sm font-medium text-card-foreground">
              {engine.name}
            </span>
            {isMentioned(engine.id) ? (
              <Check className="h-5 w-5 text-accent" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
      {mentionedEngines.length === 0 && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Run your first analysis to see results
        </p>
      )}
    </div>
  );
};

export default AIEngineBreakdownCard;
