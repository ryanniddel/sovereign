'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RelationshipScoreBadgeProps {
  score: number;
  className?: string;
}

function getScoreStyles(score: number): string {
  if (score >= 70) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (score >= 40) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
  return 'bg-red-500/10 text-red-600 border-red-500/20';
}

export function RelationshipScoreBadge({ score, className }: RelationshipScoreBadgeProps) {
  return (
    <Badge variant="outline" className={cn(getScoreStyles(score), className)}>
      {score}
    </Badge>
  );
}
