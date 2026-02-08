'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, MessageSquare, Phone, Hash } from 'lucide-react';

interface ChannelToggleProps {
  channel: string;
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const channelIcons: Record<string, React.ElementType> = {
  IN_APP: Bell,
  EMAIL: Mail,
  SMS: MessageSquare,
  PHONE_CALL: Phone,
  SLACK: Hash,
};

export function ChannelToggle({ channel, label, description, enabled, onToggle }: ChannelToggleProps) {
  const Icon = channelIcons[channel] ?? Bell;

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}
