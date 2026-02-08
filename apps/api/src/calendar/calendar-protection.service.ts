import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProtectionRuleDto } from './dto/create-protection-rule.dto';
import { UpdateProtectionRuleDto } from './dto/update-protection-rule.dto';
import { ProtectionRuleType, ConflictSeverity } from '@sovereign/shared';
import { parseTimeString } from '../common';

export interface ProtectionViolation {
  ruleId: string;
  ruleName: string;
  ruleType: ProtectionRuleType;
  severity: ConflictSeverity;
  message: string;
}

@Injectable()
export class CalendarProtectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProtectionRuleDto) {
    if (dto.type === ProtectionRuleType.BUFFER_TIME && dto.bufferMinutes) {
      if (dto.bufferMinutes % 5 !== 0) {
        throw new BadRequestException('Buffer time must be in 5-minute increments');
      }
    }

    return this.prisma.calendarProtectionRule.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: string) {
    return this.prisma.calendarProtectionRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const rule = await this.prisma.calendarProtectionRule.findFirst({
      where: { id, userId },
    });
    if (!rule) throw new NotFoundException('Protection rule not found');
    return rule;
  }

  async update(userId: string, id: string, dto: UpdateProtectionRuleDto) {
    await this.findOne(userId, id);

    if (dto.bufferMinutes && dto.bufferMinutes % 5 !== 0) {
      throw new BadRequestException('Buffer time must be in 5-minute increments');
    }

    return this.prisma.calendarProtectionRule.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.calendarProtectionRule.delete({ where: { id } });
  }

  /**
   * Check if a proposed event time violates any active protection rules.
   * Returns an array of violations (empty = no violations).
   */
  async checkViolations(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeEventId?: string,
  ): Promise<ProtectionViolation[]> {
    const rules = await this.prisma.calendarProtectionRule.findMany({
      where: { userId, isActive: true },
    });

    const violations: ProtectionViolation[] = [];

    for (const rule of rules) {
      switch (rule.type) {
        case 'UNBOOKABLE_HOURS':
          this.checkUnbookableHours(rule, startTime, endTime, violations);
          break;

        case 'BUFFER_TIME':
          await this.checkBufferTime(rule, userId, startTime, endTime, excludeEventId, violations);
          break;

        case 'FOCUS_PROTECTION':
          await this.checkFocusProtection(rule, userId, startTime, endTime, excludeEventId, violations);
          break;

        case 'MAX_DAILY_MEETINGS':
          await this.checkMaxDailyMeetings(rule, userId, startTime, excludeEventId, violations);
          break;
      }
    }

    return violations;
  }

  /**
   * Get the configured buffer minutes for the user (from BUFFER_TIME rules).
   * Returns the maximum buffer if multiple rules exist.
   */
  async getBufferMinutes(userId: string): Promise<number> {
    const bufferRules = await this.prisma.calendarProtectionRule.findMany({
      where: {
        userId,
        isActive: true,
        type: 'BUFFER_TIME',
      },
    });

    if (bufferRules.length === 0) return 0;
    return Math.max(...bufferRules.map((r) => r.bufferMinutes || 0));
  }

  private checkUnbookableHours(
    rule: { id: string; name: string; type: string; startTime: string | null; endTime: string | null; daysOfWeek: unknown },
    eventStart: Date,
    eventEnd: Date,
    violations: ProtectionViolation[],
  ) {
    if (!rule.startTime || !rule.endTime) return;

    const daysOfWeek = (rule.daysOfWeek as number[] | null) ?? [0, 1, 2, 3, 4, 5, 6];
    const eventDay = eventStart.getDay();

    if (!daysOfWeek.includes(eventDay)) return;

    const ruleStart = parseTimeString(rule.startTime);
    const ruleEnd = parseTimeString(rule.endTime);

    const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
    const eventEndMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
    const ruleStartMinutes = ruleStart.hours * 60 + ruleStart.minutes;
    const ruleEndMinutes = ruleEnd.hours * 60 + ruleEnd.minutes;

    // Handle wrap-around (e.g. 22:00 - 06:00)
    if (ruleStartMinutes <= ruleEndMinutes) {
      // Normal range: check if event overlaps
      if (eventStartMinutes < ruleEndMinutes && eventEndMinutes > ruleStartMinutes) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: ProtectionRuleType.UNBOOKABLE_HOURS,
          severity: ConflictSeverity.PROTECTION,
          message: `Event falls within unbookable hours (${rule.startTime}–${rule.endTime})`,
        });
      }
    } else {
      // Wrap-around: blocked from ruleStart to midnight AND midnight to ruleEnd
      if (eventStartMinutes >= ruleStartMinutes || eventEndMinutes <= ruleEndMinutes) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: ProtectionRuleType.UNBOOKABLE_HOURS,
          severity: ConflictSeverity.PROTECTION,
          message: `Event falls within unbookable hours (${rule.startTime}–${rule.endTime})`,
        });
      }
    }
  }

  private async checkBufferTime(
    rule: { id: string; name: string; type: string; bufferMinutes: number | null },
    userId: string,
    eventStart: Date,
    eventEnd: Date,
    excludeEventId: string | undefined,
    violations: ProtectionViolation[],
  ) {
    const buffer = rule.bufferMinutes || 0;
    if (buffer === 0) return;

    const bufferMs = buffer * 60 * 1000;
    const expandedStart = new Date(eventStart.getTime() - bufferMs);
    const expandedEnd = new Date(eventEnd.getTime() + bufferMs);

    const nearbyEvents = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
        OR: [
          { startTime: { gte: expandedStart, lt: eventEnd } },
          { endTime: { gt: eventStart, lte: expandedEnd } },
          { AND: [{ startTime: { lte: expandedStart } }, { endTime: { gte: expandedEnd } }] },
        ],
      },
    });

    // Filter to events that don't overlap the event itself but ARE within the buffer zone
    for (const nearby of nearbyEvents) {
      const nearbyEnd = new Date(nearby.endTime).getTime();
      const nearbyStart = new Date(nearby.startTime).getTime();
      const eventStartMs = eventStart.getTime();
      const eventEndMs = eventEnd.getTime();

      // Check if this is a buffer violation (not a direct overlap)
      const gapBefore = eventStartMs - nearbyEnd;
      const gapAfter = nearbyStart - eventEndMs;

      if ((gapBefore > 0 && gapBefore < bufferMs) || (gapAfter > 0 && gapAfter < bufferMs)) {
        const gapMinutes = Math.round(Math.min(
          gapBefore > 0 ? gapBefore : Infinity,
          gapAfter > 0 ? gapAfter : Infinity,
        ) / 60000);

        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: ProtectionRuleType.BUFFER_TIME,
          severity: ConflictSeverity.SOFT,
          message: `Only ${gapMinutes}min gap to "${nearby.title}" — requires ${buffer}min buffer`,
        });
      }
    }
  }

  private async checkFocusProtection(
    rule: { id: string; name: string; type: string },
    userId: string,
    eventStart: Date,
    eventEnd: Date,
    excludeEventId: string | undefined,
    violations: ProtectionViolation[],
  ) {
    const overlappingFocusBlocks = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        eventType: 'FOCUS_BLOCK',
        isProtected: true,
        ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
        OR: [
          { startTime: { gte: eventStart, lt: eventEnd } },
          { endTime: { gt: eventStart, lte: eventEnd } },
          { AND: [{ startTime: { lte: eventStart } }, { endTime: { gte: eventEnd } }] },
        ],
      },
    });

    for (const block of overlappingFocusBlocks) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: ProtectionRuleType.FOCUS_PROTECTION,
        severity: ConflictSeverity.PROTECTION,
        message: `Conflicts with protected focus block "${block.title}"`,
      });
    }
  }

  private async checkMaxDailyMeetings(
    rule: { id: string; name: string; type: string; maxCount: number | null },
    userId: string,
    eventStart: Date,
    excludeEventId: string | undefined,
    violations: ProtectionViolation[],
  ) {
    const maxCount = rule.maxCount || 0;
    if (maxCount === 0) return;

    const dayStart = new Date(eventStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(eventStart);
    dayEnd.setHours(23, 59, 59, 999);

    const meetingCount = await this.prisma.calendarEvent.count({
      where: {
        userId,
        eventType: 'MEETING',
        ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
        startTime: { gte: dayStart, lte: dayEnd },
      },
    });

    if (meetingCount >= maxCount) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        ruleType: ProtectionRuleType.MAX_DAILY_MEETINGS,
        severity: ConflictSeverity.PROTECTION,
        message: `Daily meeting limit reached (${meetingCount}/${maxCount})`,
      });
    }
  }
}
