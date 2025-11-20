import { LineChart, Line, ResponsiveContainer } from "recharts";

interface ScoreTrendSparklineProps {
  data: Array<{ score: number }>;
}

const ScoreTrendSparkline = ({ data }: ScoreTrendSparklineProps) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScoreTrendSparkline;
