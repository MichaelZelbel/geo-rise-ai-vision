import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface StepThreeProps {
  onComplete: () => void;
}

const loadingMessages = [
  "Asking ChatGPT about you 🤖",
  "Checking Claude's knowledge 💭",
  "Searching Perplexity 🔍",
  "Querying Gemini ✨",
];

export const StepThree = ({ onComplete }: StepThreeProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1000);

    // Complete after 4 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-center py-12">
      <div className="space-y-3">
        <h2 className="text-3xl font-bold">Scanning the AIverse...</h2>
        <p className="text-muted-foreground">
          Analyzing your presence across AI platforms
        </p>
      </div>

      <div className="flex justify-center">
        <Loader2 className="h-16 w-16 text-accent animate-spin" />
      </div>

      <div className="min-h-[60px]">
        <p className="text-xl font-medium text-accent animate-pulse">
          {loadingMessages[messageIndex]}
        </p>
      </div>
    </div>
  );
};
