import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Key } from "lucide-react";

const GetCredentials = () => {
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-db-credentials');
      
      if (error) throw error;
      
      setCredentials(data);
      toast({
        title: "Success",
        description: "Database credentials retrieved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Key className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Database Credentials</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Database Access Credentials</CardTitle>
            <CardDescription>
              Retrieve your database connection string and service role key for n8n integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!credentials ? (
              <Button onClick={fetchCredentials} disabled={loading}>
                {loading ? "Fetching..." : "Get Credentials"}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Database URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={credentials.dbUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials.dbUrl, "Database URL")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Service Role Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={credentials.serviceRoleKey}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials.serviceRoleKey, "Service Role Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Supabase URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={credentials.supabaseUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials.supabaseUrl, "Supabase URL")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {credentials.instructions && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      💡 {credentials.instructions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GetCredentials;
