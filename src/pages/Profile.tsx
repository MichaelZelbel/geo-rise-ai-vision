import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Settings, TrendingUp, FileText, Crown } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import ProfileStats from "@/components/profile/ProfileStats";
import RecentActivity from "@/components/profile/RecentActivity";
import BrandsOverview from "@/components/profile/BrandsOverview";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<{
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    plan: string;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("Failed to load profile");
      return;
    }

    setProfile(profileData);
    setLoading(false);
  };

  const updateProfile = async () => {
    if (!profile) return;

    setUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully!");
    }
    setUpdating(false);
  };

  const handleAvatarUpdate = (url: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader userEmail="" userPlan="" />
        <div className="flex items-center justify-center h-screen">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail={profile.email} userPlan={profile.plan} />
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Manage your account information and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 flex justify-center md:justify-start">
                  <ProfileAvatar
                    avatarUrl={profile.avatar_url}
                    displayName={profile.display_name}
                    email={profile.email}
                    onAvatarUpdate={handleAvatarUpdate}
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name || ""}
                      onChange={(e) =>
                        setProfile({ ...profile, display_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={profile.email} disabled />
                    <p className="text-xs text-muted-foreground mt-1">
                      To change your email, visit{" "}
                      <Link to="/account" className="underline">
                        Account Settings
                      </Link>
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ""}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Member since {format(new Date(profile.created_at), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <Button onClick={updateProfile} disabled={updating}>
                    {updating ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <ProfileStats userId={profile.id} plan={profile.plan} />

          {/* Recent Activity & Brands Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity userId={profile.id} />
            <BrandsOverview userId={profile.id} />
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto py-4" asChild>
                  <Link to="/dashboard" className="flex flex-col items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Run Analysis</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4" asChild>
                  <Link to="/reports" className="flex flex-col items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <span>View Reports</span>
                  </Link>
                </Button>
                {(profile.plan === "free") && (
                  <Button variant="outline" className="h-auto py-4" asChild>
                    <Link to="/pricing" className="flex flex-col items-center gap-2">
                      <Crown className="w-5 h-5" />
                      <span>Upgrade Plan</span>
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="h-auto py-4" asChild>
                  <Link to="/account" className="flex flex-col items-center gap-2">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
