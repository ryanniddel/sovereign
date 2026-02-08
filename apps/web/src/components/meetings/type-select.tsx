'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MEETING_TYPE_LABELS } from '@/lib/constants';

interface TypeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function TypeSelect({ value, onValueChange, placeholder = 'Select type' }: TypeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(MEETING_TYPE_LABELS).map(([val, label]) => (
          <SelectItem key={val} value={val}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
