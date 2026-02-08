import { NotificationPreferencesForm } from '@/components/notifications/notification-preferences-form';

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
      <p className="text-muted-foreground">Configure how you receive notifications</p>
      <NotificationPreferencesForm />
    </div>
  );
}
