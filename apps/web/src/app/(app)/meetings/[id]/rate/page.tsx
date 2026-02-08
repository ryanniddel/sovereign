'use client';

import { useParams } from 'next/navigation';
import { RatingForm } from '@/components/meetings/rating-form';

export default function RateMeetingPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Rate Meeting</h1>
      <RatingForm meetingId={id} />
    </div>
  );
}
