import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { RunAnalysisButton } from "./RunAnalysisButton";
import { Cell, PieChart, Pie } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";
import ScoreTrendSparkline from "./ScoreTrendSparkline";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HeroMetricsCardProps {
  visibilityScore: number;
  scoreTrend?: number;
  sparklineData?: Array<{ score: number }>;
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
  scoreTrend,
  sparklineData,
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [localAnalysisRunning, setLocalAnalysisRunning] = useState(false);

  // Keep a local "start" state so the button and progress bar respond immediately
  useEffect(() => {
    if (analysisStatus === 'completed' || analysisStatus === 'failed') {
      setLocalAnalysisRunning(false);
    }
  }, [analysisStatus]);

  const isRunning = isAnalysisRunning || localAnalysisRunning;

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
          <div className="flex items-end justify-between gap-4 mb-2">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {visibilityScore}
            </div>
            {sparklineData && sparklineData.length > 1 && (
              <ScoreTrendSparkline data={sparklineData} />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm mb-4">
            {scoreTrend !== undefined && scoreTrend !== 0 ? (
              <>
                <TrendingUp className={`h-4 w-4 ${scoreTrend > 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={scoreTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                  {scoreTrend > 0 ? '+' : ''}{scoreTrend.toFixed(2)} pts
                </span>
                <span className="text-muted-foreground">vs last run</span>
              </>
            ) : (
              <span className="text-muted-foreground">No previous run to compare</span>
            )}
          </div>
          <Button 
            onClick={() => navigate("/reports")} 
            variant="default" 
            size="sm"
            className="w-full mb-4"
          >
            Report
          </Button>
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
            <div className="relative flex items-center justify-center">
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="text-xl font-bold text-primary">{shareOfVoice}%</div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">of search results</p>
            </div>
          </div>
        </div>

        {/* Total Mentions Card */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">Total Mentions</p>
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="text-xl font-bold text-accent">{totalMentions}</div>
              </div>
            </div>
            <div>
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
              {isRunning && analysisProgress !== undefined && (
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
                onAnalysisStarted={(runId) => {
                  setLocalAnalysisRunning(true);
                  onAnalysisStarted?.(runId);
                }}
                isAnalysisRunning={isRunning}
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
          <div className="flex items-end justify-between gap-4 mb-2">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {visibilityScore}
            </div>
            {sparklineData && sparklineData.length > 1 && (
              <ScoreTrendSparkline data={sparklineData} />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm mb-4">
            {scoreTrend !== undefined && scoreTrend !== 0 ? (
              <>
                <TrendingUp className={`h-4 w-4 ${scoreTrend > 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={scoreTrend > 0 ? 'text-green-500' : 'text-red-500'}>
                  {scoreTrend > 0 ? '+' : ''}{scoreTrend.toFixed(2)} pts
                </span>
                <span className="text-muted-foreground">vs last run</span>
              </>
            ) : (
              <span className="text-muted-foreground">No previous run to compare</span>
            )}
          </div>
          <Button 
            onClick={() => navigate("/reports")} 
            variant="default" 
            size="default"
            className="w-full mb-4"
          >
            Report
          </Button>
          {lastRun && (
            <p className="text-xs text-muted-foreground">
              Last run: {new Date(lastRun).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Section 2: Share of Voice with circular chart */}
        <div className="p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-card-foreground mb-3">Share of Voice</h3>
          <div className="relative flex items-center justify-center">
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-2xl font-bold text-primary">{shareOfVoice}%</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">of search results</p>
        </div>

        {/* Section 3: Total Mentions with circular chart */}
        <div className="p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-card-foreground mb-3">Total Mentions</h3>
          <div className="relative flex items-center justify-center">
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="text-2xl font-bold text-accent">{totalMentions}</div>
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
        {isRunning && analysisProgress !== undefined && (
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
          onAnalysisStarted={(runId) => {
            setLocalAnalysisRunning(true);
            onAnalysisStarted?.(runId);
          }}
          isAnalysisRunning={isRunning}
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
