'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useConnectPhone,
  useVerifyPhone,
  useDisconnectPhone,
} from '@/hooks/use-integrations';
import type { IntegrationsOverview } from '@sovereign/shared';

interface PhoneIntegrationProps {
  phone: IntegrationsOverview['phone'] | undefined;
}

export function PhoneIntegration({ phone }: PhoneIntegrationProps) {
  const connectPhone = useConnectPhone();
  const verifyPhone = useVerifyPhone();
  const disconnectPhone = useDisconnectPhone();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  const isConnected = phone?.connected ?? false;
  const isVerified = phone?.verified ?? false;

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phoneNumber.trim();
    if (!trimmed) return;
    if (!/^\+[1-9]\d{6,14}$/.test(trimmed)) {
      toast.error('Please enter a valid phone number in E.164 format (e.g. +14155551234)');
      return;
    }
    connectPhone.mutate(trimmed, {
      onSuccess: () => setCodeSent(true),
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    verifyPhone.mutate(verificationCode.trim(), {
      onSuccess: () => {
        setCodeSent(false);
        setPhoneNumber('');
        setVerificationCode('');
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label="Phone">P</span>
            <div>
              <CardTitle className="text-base">Phone (SMS/Voice)</CardTitle>
              <CardDescription className="text-xs">SMS and voice escalation via Twilio</CardDescription>
            </div>
          </div>
          {isVerified ? (
            <Badge variant="default">Verified</Badge>
          ) : isConnected ? (
            <Badge variant="secondary">Pending Verification</Badge>
          ) : (
            <Badge variant="secondary">Disconnected</Badge>
          )}
        </div>
        {isConnected && phone?.phoneNumber && (
          <p className="text-xs text-muted-foreground mt-1">{phone.phoneNumber}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isVerified ? (
          <>
            <p className="text-xs text-muted-foreground">
              Your phone number is verified and ready to receive SMS and voice escalations.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDisconnectOpen(true)}
              disabled={disconnectPhone.isPending}
            >
              {disconnectPhone.isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
            <ConfirmDialog
              open={disconnectOpen}
              onOpenChange={setDisconnectOpen}
              title="Disconnect Phone"
              description="You will no longer receive SMS or voice escalations. You can reconnect at any time."
              variant="destructive"
              confirmLabel="Disconnect"
              onConfirm={() => disconnectPhone.mutate(undefined, {
                onSuccess: () => setDisconnectOpen(false),
              })}
              loading={disconnectPhone.isPending}
            />
          </>
        ) : !codeSent ? (
          <form onSubmit={handleSendCode} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone-number" className="text-xs">Phone Number (E.164 format)</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+14155551234"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={connectPhone.isPending || !phoneNumber.trim()}
            >
              {connectPhone.isPending ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              A verification code has been sent to {phoneNumber}.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="verify-code" className="text-xs">Verification Code</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={verifyPhone.isPending || !verificationCode.trim()}
              >
                {verifyPhone.isPending ? 'Verifying...' : 'Verify'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCodeSent(false);
                  setVerificationCode('');
                }}
              >
                Back
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
