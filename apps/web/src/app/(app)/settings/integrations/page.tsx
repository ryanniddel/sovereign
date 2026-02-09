'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntegrationsStatus } from '@/hooks/use-integrations';
import { MicrosoftIntegration } from '@/components/settings/microsoft-integration';
import { GoogleIntegration } from '@/components/settings/google-integration';
import { ZoomIntegration } from '@/components/settings/zoom-integration';
import { SlackIntegration } from '@/components/settings/slack-integration';
import { PhoneIntegration } from '@/components/settings/phone-integration';
import { NimbleCrmSettings } from '@/components/settings/nimble-crm-settings';

export default function IntegrationsPage() {
  const { data: overview, isLoading } = useIntegrationsStatus();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully`);
      router.replace('/settings/integrations', { scroll: false });
    } else if (error) {
      const message = error === 'connection_failed'
        ? 'Failed to connect integration. Please try again.'
        : error === 'missing_params'
        ? 'OAuth callback missing required parameters.'
        : `Connection error: ${error}`;
      toast.error(message);
      router.replace('/settings/integrations', { scroll: false });
    }
  }, [searchParams, router]);

  const findProvider = (provider: string) =>
    overview?.integrations.find((i) => i.provider === provider);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Manage external service connections and OAuth integrations
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MicrosoftIntegration status={findProvider('MICROSOFT')} />
          <GoogleIntegration status={findProvider('GOOGLE')} />
          <ZoomIntegration status={findProvider('ZOOM')} />
          <SlackIntegration status={findProvider('SLACK')} />
          <PhoneIntegration phone={overview?.phone} />
          <NimbleCrmSettings />
        </div>
      )}
    </div>
  );
}
