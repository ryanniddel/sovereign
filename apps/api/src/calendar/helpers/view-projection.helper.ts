export function getDailyRange(dateStr: string, timezone: string) {
  const date = new Date(dateStr);
  const dayStr = date.toLocaleDateString('en-CA', { timeZone: timezone });
  return {
    start: new Date(`${dayStr}T00:00:00`),
    end: new Date(`${dayStr}T23:59:59.999`),
  };
}

export function getWeeklyRange(dateStr: string, timezone: string) {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - dayOfWeek);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startStr = start.toLocaleDateString('en-CA', { timeZone: timezone });
  const endStr = end.toLocaleDateString('en-CA', { timeZone: timezone });
  return {
    start: new Date(`${startStr}T00:00:00`),
    end: new Date(`${endStr}T23:59:59.999`),
  };
}

export function getMonthlyRange(dateStr: string, timezone: string) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getQuarterlyRange(dateStr: string, timezone: string) {
  const date = new Date(dateStr);
  const quarter = Math.floor(date.getMonth() / 3);
  const start = new Date(date.getFullYear(), quarter * 3, 1);
  const end = new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
  return { start, end };
}
