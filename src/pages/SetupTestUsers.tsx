import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const SetupTestUsers = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const createTestUsers = async () => {
    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("create-test-users", {
        body: {}
      });

      if (error) {
        throw error;
      }

      setResults(data);
      toast({
        title: "Success!",
        description: "Test users created successfully",
      });
    } catch (error: any) {
      console.error("Error creating test users:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create test users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Setup Test Users</CardTitle>
          <CardDescription>
            Create test users for development and testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Test Users to be Created:</h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 rounded-lg border border-border bg-muted/50">
                <p className="font-medium">1. Free User</p>
                <p className="text-muted-foreground">Email: fred@free.com | Brand: Gary Vaynerchuck | Topic: Social Media</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/50">
                <p className="font-medium">2. Pro User (Gifted)</p>
                <p className="text-muted-foreground">Email: peter@pro.com | Brand: Michael Zelbel | Topic: Photography</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/50">
                <p className="font-medium">3. Business User (Gifted)</p>
                <p className="text-muted-foreground">Email: benny@business.com | Brand: Richard Branson | Topic: Entrepreneurship</p>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/50">
                <p className="font-medium">4. Admin User</p>
                <p className="text-muted-foreground">Email: alice@admin.com | Brand: Michael Zelbel | Topic: AI</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              All accounts use password: <code className="bg-muted px-2 py-1 rounded">Dell@123</code>
            </p>
          </div>

          <Button 
            onClick={createTestUsers} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Users...
              </>
            ) : (
              "Create Test Users"
            )}
          </Button>

          {results && (
            <div className="space-y-2">
              <h3 className="font-semibold">Results:</h3>
              {results.results?.map((result: any) => (
                <div 
                  key={result.email}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    result.success 
                      ? 'border-green-500/20 bg-green-500/10' 
                      : 'border-destructive/20 bg-destructive/10'
                  }`}
                >
                  <div>
                    <p className="font-medium">{result.email}</p>
                    {result.userId && (
                      <p className="text-xs text-muted-foreground">User ID: {result.userId}</p>
                    )}
                    {result.error && (
                      <p className="text-xs text-destructive">{result.error}</p>
                    )}
                  </div>
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupTestUsers;
