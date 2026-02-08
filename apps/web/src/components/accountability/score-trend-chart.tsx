'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { AccountabilityScore } from '@sovereign/shared';

interface ScoreTrendChartProps {
  scores: AccountabilityScore[];
}

export function ScoreTrendChart({ scores }: ScoreTrendChartProps) {
  const chartData = scores.map((s) => ({
    date: format(new Date(s.date), 'MMM d'),
    score: Math.round(s.score * 100),
    onTimeRate: Math.round(s.onTimeRate * 100),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Accountability Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="onTimeRate" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
