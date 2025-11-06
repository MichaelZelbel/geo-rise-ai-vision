import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const topic = searchParams.get("topic");
  const brand = searchParams.get("brand");

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);

      // Create brand if we have the data and user is authenticated
      if (session?.user && topic && brand) {
        createBrand(session.user.id, brand, topic);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [topic, brand]);

  const createBrand = async (userId: string, brandName: string, topicName: string) => {
    try {
      const { error } = await supabase.from("brands").insert({
        user_id: userId,
        name: brandName,
        topic: topicName,
      });

      if (error) throw error;
      
      toast.success("Brand created successfully!");
      
      // Clear URL params
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Error creating brand:", err);
      toast.error("Failed to create brand");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Welcome to Your Dashboard</h1>
        <div className="bg-card rounded-lg p-6 border border-primary/20">
          <p className="text-lg text-muted-foreground">
            Logged in as: <strong>{user.email}</strong>
          </p>
          {topic && brand && (
            <div className="mt-4">
              <p className="text-muted-foreground">Brand: <strong>{brand}</strong></p>
              <p className="text-muted-foreground">Topic: <strong>{topic}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
