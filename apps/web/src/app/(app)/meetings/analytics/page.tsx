import { MeetingAnalyticsDashboard } from '@/components/meetings/analytics-dashboard';

export default function MeetingAnalyticsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meeting Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Cost tracking, qualification rates, and meeting ROI
        </p>
      </div>
      <MeetingAnalyticsDashboard />
    </div>
  );
}
