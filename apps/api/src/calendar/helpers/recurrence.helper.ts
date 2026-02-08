export function expandRecurrenceRule(
  startTime: Date,
  endTime: Date,
  recurrenceRule: string,
  rangeStart: Date,
  rangeEnd: Date,
): Array<{ startTime: Date; endTime: Date }> {
  const duration = endTime.getTime() - startTime.getTime();
  const occurrences: Array<{ startTime: Date; endTime: Date }> = [];

  const parts = recurrenceRule.split(';').reduce(
    (acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const freq = parts['FREQ'];
  const count = parts['COUNT'] ? parseInt(parts['COUNT'], 10) : 52;
  const interval = parts['INTERVAL'] ? parseInt(parts['INTERVAL'], 10) : 1;

  let current = new Date(startTime);
  let i = 0;

  while (current <= rangeEnd && i < count) {
    if (current >= rangeStart) {
      occurrences.push({
        startTime: new Date(current),
        endTime: new Date(current.getTime() + duration),
      });
    }

    switch (freq) {
      case 'DAILY':
        current.setDate(current.getDate() + interval);
        break;
      case 'WEEKLY':
        current.setDate(current.getDate() + 7 * interval);
        break;
      case 'MONTHLY':
        current.setMonth(current.getMonth() + interval);
        break;
      case 'YEARLY':
        current.setFullYear(current.getFullYear() + interval);
        break;
      default:
        return occurrences;
    }
    i++;
  }

  return occurrences;
}
