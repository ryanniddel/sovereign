'use client';

import { useParams } from 'next/navigation';
import { useMeeting } from '@/hooks/use-meetings';
import { RecapForm } from '@/components/meetings/recap-form';
import { PageSkeleton } from '@/components/shared/loading-skeleton';

export default function MeetingRecapPage() {
  const { id } = useParams<{ id: string }>();
  const { data: meeting, isLoading } = useMeeting(id);

  if (isLoading) return <PageSkeleton />;
  if (!meeting) return <p>Meeting not found</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Submit Recap</h1>
      <RecapForm meetingId={id} meetingTitle={meeting.title} />
    </div>
  );
}
