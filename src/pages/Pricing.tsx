import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Header from "@/components/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PRICE_IDS = {
  pro: "price_1SQXbNAiLddHHjhkDHD8mwPx",
  business: "price_1SQXbdAiLddHHjhk53mzMgVg",
};

const Pricing = () => {
  const [user, setUser] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      
      setCurrentPlan(profile?.plan || "free");
    }
    setLoading(false);
  };

  const handleCheckout = async (priceId: string, planName: string) => {
    if (!user) {
      navigate(`/auth?redirect=/pricing`);
      return;
    }

    setCheckoutLoading(planName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, planName },
      });

      if (error) throw error;
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out GEO RISE",
      planId: "free",
      features: [
        { text: "1 brand tracked", included: true },
        { text: "Weekly analysis updates", included: true },
        { text: "Basic visibility score", included: true },
        { text: "AI engine breakdown", included: true },
        { text: "Competitor names hidden", included: false },
        { text: "Limited query coverage (20 queries)", included: false },
        { text: "No optimization tips", included: false },
        { text: "Basic support", included: false },
      ],
      highlighted: false,
      badge: null,
    },
    {
      name: "Pro",
      price: "$29",
      description: "For professionals & consultants",
      planId: "pro",
      priceId: PRICE_IDS.pro,
      features: [
        { text: "3 brands tracked", included: true },
        { text: "Daily analysis updates", included: true },
        { text: "Full visibility scoring", included: true },
        { text: "AI engine breakdown with details", included: true },
        { text: "Full competitor visibility (up to 10)", included: true },
        { text: "100+ queries per industry", included: true },
        { text: "AI optimization tips", included: true },
        { text: "Historical data & trends", included: true },
        { text: "Email alerts", included: true },
        { text: "Export reports (PDF/CSV)", included: true },
        { text: "Priority support", included: true },
      ],
      highlighted: true,
      badge: "MOST POPULAR",
    },
    {
      name: "Business",
      price: "$99",
      description: "For agencies & teams",
      planId: "business",
      priceId: PRICE_IDS.business,
      features: [
        { text: "Everything in Pro, plus:", included: true },
        { text: "10 brands tracked", included: true },
        { text: "API access", included: true },
        { text: "White-label reports", included: true },
        { text: "Team collaboration", included: true },
        { text: "Client management", included: true },
        { text: "Batch analysis", included: true },
        { text: "Custom query sets", included: true },
        { text: "Dedicated support", included: true },
        { text: "Onboarding call", included: true },
      ],
      highlighted: false,
      badge: null,
    },
  ];

  const faqs = [
    {
      question: "Can I switch plans anytime?",
      answer: "Yes! Upgrade or downgrade anytime. Changes take effect immediately.",
    },
    {
      question: "What happens after the 7-day trial?",
      answer: "Your card will be charged automatically. Cancel anytime during the trial with no charge.",
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, cancel anytime from your Account settings. You'll retain access until the end of your billing period.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards via Stripe. Invoicing available for Business plans.",
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee if you're not satisfied.",
    },
    {
      question: "What does 'gifted' access mean?",
      answer: "Special accounts (giftedPro, giftedAgency) receive full features without billing. Contact us for partnership opportunities.",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {user ? <DashboardHeader userEmail={user?.email} /> : <Header />}
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {user ? <DashboardHeader userEmail={user?.email} /> : <Header />}
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Start free, upgrade anytime. No credit card required to start.
          </p>
          <p className="text-sm text-muted-foreground">
            All plans include 7-day free trial on paid tiers
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => {
            const isCurrentPlan = currentPlan === tier.planId || 
              (currentPlan === "giftedPro" && tier.planId === "pro") ||
              (currentPlan === "giftedAgency" && tier.planId === "business");
            
            return (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.highlighted
                    ? "border-primary shadow-2xl scale-105"
                    : tier.planId === "business"
                    ? "border-blue-500/30"
                    : "border-border"
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                      {tier.badge}
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <div className="mb-2">
                    <span className="text-5xl font-bold">{tier.price}</span>
                    {tier.planId !== "free" && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={tier.planId === "free" ? "outline" : tier.highlighted ? "default" : "secondary"}
                    disabled={isCurrentPlan || checkoutLoading !== null}
                    onClick={() => {
                      if (tier.planId === "free") {
                        navigate("/auth");
                      } else {
                        handleCheckout(tier.priceId!, tier.planId);
                      }
                    }}
                  >
                    {checkoutLoading === tier.planId ? (
                      "Processing..."
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : tier.planId === "free" ? (
                      user ? "Current Plan" : "Get Started Free"
                    ) : (
                      `Upgrade to ${tier.name}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-left font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Trust Indicators */}
        <div className="text-center py-8 border-t border-border">
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Secured by Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">256-bit SSL Encrypted</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Your payment information is secure and encrypted
          </p>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
