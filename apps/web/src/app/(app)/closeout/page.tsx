import { CloseoutWizard } from '@/components/closeout/closeout-wizard';

export default function CloseoutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Daily Closeout</h1>
      <p className="text-muted-foreground">Review your day, resolve open items, and reflect.</p>
      <CloseoutWizard />
    </div>
  );
}
