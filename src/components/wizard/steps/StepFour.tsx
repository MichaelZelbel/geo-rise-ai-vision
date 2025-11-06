import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StepFourProps {
  topic: string;
  brandName: string;
  onComplete: () => void;
}

export const StepFour = ({ topic, brandName, onComplete }: StepFourProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Check rate limiting
  const checkRateLimit = () => {
    const lastAnalysis = localStorage.getItem("lastAnalysisDate");
    if (lastAnalysis) {
      const lastDate = new Date(lastAnalysis);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        return false; // Still within 24 hours
      }
    }
    return true; // Can proceed
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!checkRateLimit()) {
      toast.info("You've used your free analysis for today. Create an account for weekly updates!");
      // Still allow account creation
    }

    setError("");
    setIsLoading(true);

    try {
      // Send magic link
      const redirectUrl = `${window.location.origin}/dashboard?topic=${encodeURIComponent(topic)}&brand=${encodeURIComponent(brandName)}`;
      
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;

      // Store analysis date
      localStorage.setItem("lastAnalysisDate", new Date().toISOString());
      
      setEmailSent(true);
      toast.success("Check your email for a magic link!");
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onComplete();
      }, 3000);
      
    } catch (err) {
      console.error("Auth error:", err);
      setError(err instanceof Error ? err.message : "Failed to send magic link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300 text-center py-12">
        <div className="mx-auto w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
          <Mail className="h-10 w-10 text-accent" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">Check your email!</h2>
          <p className="text-muted-foreground">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in your email to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-3xl font-bold">Your results are ready!</h2>
        <p className="text-muted-foreground">
          Create a free account to view your GEO Visibility Score
        </p>
      </div>

      <div className="space-y-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="your@email.com"
          className="h-14 text-lg"
          autoFocus
          disabled={isLoading}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-14 text-lg bg-accent hover:bg-accent/90"
        disabled={isLoading}
      >
        {isLoading ? (
          "Sending magic link..."
        ) : (
          "Create Free Account"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        We'll send you a magic link to sign in. No password needed!
      </p>
    </form>
  );
};
