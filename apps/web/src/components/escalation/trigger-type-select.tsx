'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ESCALATION_TRIGGER_LABELS } from '@/lib/constants';

interface TriggerTypeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function TriggerTypeSelect({ value, onValueChange, placeholder = 'Select trigger' }: TriggerTypeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ESCALATION_TRIGGER_LABELS).map(([val, label]) => (
          <SelectItem key={val} value={val}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
