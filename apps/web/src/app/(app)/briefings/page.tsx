'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BriefingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Briefings</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-500" />
            <CardTitle>Morning Briefing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Start your day with a comprehensive overview</p>
            <Button asChild className="mt-4"><Link href="/briefings/morning">View Morning Briefing</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Moon className="h-5 w-5 text-blue-500" />
            <CardTitle>Nightly Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Review your day and prepare for tomorrow</p>
            <Button asChild className="mt-4"><Link href="/briefings/nightly">View Nightly Review</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
