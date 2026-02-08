'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRecurringReviews } from '@/hooks/use-meetings';
import { DollarSign, Star, Users, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

const RECOMMENDATION_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  KEEP: { label: 'Keep', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  REVIEW: { label: 'Review', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertTriangle },
  CANCEL: { label: 'Cancel', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
};

export function RecurringReviewsList() {
  const { data: reviews, isLoading } = useRecurringReviews();

  if (isLoading) return <Skeleton className="h-64" />;

  if (!reviews?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No recurring meetings to review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const cfg = RECOMMENDATION_CONFIG[review.recommendation];
        const Icon = cfg.icon;
        return (
          <Card key={review.meetingId}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{review.title}</h3>
                    <Badge variant="outline" className={cfg.color}>
                      <Icon className="mr-1 h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{review.reasonForRecommendation}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {review.totalOccurrences} occurrences
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {review.averageRating?.toFixed(1) ?? '--'} avg rating
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${review.totalCost.toFixed(0)} total cost
                    </span>
                    <span>${review.averageCost.toFixed(0)} avg/meeting</span>
                    <span>{review.averageAttendance.toFixed(1)} avg attendance</span>
                    {review.percentRatedUnnecessary > 0 && (
                      <span className="text-red-400">
                        {(review.percentRatedUnnecessary * 100).toFixed(0)}% rated unnecessary
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/meetings/${review.meetingId}`}>View</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
