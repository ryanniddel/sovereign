'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSchedulerHealth, useSchedulerHistory, useTriggerJob } from '@/hooks/use-scheduler';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Activity, CheckCircle2, XCircle, Clock, AlertTriangle, Play, RefreshCw,
} from 'lucide-react';
import type { ScheduledJobStatus } from '@sovereign/shared';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
  RUNNING: { label: 'Running', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: RefreshCw },
  TIMED_OUT: { label: 'Timed Out', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: AlertTriangle },
};

const HEALTH_CONFIG: Record<string, { label: string; color: string }> = {
  healthy: { label: 'Healthy', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  degraded: { label: 'Degraded', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  unhealthy: { label: 'Unhealthy', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export function SchedulerDashboard() {
  const { data: health, isLoading: healthLoading } = useSchedulerHealth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: history, isLoading: historyLoading } = useSchedulerHistory({
    status: statusFilter !== 'all' ? (statusFilter as ScheduledJobStatus) : undefined,
    jobName: jobFilter !== 'all' ? jobFilter : undefined,
    page,
    pageSize: 20,
  });

  const triggerJob = useTriggerJob();

  if (healthLoading) return <Skeleton className="h-96" />;

  const healthStatus = health ? HEALTH_CONFIG[health.status] : null;
  const runs = history?.data || [];
  const totalRuns = history?.pagination?.total || 0;
  const stats = (history as unknown as { stats?: { successCount: number; failureCount: number; averageDurationMs: number; averageItemsProcessed: number } })?.stats;

  return (
    <div className="space-y-6">
      {/* Health overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Scheduler Health
              </CardTitle>
              <CardDescription>System job execution status and monitoring</CardDescription>
            </div>
            {healthStatus && (
              <Badge variant="outline" className={healthStatus.color}>
                {healthStatus.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {health && (
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold">{health.stats.totalRunsLast24h}</p>
                <p className="text-xs text-muted-foreground">Runs (24h)</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold">{(health.stats.successRate * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold">{health.stats.failedLast24h}</p>
                <p className="text-xs text-muted-foreground">Failures (24h)</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-2xl font-bold">
                  {health.stats.averageDurationMs < 1000
                    ? `${Math.round(health.stats.averageDurationMs)}ms`
                    : `${(health.stats.averageDurationMs / 1000).toFixed(1)}s`}
                </p>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job definitions */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Jobs ({health?.jobs.length || 0})</CardTitle>
          <CardDescription>All registered cron jobs with last run status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(health?.jobs || []).map((job) => {
                const statusCfg = job.lastRunStatus ? STATUS_CONFIG[job.lastRunStatus] : null;
                return (
                  <TableRow key={job.name}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-mono text-xs">{job.name}</span>
                          </TooltipTrigger>
                          <TooltipContent><p>{job.description}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{job.queue}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{job.schedule}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.lastRunAt
                        ? formatDistanceToNow(new Date(job.lastRunAt), { addSuffix: true })
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      {statusCfg ? (
                        <Badge variant="outline" className={statusCfg.color}>
                          {statusCfg.label}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => triggerJob.mutate(job.name)}
                        disabled={triggerJob.isPending}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Trigger
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Job history */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job History</CardTitle>
              <CardDescription>
                {stats
                  ? `${stats.successCount} succeeded, ${stats.failureCount} failed, avg ${Math.round(stats.averageDurationMs)}ms`
                  : 'Recent job executions'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={jobFilter} onValueChange={(v) => { setJobFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue placeholder="All jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jobs</SelectItem>
                  {(health?.jobs || []).map((j) => (
                    <SelectItem key={j.name} value={j.name}>{j.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <Skeleton className="h-48" />
          ) : runs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No job runs found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Queue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => {
                    const statusCfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.FAILED;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <TableRow key={run.id}>
                        <TableCell className="font-mono text-xs">{run.jobName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">{run.queue}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusCfg.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(run.startedAt), 'MMM d, HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-xs">
                          {run.durationMs != null ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {run.durationMs < 1000 ? `${run.durationMs}ms` : `${(run.durationMs / 1000).toFixed(1)}s`}
                            </span>
                          ) : '--'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {run.itemsProcessed > 0
                            ? `${run.itemsProcessed}${run.itemsFailed > 0 ? ` (${run.itemsFailed} failed)` : ''}`
                            : '--'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-red-400">
                          {run.errorMessage || ''}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalRuns > 20 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {Math.ceil(totalRuns / 20)}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= totalRuns}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
