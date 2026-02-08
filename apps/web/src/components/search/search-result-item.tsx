'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar, Users, Target, FileText, Zap, Shield, Sun, Bell, CheckSquare } from 'lucide-react';
import type { SearchResult } from '@sovereign/shared';

const TYPE_ICONS: Record<string, React.ElementType> = {
  contact: Users,
  meeting: Calendar,
  commitment: Target,
  actionItem: CheckSquare,
  agreement: FileText,
  calendarEvent: Calendar,
  escalationRule: Zap,
  briefing: Sun,
  focusMode: Shield,
};

const TYPE_COLORS: Record<string, string> = {
  contact: 'text-blue-500',
  meeting: 'text-indigo-500',
  commitment: 'text-orange-500',
  actionItem: 'text-emerald-500',
  agreement: 'text-purple-500',
  calendarEvent: 'text-blue-400',
  escalationRule: 'text-red-500',
  briefing: 'text-yellow-500',
  focusMode: 'text-purple-400',
};

interface SearchResultItemProps {
  result: SearchResult;
  onClick?: () => void;
}

export function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const Icon = TYPE_ICONS[result.type] || FileText;
  const colorClass = TYPE_COLORS[result.type] || 'text-muted-foreground';

  return (
    <button
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', colorClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {result.status && (
          <Badge variant="outline" className="text-xs">
            {result.status}
          </Badge>
        )}
        {result.priority && (
          <Badge variant="outline" className="text-xs">
            {result.priority}
          </Badge>
        )}
      </div>
    </button>
  );
}
