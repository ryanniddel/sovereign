'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Target,
  Clock,
  AlertTriangle,
  CalendarCheck,
  Handshake,
  CheckSquare,
} from 'lucide-react';
import type { AccountabilityDashboard } from '@sovereign/shared';

interface ScoreboardProps {
  dashboard: AccountabilityDashboard;
}

export function Scoreboard({ dashboard }: ScoreboardProps) {
  const { latestScore, overdueItems, dueToday, activeAgreements, lastCloseoutCompleted } =
    dashboard;

  const scorePercent = latestScore ? Math.round(latestScore.score * 100) : 0;
  const onTimePercent = latestScore ? Math.round(latestScore.onTimeRate * 100) : 0;
  const totalOverdue = overdueItems.commitments + overdueItems.actionItems;
  const totalDueToday = dueToday.commitments + dueToday.actionItems;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Latest Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Accountability Score</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            <span className={scorePercent >= 80 ? 'text-green-600' : scorePercent >= 50 ? 'text-yellow-600' : 'text-red-600'}>
              {scorePercent}%
            </span>
          </div>
          {latestScore && (
            <p className="mt-1 text-xs text-muted-foreground">
              {latestScore.commitmentsDelivered}/{latestScore.commitmentsMade} commitments delivered
            </p>
          )}
        </CardContent>
      </Card>

      {/* On-Time Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            <span className={onTimePercent >= 80 ? 'text-green-600' : onTimePercent >= 50 ? 'text-yellow-600' : 'text-red-600'}>
              {onTimePercent}%
            </span>
          </div>
          {latestScore && (
            <p className="mt-1 text-xs text-muted-foreground">
              {latestScore.actionItemsCompleted} action items completed
            </p>
          )}
        </CardContent>
      </Card>

      {/* Overdue Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            <span className={totalOverdue === 0 ? 'text-green-600' : 'text-red-600'}>
              {totalOverdue}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {overdueItems.commitments} commitments, {overdueItems.actionItems} action items
          </p>
        </CardContent>
      </Card>

      {/* Due Today */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalDueToday}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {dueToday.commitments} commitments, {dueToday.actionItems} action items
          </p>
        </CardContent>
      </Card>

      {/* Active Agreements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
          <Handshake className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{activeAgreements}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Currently active agreements
          </p>
        </CardContent>
      </Card>

      {/* Last Closeout */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Last Closeout</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            <span className={lastCloseoutCompleted ? 'text-green-600' : 'text-yellow-600'}>
              {lastCloseoutCompleted ? 'Done' : 'Pending'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {lastCloseoutCompleted ? 'Daily closeout completed' : 'Daily closeout not yet completed'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
