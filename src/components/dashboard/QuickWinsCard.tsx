import { Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";

interface QuickWinsCardProps {
  topic: string;
}

const tips = [
  (topic: string) =>
    `Publish a detailed guide about ${topic} with practical examples`,
  () => "Add your expertise to your LinkedIn About section",
  (topic: string) => `Create a Twitter thread about ${topic} best practices`,
  (topic: string) =>
    `Start a podcast discussing ${topic} trends and insights`,
  (topic: string) =>
    `Write a case study showcasing your ${topic} success stories`,
];

const QuickWinsCard = ({ topic }: QuickWinsCardProps) => {
  const [currentTip, setCurrentTip] = useState("");

  useEffect(() => {
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setCurrentTip(randomTip(topic));
  }, [topic]);

  return (
    <div className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl p-6 border border-accent/20 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-accent/20 rounded-lg">
          <Lightbulb className="h-5 w-5 text-accent" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground">
          💡 Quick Win
        </h3>
      </div>
      <p className="text-card-foreground mb-4">{currentTip}</p>
      <p className="text-xs text-muted-foreground">
        Pro users get personalized AI recommendations
      </p>
    </div>
  );
};

export default QuickWinsCard;
