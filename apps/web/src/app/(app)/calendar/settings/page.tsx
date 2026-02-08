'use client';

import { ProtectionRulesManager } from '@/components/calendar/protection-rules-manager';
import { SyncConfigsManager } from '@/components/calendar/sync-configs-manager';

export default function CalendarSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage protection rules and external calendar sync
        </p>
      </div>
      <ProtectionRulesManager />
      <SyncConfigsManager />
    </div>
  );
}
