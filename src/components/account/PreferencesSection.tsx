import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PreferencesSection({ userId, profile }: any) {
  const [emailDigest, setEmailDigest] = useState(false);
  const [analysisNotifications, setAnalysisNotifications] = useState(true);
  const [scoreAlerts, setScoreAlerts] = useState(true);
  const [competitorUpdates, setCompetitorUpdates] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    // In a real implementation, save to preferences table
    setTimeout(() => {
      toast.success("Preferences saved successfully");
      setSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="emailDigest" 
              checked={emailDigest}
              onCheckedChange={(checked) => setEmailDigest(checked as boolean)}
            />
            <Label htmlFor="emailDigest" className="cursor-pointer">
              Weekly digest emails
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="analysisNotifications" 
              checked={analysisNotifications}
              onCheckedChange={(checked) => setAnalysisNotifications(checked as boolean)}
            />
            <Label htmlFor="analysisNotifications" className="cursor-pointer">
              Analysis complete notifications
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="scoreAlerts" 
              checked={scoreAlerts}
              onCheckedChange={(checked) => setScoreAlerts(checked as boolean)}
            />
            <Label htmlFor="scoreAlerts" className="cursor-pointer">
              Score change alerts
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="competitorUpdates" 
              checked={competitorUpdates}
              onCheckedChange={(checked) => setCompetitorUpdates(checked as boolean)}
            />
            <Label htmlFor="competitorUpdates" className="cursor-pointer">
              Competitor updates
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="productUpdates" 
              checked={productUpdates}
              onCheckedChange={(checked) => setProductUpdates(checked as boolean)}
            />
            <Label htmlFor="productUpdates" className="cursor-pointer">
              Product updates and tips
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Frequency</CardTitle>
          <CardDescription>Automatic analysis schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              {profile?.plan === "free" ? "Weekly (automated)" : "Daily (automated)"}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.plan === "free" && "Upgrade to Pro for daily analysis"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>Control how your data is used</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="aggregateData" defaultChecked />
            <Label htmlFor="aggregateData" className="cursor-pointer">
              Include my data in aggregate analytics
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="publicLeaderboard" />
            <Label htmlFor="publicLeaderboard" className="cursor-pointer">
              Share my brand in public leaderboard
            </Label>
          </div>
          
          <div className="pt-4 space-y-2">
            <Button variant="link" className="p-0 h-auto text-sm">
              View Privacy Policy
            </Button>
            <br />
            <Button variant="link" className="p-0 h-auto text-sm">
              View Terms of Service
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Preferences"}
      </Button>
    </div>
  );
}
