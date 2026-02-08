import { SettingsNav } from '@/components/settings/settings-nav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <div className="flex gap-8">
        <div className="w-48 flex-shrink-0">
          <SettingsNav />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
