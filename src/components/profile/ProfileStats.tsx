import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, BarChart3, Crown } from "lucide-react";

interface ProfileStatsProps {
  userId: string;
  plan: string;
}

const ProfileStats = ({ userId, plan }: ProfileStatsProps) => {
  const { data: brandsCount = 0 } = useQuery({
    queryKey: ["brands-count", userId],
    queryFn: async () => {
      const { count } = await supabase
        .from("brands")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return count || 0;
    },
  });

  const { data: analysesCount = 0 } = useQuery({
    queryKey: ["analyses-count", userId],
    queryFn: async () => {
      const { count } = await supabase
        .from("analysis_runs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return count || 0;
    },
  });

  const getPlanBadgeVariant = () => {
    switch (plan) {
      case "pro":
      case "giftedPro":
        return "default";
      case "business":
      case "giftedAgency":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPlanLabel = () => {
    switch (plan) {
      case "pro":
      case "giftedPro":
        return "Pro";
      case "business":
      case "giftedAgency":
        return "Business";
      default:
        return "Free";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{brandsCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{analysesCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          <Crown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Badge variant={getPlanBadgeVariant()} className="text-lg">
            {getPlanLabel()}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileStats;
