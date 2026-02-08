import { MeetingRequestForm } from '@/components/meetings/request-form';

export default function NewMeetingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Request Meeting</h1>
      <MeetingRequestForm />
    </div>
  );
}
