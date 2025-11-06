import { Target, Zap, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Connect Your Brand",
    description: "Link your brand assets and let our AI analyze your current visibility across platforms.",
  },
  {
    icon: Zap,
    title: "AI Optimization",
    description: "Our intelligent system continuously optimizes your presence across all AI search platforms.",
  },
  {
    icon: TrendingUp,
    title: "Watch Growth",
    description: "Monitor real-time improvements in your AI visibility and search rankings across platforms.",
  },
];

const Features = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            How GEO RISE Works
          </h2>
          <p className="text-lg text-foreground/70">
            Three simple steps to elevate your AI visibility
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative backdrop-blur-sm bg-card/30 border border-primary/10 rounded-2xl p-8 hover:border-accent/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20">
                    <Icon className="w-8 h-8 text-accent" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  
                  <p className="text-foreground/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
