'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">Sovereign</CardTitle>
        <CardDescription>Supreme Authority Over Your Time</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          size="lg"
          onClick={() => signIn('auth0', { callbackUrl: '/dashboard' })}
        >
          Sign in with Auth0
        </Button>
      </CardContent>
    </Card>
  );
}
