import { RecurringReviewsList } from '@/components/meetings/recurring-reviews';

export default function RecurringReviewsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recurring Meeting Reviews</h1>
        <p className="text-sm text-muted-foreground">
          AI recommendations to keep, review, or cancel recurring meetings
        </p>
      </div>
      <RecurringReviewsList />
    </div>
  );
}
