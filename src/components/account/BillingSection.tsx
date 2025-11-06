import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CreditCard, ExternalLink } from "lucide-react";

export default function BillingSection({ userId, plan }: any) {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    setSubscription(data);
    setLoading(false);
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to open billing portal");
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-48 bg-muted rounded"></div>
    </div>;
  }

  const isGifted = plan === "giftedPro" || plan === "giftedAgency";
  const isFree = plan === "free";

  if (isFree) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Subscription</CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Current Plan: Free</h3>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>• 1 brand</li>
              <li>• Weekly analysis</li>
              <li>• Limited history</li>
              <li>• Basic insights</li>
            </ul>
            <Button onClick={() => navigate("/pricing")} className="w-full">
              Upgrade to Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isGifted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Subscription</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Complimentary Access</h3>
                <p className="text-sm text-muted-foreground">
                  You have been granted {plan === "giftedPro" ? "Pro" : "Business"} access
                </p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Gifted
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Your account has full {plan === "giftedPro" ? "Pro" : "Business"} features at no cost.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription</CardTitle>
        <CardDescription>Manage your subscription and payment methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold capitalize">{plan} Plan</h3>
            <p className="text-2xl font-bold">
              ${plan === "pro" ? "29" : "99"}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            {subscription && (
              <>
                <Badge variant={subscription.plan === "free" ? "secondary" : "default"}>
                  Active
                </Badge>
                {subscription.active_until && (
                  <p className="text-sm text-muted-foreground">
                    Next billing: {new Date(subscription.active_until).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {subscription?.stripe_customer_id && (
          <div className="space-y-4 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleManageBilling}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Opens Stripe Customer Portal to update payment method, view invoices, or cancel subscription
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
