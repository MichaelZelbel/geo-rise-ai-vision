import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import robotCharacter from "@/assets/robot-character.webp";
import { WizardModal } from "./wizard/WizardModal";
const Hero = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const el = document.querySelector('header') as HTMLElement | null;
    const compute = () => setHeaderH(el?.offsetHeight ?? 0);
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);
  return <>
      <WizardModal open={wizardOpen} onOpenChange={setWizardOpen} />
      <section className="relative px-4 pb-32 overflow-hidden flex flex-col items-center" style={{
      paddingTop: `calc(${headerH}px + 35px)`
    }}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto">
          {/* Robot Character - positioned above panel */}
          <div className="flex justify-center mt-0 mb-[-80px] relative z-20">
            <img src={robotCharacter} alt="AI Robot Assistant" className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl animate-float" />
          </div>

          {/* Main Panel */}
          <div className="relative backdrop-blur-xl bg-white/10 border border-primary/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
            <div className="absolute inset-0 rounded-3xl shadow-[0_0_40px_rgba(37,99,235,0.2)]" />
            
            <div className="relative text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-[60px] md:leading-[60px] pb-2">Your Brand Deserves
AI Visibility</h1>
              
              <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto">
                Elevate your presence across AI-powered search — before your competitors do.
              </p>

              <Button size="lg" onClick={() => setWizardOpen(true)} className="bg-accent hover:bg-accent/90 text-background font-semibold px-12 h-14 text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                Get Started 🚀
              </Button>

              <p className="text-sm text-foreground/60 mt-6 italic">
                Your intelligent visibility companion
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </section>
    </>;
};
export default Hero;