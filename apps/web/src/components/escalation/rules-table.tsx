'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { ESCALATION_TRIGGER_LABELS } from '@/lib/constants';
import type { EscalationRule, EscalationTrigger } from '@sovereign/shared';

interface RulesTableProps {
  rules: EscalationRule[];
  onSelect: (rule: EscalationRule) => void;
  onToggle: (ruleId: string, isActive: boolean) => void;
}

export function RulesTable({ rules, onSelect, onToggle }: RulesTableProps) {
  if (rules.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No escalation rules yet. Create one to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Trigger Type</TableHead>
          <TableHead>Steps</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell className="font-medium">{rule.name}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {ESCALATION_TRIGGER_LABELS[rule.triggerType as EscalationTrigger] ?? rule.triggerType}
              </Badge>
            </TableCell>
            <TableCell>{rule.steps?.length ?? 0}</TableCell>
            <TableCell>
              <Switch
                checked={rule.isActive}
                onCheckedChange={(checked) => onToggle(rule.id, checked)}
              />
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="ghost" onClick={() => onSelect(rule)}>
                <Eye className="mr-1 h-4 w-4" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
