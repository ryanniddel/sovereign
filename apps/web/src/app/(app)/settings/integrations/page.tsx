'use client';

import { NimbleCrmSettings } from '@/components/settings/nimble-crm-settings';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">Manage CRM connections and external services</p>
      </div>
      <NimbleCrmSettings />
    </div>
  );
}
