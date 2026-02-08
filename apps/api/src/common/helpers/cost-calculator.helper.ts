import { MeetingCostCalculation } from '@sovereign/shared';

export function calculateMeetingCost(
  attendeeCount: number,
  durationMinutes: number,
  averageHourlyRate: number,
): MeetingCostCalculation {
  const totalCost = attendeeCount * (durationMinutes / 60) * averageHourlyRate;
  return {
    attendeeCount,
    durationMinutes,
    averageHourlyRate,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}
