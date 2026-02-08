import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CloseoutWizard } from '@/components/closeout/closeout-wizard';
import { History } from 'lucide-react';

export default function CloseoutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Closeout</h1>
          <p className="text-muted-foreground">Review your day, resolve open items, and reflect.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/closeout/history"><History className="mr-1 h-4 w-4" />History</Link>
        </Button>
      </div>
      <CloseoutWizard />
    </div>
  );
}
