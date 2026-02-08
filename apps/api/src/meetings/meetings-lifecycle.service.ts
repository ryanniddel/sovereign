import { BadRequestException } from '@nestjs/common';
import { MeetingStatus } from '@sovereign/shared';

const TRANSITION_MAP: Record<string, MeetingStatus[]> = {
  [MeetingStatus.REQUESTED]: [MeetingStatus.QUALIFYING, MeetingStatus.CANCELLED],
  [MeetingStatus.QUALIFYING]: [MeetingStatus.QUALIFIED, MeetingStatus.CANCELLED],
  [MeetingStatus.QUALIFIED]: [MeetingStatus.SCHEDULED, MeetingStatus.CANCELLED],
  [MeetingStatus.SCHEDULED]: [MeetingStatus.PREP_SENT, MeetingStatus.CANCELLED, MeetingStatus.AUTO_CANCELLED],
  [MeetingStatus.PREP_SENT]: [MeetingStatus.IN_PROGRESS, MeetingStatus.CANCELLED, MeetingStatus.AUTO_CANCELLED],
  [MeetingStatus.IN_PROGRESS]: [MeetingStatus.COMPLETED, MeetingStatus.CANCELLED],
  [MeetingStatus.COMPLETED]: [],
  [MeetingStatus.CANCELLED]: [],
  [MeetingStatus.AUTO_CANCELLED]: [],
};

export function validateTransition(current: MeetingStatus, next: MeetingStatus): void {
  const allowed = TRANSITION_MAP[current];
  if (!allowed || !allowed.includes(next)) {
    throw new BadRequestException(
      `Invalid meeting status transition: ${current} → ${next}`,
    );
  }
}
