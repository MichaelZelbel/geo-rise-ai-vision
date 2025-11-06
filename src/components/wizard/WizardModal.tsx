import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StepOne } from "./steps/StepOne";
import { StepTwo } from "./steps/StepTwo";
import { StepThree } from "./steps/StepThree";
import { StepFour } from "./steps/StepFour";

interface WizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WizardModal = ({ open, onOpenChange }: WizardModalProps) => {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [brandName, setBrandName] = useState("");

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  
  const handleReset = () => {
    setStep(1);
    setTopic("");
    setBrandName("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation completes
    setTimeout(handleReset, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 bg-background border-primary/20">
        <div className="p-6 md:p-12">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`h-2 w-2 rounded-full transition-all ${
                  step === num
                    ? "bg-accent w-8"
                    : step > num
                    ? "bg-accent/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[300px]">
            {step === 1 && (
              <StepOne
                topic={topic}
                onTopicChange={setTopic}
                onNext={handleNext}
              />
            )}
            {step === 2 && (
              <StepTwo
                brandName={brandName}
                onBrandNameChange={setBrandName}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {step === 3 && (
              <StepThree onComplete={handleNext} />
            )}
            {step === 4 && (
              <StepFour
                topic={topic}
                brandName={brandName}
                onComplete={handleClose}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
