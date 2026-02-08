'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useFocusModes } from '@/hooks/use-focus-modes';
import { FocusModeCard } from '@/components/focus-modes/focus-mode-card';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Shield } from 'lucide-react';
import type { FocusMode } from '@sovereign/shared';

export default function FocusModesPage() {
  const { data: modes, isLoading } = useFocusModes();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Focus Modes</h1>
        <Button asChild><Link href="/focus-modes/new"><Plus className="mr-1 h-4 w-4" />New</Link></Button>
      </div>
      {!modes?.length ? (
        <EmptyState icon={Shield} title="No focus modes" description="Create your first focus mode" actionLabel="Create" onAction={() => {}} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode: FocusMode) => <FocusModeCard key={mode.id} focusMode={mode} />)}
        </div>
      )}
    </div>
  );
}
