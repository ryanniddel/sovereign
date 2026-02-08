'use client';

import { useLatestNightlyBriefing, useGenerateNightlyBriefing } from '@/hooks/use-briefings';
import { BriefingCard } from '@/components/briefings/briefing-card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Moon } from 'lucide-react';

export default function NightlyBriefingPage() {
  const { data: briefing, isLoading } = useLatestNightlyBriefing();
  const generate = useGenerateNightlyBriefing();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Nightly Review</h1>
        <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
          {generate.isPending ? 'Generating...' : 'Generate New'}
        </Button>
      </div>
      {briefing ? (
        <BriefingCard briefing={briefing} />
      ) : (
        <EmptyState
          icon={Moon}
          title="No nightly review yet"
          description="Generate your first nightly review"
          actionLabel="Generate"
          onAction={() => generate.mutate()}
        />
      )}
    </div>
  );
}
