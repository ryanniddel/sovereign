'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission.',
  Verification: 'The verification link has expired or has already been used.',
  Default: 'An unexpected authentication error occurred.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = errorMessages[error || ''] || errorMessages.Default;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle>Authentication Error</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/login">Back to Sign In</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full max-w-md" />}>
      <ErrorContent />
    </Suspense>
  );
}
