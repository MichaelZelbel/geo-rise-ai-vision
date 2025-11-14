import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";

interface BrandsOverviewProps {
  userId: string;
}

const BrandsOverview = ({ userId }: BrandsOverviewProps) => {
  const { data: brands = [] } = useQuery({
    queryKey: ["brands", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Brands</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            Manage Brands
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {brands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No brands yet. Create your first brand to get started!
            </p>
          ) : (
            brands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{brand.name}</h4>
                    <p className="text-sm text-muted-foreground">{brand.topic}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{brand.visibility_score}</p>
                  <p className="text-xs text-muted-foreground">Visibility Score</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandsOverview;
