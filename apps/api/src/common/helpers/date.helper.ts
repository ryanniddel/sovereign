export function isOverdue(dueDate: Date): boolean {
  return new Date() > dueDate;
}

export function startOfDay(date: Date, timezone: string): Date {
  const dateStr = date.toLocaleDateString('en-CA', { timeZone: timezone });
  return new Date(`${dateStr}T00:00:00`);
}

export function endOfDay(date: Date, timezone: string): Date {
  const dateStr = date.toLocaleDateString('en-CA', { timeZone: timezone });
  return new Date(`${dateStr}T23:59:59.999`);
}

export function toUserTimezone(date: Date, timezone: string): Date {
  const offsetStr = date.toLocaleString('en-US', { timeZone: timezone });
  return new Date(offsetStr);
}

export function todayInTimezone(timezone: string): Date {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  return new Date(`${dateStr}T00:00:00`);
}

export function parseTimeString(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}
