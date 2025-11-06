import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

interface StepOneProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  onNext: () => void;
}

export const StepOne = ({ topic, onTopicChange, onNext }: StepOneProps) => {
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (topic.trim().length < 3) {
      setError("Please enter at least 3 characters");
      return;
    }
    
    setError("");
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">What's your main focus or topic?</h2>
        <p className="text-muted-foreground">
          Tell us what you do so we can analyze your AI visibility
        </p>
      </div>

      <div className="space-y-2">
        <Input
          value={topic}
          onChange={(e) => {
            onTopicChange(e.target.value);
            setError("");
          }}
          placeholder="e.g., AI consulting, sustainable fashion, B2B SaaS"
          className="h-14 text-lg"
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg bg-accent hover:bg-accent/90"
      >
        Find My Visibility
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );
};
