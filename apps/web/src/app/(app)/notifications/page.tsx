'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { EmptyState } from '@/components/shared/empty-state';
import { NotificationPreferencesForm } from '@/components/notifications/notification-preferences-form';
import {
  useNotificationInbox, useUnreadCount, useNotificationStats,
  useMarkRead, useMarkAllRead, useDismissNotification, useDismissAll,
  useInitializeNotificationDefaults, useCleanupNotifications,
} from '@/hooks/use-notifications';
import {
  NOTIFICATION_CATEGORY_LABELS, NOTIFICATION_CATEGORY_COLORS,
  ESCALATION_CHANNEL_LABELS, PRIORITY_COLORS,
} from '@/lib/constants';
import type { Notification, NotificationCategory, Priority, EscalationChannel } from '@sovereign/shared';
import { Bell, BellOff, Check, CheckCheck, X, Trash2, BarChart3, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_BADGE_COLORS: Record<string, string> = {
  LOW: 'bg-gray-500/10 text-gray-500',
  MEDIUM: 'bg-blue-500/10 text-blue-500',
  HIGH: 'bg-orange-500/10 text-orange-500',
  CRITICAL: 'bg-red-500/10 text-red-500',
};

export default function NotificationsPage() {
  const [tab, setTab] = useState('inbox');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data: inboxData, isLoading: inboxLoading } = useNotificationInbox({
    page,
    pageSize: 20,
    ...(categoryFilter ? { category: categoryFilter as NotificationCategory } : {}),
    ...(unreadOnly ? { unreadOnly: true } : {}),
  });
  const { data: unread } = useUnreadCount();
  const { data: stats, isLoading: statsLoading } = useNotificationStats(30);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const dismiss = useDismissNotification();
  const dismissAll = useDismissAll();
  const initDefaults = useInitializeNotificationDefaults();
  const cleanup = useCleanupNotifications();

  const notifications = inboxData?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {unread && unread.total > 0 && (
          <Badge variant="outline" className="text-sm">{unread.total} unread</Badge>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox">
            <Bell className="mr-1 h-4 w-4" />Inbox
            {unread && unread.total > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">{unread.total}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="mr-1 h-4 w-4" />Stats</TabsTrigger>
          <TabsTrigger value="preferences"><Settings className="mr-1 h-4 w-4" />Preferences</TabsTrigger>
        </TabsList>

        {/* ── Inbox Tab ── */}
        <TabsContent value="inbox" className="space-y-4">
          {/* Filters + Actions toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === 'ALL' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {Object.entries(NOTIFICATION_CATEGORY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={unreadOnly} onCheckedChange={(v) => { setUnreadOnly(v); setPage(1); }} />
                <Label className="text-sm">Unread only</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAllRead.mutate(categoryFilter || undefined)}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="mr-1 h-3 w-3" />Mark All Read
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dismissAll.mutate(categoryFilter || undefined)}
                disabled={dismissAll.isPending}
              >
                <BellOff className="mr-1 h-3 w-3" />Dismiss All
              </Button>
            </div>
          </div>

          {/* Notification list */}
          {inboxLoading ? (
            <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          ) : notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description={unreadOnly ? 'No unread notifications' : 'Your inbox is empty'} />
          ) : (
            <div className="space-y-2">
              {notifications.map((n: Notification) => (
                <Card key={n.id} className={n.isRead ? 'opacity-60' : ''}>
                  <CardContent className="flex items-start gap-3 py-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                        <p className="text-sm font-medium">{n.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${NOTIFICATION_CATEGORY_COLORS[n.category as NotificationCategory] || ''}`}>
                          {NOTIFICATION_CATEGORY_LABELS[n.category as NotificationCategory] || n.category}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${PRIORITY_BADGE_COLORS[n.priority] || ''}`}>
                          {n.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                        {n.channel && (
                          <span className="text-xs text-muted-foreground">
                            via {ESCALATION_CHANNEL_LABELS[n.channel as EscalationChannel] || n.channel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!n.isRead && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => markRead.mutate(n.id)} title="Mark read">
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => dismiss.mutate(n.id)} title="Dismiss">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {inboxData?.pagination && (
            <PaginationControls page={inboxData.pagination.page} totalPages={inboxData.pagination.totalPages} onPageChange={setPage} />
          )}
        </TabsContent>

        {/* ── Stats Tab ── */}
        <TabsContent value="stats" className="space-y-4">
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          ) : stats ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total (30 Days)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{stats.unread}</p>
                    <p className="text-sm text-muted-foreground">Unread</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{Math.round(stats.deliveryRate * 100)}%</p>
                    <p className="text-sm text-muted-foreground">Delivery Rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold">{stats.suppressedCount}</p>
                    <p className="text-sm text-muted-foreground">Suppressed</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(stats.byCategory).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs ${NOTIFICATION_CATEGORY_COLORS[cat as NotificationCategory] || ''}`}>
                          {NOTIFICATION_CATEGORY_LABELS[cat as NotificationCategory] || cat}
                        </Badge>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                    {Object.keys(stats.byCategory).length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">By Priority</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(stats.byPriority).map(([pri, count]) => (
                      <div key={pri} className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs ${PRIORITY_BADGE_COLORS[pri] || ''}`}>
                          {pri}
                        </Badge>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                    {Object.keys(stats.byPriority).length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No stats available</p>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => cleanup.mutate(30)}
              disabled={cleanup.isPending}
            >
              <Trash2 className="mr-1 h-3 w-3" />{cleanup.isPending ? 'Cleaning...' : 'Clean Up Old Notifications'}
            </Button>
          </div>
        </TabsContent>

        {/* ── Preferences Tab ── */}
        <TabsContent value="preferences" className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => initDefaults.mutate()}
              disabled={initDefaults.isPending}
            >
              {initDefaults.isPending ? 'Initializing...' : 'Initialize Defaults'}
            </Button>
          </div>
          <NotificationPreferencesForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
