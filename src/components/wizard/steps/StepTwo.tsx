import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface StepTwoProps {
  brandName: string;
  onBrandNameChange: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const StepTwo = ({ brandName, onBrandNameChange, onNext, onBack }: StepTwoProps) => {
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (brandName.trim().length < 2) {
      setError("Please enter at least 2 characters");
      return;
    }
    
    setError("");
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">What's your name or brand name?</h2>
        <p className="text-muted-foreground">
          Help us identify you in AI search results
        </p>
      </div>

      <div className="space-y-2">
        <Input
          value={brandName}
          onChange={(e) => {
            onBrandNameChange(e.target.value);
            setError("");
          }}
          placeholder="Your brand or personal name"
          className="h-14 text-lg"
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          size="lg"
          className="h-14"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1 h-14 text-lg bg-accent hover:bg-accent/90"
        >
          Analyze My Visibility
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};
