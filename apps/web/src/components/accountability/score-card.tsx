'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ScoreCardProps {
  title: string;
  value: number;
  total: number;
  percentage: number;
}

export function ScoreCard({ title, value, total, percentage }: ScoreCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}/{total}</div>
        <Progress value={percentage} className="mt-2" />
        <p className="mt-1 text-xs text-muted-foreground">{Math.round(percentage)}% complete</p>
      </CardContent>
    </Card>
  );
}
