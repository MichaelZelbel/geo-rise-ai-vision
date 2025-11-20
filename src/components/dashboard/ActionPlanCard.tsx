import { Target, CheckCircle2 } from "lucide-react";

interface ActionPlanCardProps {
  actions?: string[];
}

const defaultActions = [
  "Optimize your LinkedIn profile with target keywords",
  "Publish 2-3 thought leadership articles this month",
  "Engage with relevant AI communities and discussions"
];

const ActionPlanCard = ({ actions = defaultActions }: ActionPlanCardProps) => {
  return (
    <div className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl p-6 border border-accent/20 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-accent/20 rounded-lg">
          <Target className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            3-Point Action Plan
          </h3>
          <p className="text-sm text-muted-foreground">
            Recommended next steps
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {actions.slice(0, 3).map((action, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
            <CheckCircle2 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <p className="text-sm text-card-foreground">{action}</p>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-4">
        Pro users get AI-powered personalized recommendations
      </p>
    </div>
  );
};

export default ActionPlanCard;
