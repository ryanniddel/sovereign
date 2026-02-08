import { TierManagement } from '@/components/contacts/tier-management';

export default function TiersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Contact Tiers</h1>
      <TierManagement />
    </div>
  );
}
