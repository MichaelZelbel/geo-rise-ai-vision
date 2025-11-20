import { TrendingUp } from "lucide-react";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { Cell, PieChart, Pie } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";

interface HeroMetricsCardProps {
  visibilityScore: number;
  shareOfVoice: number;
  totalMentions: number;
  brandName: string;
  topic: string;
  brandId: string;
  userId: string;
  lastRun: string | null;
  isAnalysisRunning?: boolean;
  analysisStatus?: string;
  analysisProgress?: number;
  onAnalysisStarted?: (runId: string) => void;
}

const HeroMetricsCard = ({
  visibilityScore,
  shareOfVoice,
  totalMentions,
  brandName,
  topic,
  brandId,
  userId,
  lastRun,
  isAnalysisRunning = false,
  analysisStatus,
  analysisProgress = 0,
  onAnalysisStarted,
}: HeroMetricsCardProps) => {
  const isMobile = useIsMobile();

  // Circular chart data for Share of Voice
  const shareOfVoiceData = [
    { value: shareOfVoice, fill: "hsl(var(--primary))" },
    { value: 100 - shareOfVoice, fill: "hsl(var(--muted))" },
  ];

  // Circular chart data for Total Mentions (showing as a progress ring)
  const mentionsData = [
    { value: totalMentions > 0 ? 75 : 0, fill: "hsl(var(--accent))" },
    { value: 25, fill: "hsl(var(--muted))" },
  ];

  if (isMobile) {
    // Stack as separate cards on mobile
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Visibility Score Card */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">GEO Visibility Score</p>
          <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            {visibilityScore}
          </div>
          <div className="flex items-center gap-2 text-sm mb-4">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-500">+5 pts</span>
            <span className="text-muted-foreground">vs last run</span>
          </div>
          {lastRun && (
            <p className="text-xs text-muted-foreground">
              Last run: {new Date(lastRun).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Share of Voice Card */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">Share of Voice</p>
          <div className="flex items-center gap-4">
            <PieChart width={80} height={80}>
              <Pie
                data={shareOfVoiceData}
                cx={40}
                cy={40}
                innerRadius={25}
                outerRadius={35}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {shareOfVoiceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
            <div>
              <div className="text-3xl font-bold text-primary">{shareOfVoice}%</div>
              <p className="text-xs text-muted-foreground">of search results</p>
            </div>
          </div>
        </div>

        {/* Total Mentions Card */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">Total Mentions</p>
          <div className="flex items-center gap-4">
            <PieChart width={80} height={80}>
              <Pie
                data={mentionsData}
                cx={40}
                cy={40}
                innerRadius={25}
                outerRadius={35}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {mentionsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
            <div>
              <div className="text-3xl font-bold text-accent">{totalMentions}</div>
              <p className="text-xs text-muted-foreground">times featured</p>
            </div>
          </div>
        </div>

        {/* Brand Info & Run Analysis Card */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Brand</p>
              <p className="font-semibold text-foreground">{brandName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Topic</p>
              <p className="font-semibold text-foreground">{topic}</p>
            </div>
            <div className="pt-2">
              {isAnalysisRunning && analysisProgress !== undefined && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Analyzing...</span>
                    <span className="font-medium">{Math.round(analysisProgress)}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}
              <RunAnalysisButton
                brandId={brandId}
                brandName={brandName}
                topic={topic}
                userId={userId}
                onAnalysisStarted={onAnalysisStarted}
                isAnalysisRunning={isAnalysisRunning}
                variant="default"
                size="sm"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: Single unified card with dividers
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="grid grid-cols-4 divide-x divide-border">
        {/* Section 1: Visibility Score */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-1">GEO Visibility Score</h3>
          <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            {visibilityScore}
          </div>
          <div className="flex items-center gap-2 text-sm mb-4">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-500">+5 pts</span>
            <span className="text-muted-foreground">vs last run</span>
          </div>
          {lastRun && (
            <p className="text-xs text-muted-foreground">
              Last run: {new Date(lastRun).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Section 2: Share of Voice with circular chart */}
        <div className="p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-card-foreground mb-3">Share of Voice</h3>
          <div className="relative">
            <PieChart width={120} height={120}>
              <Pie
                data={shareOfVoiceData}
                cx={60}
                cy={60}
                innerRadius={40}
                outerRadius={55}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {shareOfVoiceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{shareOfVoice}%</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">of search results</p>
        </div>

        {/* Section 3: Total Mentions with circular chart */}
        <div className="p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-muted-foreground mb-3">Total Mentions</p>
          <div className="relative">
            <PieChart width={120} height={120}>
              <Pie
                data={mentionsData}
                cx={60}
                cy={60}
                innerRadius={40}
                outerRadius={55}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
              >
                {mentionsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{totalMentions}</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">times featured</p>
        </div>

        {/* Section 4: Brand Info & Run Analysis */}
        <div className="p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Brand</p>
              <p className="font-semibold text-foreground">{brandName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Topic</p>
              <p className="font-semibold text-foreground">{topic}</p>
            </div>
          </div>
          <div className="mt-4">
            {isAnalysisRunning && analysisProgress !== undefined && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Analyzing...</span>
                  <span className="font-medium">{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
              </div>
            )}
            <RunAnalysisButton
              brandId={brandId}
              brandName={brandName}
              topic={topic}
              userId={userId}
              onAnalysisStarted={onAnalysisStarted}
              isAnalysisRunning={isAnalysisRunning}
              variant="default"
              size="default"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroMetricsCard;
