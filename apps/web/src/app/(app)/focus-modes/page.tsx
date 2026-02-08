'use client';

import { Button } from '@/components/ui/button';
import { Plus, BarChart3, Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useFocusModes, useActiveFocusMode, useDeactivateFocusMode, useSeedDefaultFocusModes } from '@/hooks/use-focus-modes';
import { FocusModeCard } from '@/components/focus-modes/focus-mode-card';
import { ActiveFocusIndicator } from '@/components/focus-modes/active-focus-indicator';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Shield } from 'lucide-react';
import type { FocusMode } from '@sovereign/shared';

export default function FocusModesPage() {
  const { data: modes, isLoading } = useFocusModes();
  const { data: activeResponse } = useActiveFocusMode();
  const deactivate = useDeactivateFocusMode();
  const seedDefaults = useSeedDefaultFocusModes();

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Focus Modes</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/focus-modes/analytics"><BarChart3 className="mr-1 h-4 w-4" />Analytics</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/focus-modes/sessions"><Clock className="mr-1 h-4 w-4" />Sessions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/focus-modes/overrides"><ShieldAlert className="mr-1 h-4 w-4" />Overrides</Link>
          </Button>
          <Button asChild>
            <Link href="/focus-modes/new"><Plus className="mr-1 h-4 w-4" />New</Link>
          </Button>
        </div>
      </div>

      {activeResponse && activeResponse.isActive && (
        <ActiveFocusIndicator
          focusMode={activeResponse}
          onDeactivate={() => deactivate.mutate(activeResponse.id)}
        />
      )}

      {!modes?.length ? (
        <EmptyState
          icon={Shield}
          title="No focus modes"
          description="Create your first focus mode or seed the defaults"
          actionLabel="Seed Defaults"
          onAction={() => seedDefaults.mutate()}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modes.map((mode: FocusMode) => <FocusModeCard key={mode.id} focusMode={mode} />)}
        </div>
      )}
    </div>
  );
}
