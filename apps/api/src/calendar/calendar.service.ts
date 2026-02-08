import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateFocusBlockDto } from './dto/create-focus-block.dto';
import { DateRangeQueryDto } from '../common';
import { CalendarProtectionService } from './calendar-protection.service';
import { ConflictSeverity } from '@sovereign/shared';
import {
  getDailyRange,
  getWeeklyRange,
  getMonthlyRange,
  getQuarterlyRange,
} from './helpers/view-projection.helper';

import type {
  ConflictResult,
  HourSlot,
  DailyViewResponse,
  DayBucket,
  WeeklyViewResponse,
  WeekBucket,
  MonthlyViewResponse,
  MonthBucket,
  QuarterlyViewResponse,
} from '@sovereign/shared';

type CalendarEventRow = Awaited<ReturnType<PrismaService['calendarEvent']['findFirst']>>;

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly protectionService: CalendarProtectionService,
  ) {}

  // ════════════════════════════════════════════════════════════════
  // CRUD
  // ════════════════════════════════════════════════════════════════

  async createEvent(userId: string, dto: CreateEventDto) {
    this.validateBufferIncrements(dto.bufferBeforeMinutes, dto.bufferAfterMinutes);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // Check protection rule violations
    const violations = await this.protectionService.checkViolations(userId, startTime, endTime);
    if (violations.length > 0) {
      throw new BadRequestException({
        message: 'Event violates protection rules',
        violations,
      });
    }

    // Create the main event
    const event = await this.prisma.calendarEvent.create({
      data: {
        ...dto,
        userId,
        startTime,
        endTime,
      },
      include: { meeting: true },
    });

    // If travel buffer is specified, auto-create a TRAVEL event before the main event
    if (dto.travelBufferMinutes && dto.travelBufferMinutes > 0) {
      const travelEnd = new Date(startTime);
      const travelStart = new Date(travelEnd.getTime() - dto.travelBufferMinutes * 60 * 1000);

      const travelEvent = await this.prisma.calendarEvent.create({
        data: {
          userId,
          title: `Travel to: ${dto.title}`,
          description: dto.travelOrigin && dto.travelDestination
            ? `${dto.travelOrigin} → ${dto.travelDestination}`
            : undefined,
          startTime: travelStart,
          endTime: travelEnd,
          eventType: 'TRAVEL',
          isProtected: true,
          source: 'SOVEREIGN',
          travelOrigin: dto.travelOrigin,
          travelDestination: dto.travelDestination,
        },
      });

      // Link the travel event to the main event
      await this.prisma.calendarEvent.update({
        where: { id: event.id },
        data: { travelEventId: travelEvent.id },
      });

      return { ...event, travelEvent };
    }

    return event;
  }

  async createFocusBlock(userId: string, dto: CreateFocusBlockDto) {
    return this.prisma.calendarEvent.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        eventType: 'FOCUS_BLOCK',
        isProtected: true,
        source: 'SOVEREIGN',
      },
    });
  }

  async findEventsByDateRange(userId: string, query: DateRangeQueryDto) {
    const where: Record<string, unknown> = { userId };
    if (query.startDate || query.endDate) {
      where.startTime = {};
      if (query.startDate) (where.startTime as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.startTime as Record<string, unknown>).lte = new Date(query.endDate);
    }
    return this.prisma.calendarEvent.findMany({
      where: where as any,
      orderBy: { startTime: 'asc' },
      include: { meeting: true },
    });
  }

  async findOne(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id, userId },
      include: { meeting: true },
    });
    if (!event) throw new NotFoundException('Calendar event not found');
    return event;
  }

  async updateEvent(userId: string, id: string, dto: UpdateEventDto) {
    const event = await this.prisma.calendarEvent.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Calendar event not found');

    this.validateBufferIncrements(dto.bufferBeforeMinutes, dto.bufferAfterMinutes);

    const startTime = dto.startTime ? new Date(dto.startTime) : event.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : event.endTime;

    // Check protection rule violations for the new time
    if (dto.startTime || dto.endTime) {
      const violations = await this.protectionService.checkViolations(userId, startTime, endTime, id);
      if (violations.length > 0) {
        throw new BadRequestException({
          message: 'Updated event violates protection rules',
          violations,
        });
      }
    }

    const data: Record<string, unknown> = { ...dto };
    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);

    const updated = await this.prisma.calendarEvent.update({
      where: { id },
      data: data as any,
      include: { meeting: true },
    });

    // Update linked travel event if travel buffer changed
    if (dto.travelBufferMinutes !== undefined && event.travelEventId) {
      if (dto.travelBufferMinutes === 0) {
        await this.prisma.calendarEvent.delete({ where: { id: event.travelEventId } });
        await this.prisma.calendarEvent.update({
          where: { id },
          data: { travelEventId: null },
        });
      } else {
        const travelEnd = new Date(startTime);
        const travelStart = new Date(travelEnd.getTime() - dto.travelBufferMinutes * 60 * 1000);
        await this.prisma.calendarEvent.update({
          where: { id: event.travelEventId },
          data: {
            startTime: travelStart,
            endTime: travelEnd,
            travelOrigin: dto.travelOrigin ?? undefined,
            travelDestination: dto.travelDestination ?? undefined,
          },
        });
      }
    }

    return updated;
  }

  async deleteEvent(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Calendar event not found');

    // Also delete linked travel event
    if (event.travelEventId) {
      await this.prisma.calendarEvent.delete({ where: { id: event.travelEventId } }).catch(() => {});
    }

    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  // ════════════════════════════════════════════════════════════════
  // NESTED VIEW ENDPOINTS
  // ════════════════════════════════════════════════════════════════

  /**
   * Daily view: events bucketed by hour (0-23)
   */
  async getDailyView(userId: string, date: string, timezone: string): Promise<DailyViewResponse> {
    const range = getDailyRange(date, timezone);
    const events = await this.getEventsInRange(userId, range.start, range.end);
    const conflicts = this.detectConflictsInList(events, userId);

    const hours: HourSlot[] = [];
    for (let h = 0; h < 24; h++) {
      const hourEvents = events.filter((e) => {
        const eventStart = new Date(e.startTime);
        const eventEnd = new Date(e.endTime);
        const hourStart = new Date(range.start);
        hourStart.setHours(h, 0, 0, 0);
        const hourEnd = new Date(range.start);
        hourEnd.setHours(h, 59, 59, 999);
        return eventStart <= hourEnd && eventEnd > hourStart;
      });

      hours.push({
        hour: h,
        label: this.formatHourLabel(h),
        events: hourEvents as any,
      });
    }

    return {
      date: range.start.toISOString().split('T')[0],
      hours,
      totalEvents: events.length,
      conflicts,
    };
  }

  /**
   * Weekly view: events bucketed by day (7 days)
   */
  async getWeeklyView(userId: string, date: string, timezone: string): Promise<WeeklyViewResponse> {
    const range = getWeeklyRange(date, timezone);
    const events = await this.getEventsInRange(userId, range.start, range.end);
    const conflicts = this.detectConflictsInList(events, userId);

    const days: DayBucket[] = [];
    const cursor = new Date(range.start);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let d = 0; d < 7; d++) {
      const dayStart = new Date(cursor);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(cursor);
      dayEnd.setHours(23, 59, 59, 999);

      const dayEvents = events.filter((e) => {
        const es = new Date(e.startTime);
        return es >= dayStart && es <= dayEnd;
      });

      days.push({
        date: cursor.toISOString().split('T')[0],
        dayOfWeek: cursor.getDay(),
        dayLabel: `${dayNames[cursor.getDay()]} ${monthNames[cursor.getMonth()]} ${cursor.getDate()}`,
        events: dayEvents as any,
        totalEvents: dayEvents.length,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      weekStart: range.start.toISOString().split('T')[0],
      weekEnd: range.end.toISOString().split('T')[0],
      days,
      totalEvents: events.length,
      conflicts,
    };
  }

  /**
   * Monthly view: events bucketed by week
   */
  async getMonthlyView(userId: string, date: string, timezone: string): Promise<MonthlyViewResponse> {
    const range = getMonthlyRange(date, timezone);
    const events = await this.getEventsInRange(userId, range.start, range.end);
    const conflicts = this.detectConflictsInList(events, userId);

    const d = new Date(date);
    const month = d.getMonth();
    const year = d.getFullYear();

    // Bucket into weeks
    const weeks: WeekBucket[] = [];
    const cursor = new Date(range.start);
    // Rewind to start of week
    cursor.setDate(cursor.getDate() - cursor.getDay());
    let weekNum = 1;

    while (cursor <= range.end) {
      const weekStart = new Date(cursor);
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekEvents = events.filter((e) => {
        const es = new Date(e.startTime);
        return es >= weekStart && es <= weekEnd;
      });

      weeks.push({
        weekNumber: weekNum,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        events: weekEvents as any,
        totalEvents: weekEvents.length,
      });

      cursor.setDate(cursor.getDate() + 7);
      weekNum++;
    }

    return {
      month: month + 1,
      year,
      weeks,
      totalEvents: events.length,
      conflicts,
    };
  }

  /**
   * Quarterly view: events bucketed by month (3 months)
   */
  async getQuarterlyView(userId: string, date: string, timezone: string): Promise<QuarterlyViewResponse> {
    const range = getQuarterlyRange(date, timezone);
    const events = await this.getEventsInRange(userId, range.start, range.end);
    const conflicts = this.detectConflictsInList(events, userId);

    const d = new Date(date);
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    const year = d.getFullYear();
    const quarterStartMonth = (quarter - 1) * 3;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const months: MonthBucket[] = [];
    for (let m = 0; m < 3; m++) {
      const monthIdx = quarterStartMonth + m;
      const monthStart = new Date(year, monthIdx, 1);
      const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

      const monthEvents = events.filter((e) => {
        const es = new Date(e.startTime);
        return es >= monthStart && es <= monthEnd;
      });

      months.push({
        month: monthIdx + 1,
        year,
        monthLabel: `${monthNames[monthIdx]} ${year}`,
        events: monthEvents as any,
        totalEvents: monthEvents.length,
      });
    }

    return {
      quarter,
      year,
      months,
      totalEvents: events.length,
      conflicts,
    };
  }

  /**
   * Agenda view: flat list of events for the next 14 days
   */
  async getAgendaView(userId: string, date: string, _timezone: string) {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    return this.getEventsInRange(userId, start, end);
  }

  // ════════════════════════════════════════════════════════════════
  // COMMAND CENTER
  // ════════════════════════════════════════════════════════════════

  async getCommandCenter(userId: string, timezone: string) {
    const now = new Date();
    const todayRange = getDailyRange(now.toISOString(), timezone);
    const weekRange = getWeeklyRange(now.toISOString(), timezone);

    const [todayEvents, weekEvents, upcomingMeetings] = await Promise.all([
      this.getEventsInRange(userId, todayRange.start, todayRange.end),
      this.getEventsInRange(userId, weekRange.start, weekRange.end),
      this.prisma.meeting.findMany({
        where: {
          userId,
          status: { in: ['SCHEDULED', 'PREP_SENT'] },
        },
        orderBy: { createdAt: 'asc' },
        take: 5,
      }),
    ]);

    return {
      today: todayEvents,
      thisWeek: weekEvents,
      upcomingMeetings,
      totalEventsToday: todayEvents.length,
      totalEventsThisWeek: weekEvents.length,
      conflicts: this.detectConflictsInList(todayEvents, userId),
    };
  }

  // ════════════════════════════════════════════════════════════════
  // CONFLICT DETECTION
  // ════════════════════════════════════════════════════════════════

  /**
   * Enhanced conflict detection: checks for hard overlaps, buffer violations,
   * and travel time insufficiency. Returns structured conflict results.
   */
  async checkConflicts(
    userId: string,
    startTime: string,
    endTime: string,
    excludeEventId?: string,
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const bufferMinutes = await this.protectionService.getBufferMinutes(userId);
    const bufferMs = bufferMinutes * 60 * 1000;

    // Expand search window to include buffer zones
    const searchStart = new Date(start.getTime() - bufferMs);
    const searchEnd = new Date(end.getTime() + bufferMs);

    const nearbyEvents = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
        OR: [
          { startTime: { gte: searchStart, lt: searchEnd } },
          { endTime: { gt: searchStart, lte: searchEnd } },
          { AND: [{ startTime: { lte: searchStart } }, { endTime: { gte: searchEnd } }] },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    const conflicts: ConflictResult[] = [];
    const proposedEvent = { id: 'proposed', title: 'New Event', startTime: start, endTime: end };

    for (const existing of nearbyEvents) {
      const exStart = new Date(existing.startTime);
      const exEnd = new Date(existing.endTime);

      // Hard overlap
      if (start < exEnd && end > exStart) {
        const overlapStart = start > exStart ? start : exStart;
        const overlapEnd = end < exEnd ? end : exEnd;
        const overlapMinutes = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000);

        conflicts.push({
          severity: ConflictSeverity.HARD,
          eventA: proposedEvent,
          eventB: { id: existing.id, title: existing.title, startTime: exStart, endTime: exEnd },
          overlapMinutes,
          message: `Direct time overlap of ${overlapMinutes} minutes with "${existing.title}"`,
        });
        continue;
      }

      // Buffer zone violation
      if (bufferMinutes > 0) {
        const gapBefore = start.getTime() - exEnd.getTime();
        const gapAfter = exStart.getTime() - end.getTime();

        if (gapBefore > 0 && gapBefore < bufferMs) {
          conflicts.push({
            severity: ConflictSeverity.SOFT,
            eventA: proposedEvent,
            eventB: { id: existing.id, title: existing.title, startTime: exStart, endTime: exEnd },
            overlapMinutes: 0,
            message: `Only ${Math.round(gapBefore / 60000)}min gap (${bufferMinutes}min buffer required) before "${existing.title}"`,
          });
        } else if (gapAfter > 0 && gapAfter < bufferMs) {
          conflicts.push({
            severity: ConflictSeverity.SOFT,
            eventA: proposedEvent,
            eventB: { id: existing.id, title: existing.title, startTime: exStart, endTime: exEnd },
            overlapMinutes: 0,
            message: `Only ${Math.round(gapAfter / 60000)}min gap (${bufferMinutes}min buffer required) after "${existing.title}"`,
          });
        }
      }

      // Travel time insufficiency
      if (existing.travelBufferMinutes && existing.travelBufferMinutes > 0) {
        const travelMs = existing.travelBufferMinutes * 60 * 1000;
        const gapBefore = exStart.getTime() - end.getTime();
        if (gapBefore > 0 && gapBefore < travelMs) {
          conflicts.push({
            severity: ConflictSeverity.TRAVEL,
            eventA: proposedEvent,
            eventB: { id: existing.id, title: existing.title, startTime: exStart, endTime: exEnd },
            overlapMinutes: 0,
            message: `Insufficient travel time: ${Math.round(gapBefore / 60000)}min available, ${existing.travelBufferMinutes}min needed for "${existing.title}"`,
          });
        }
      }
    }

    // Check protection rules
    const protectionViolations = await this.protectionService.checkViolations(
      userId, start, end, excludeEventId,
    );
    for (const v of protectionViolations) {
      conflicts.push({
        severity: ConflictSeverity.PROTECTION,
        eventA: proposedEvent,
        eventB: proposedEvent, // self-reference for rule violations
        overlapMinutes: 0,
        message: v.message,
        protectionRuleId: v.ruleId,
      });
    }

    return {
      hasConflicts: conflicts.length > 0,
      hardConflicts: conflicts.filter((c) => c.severity === ConflictSeverity.HARD).length,
      softConflicts: conflicts.filter((c) => c.severity === ConflictSeverity.SOFT).length,
      travelConflicts: conflicts.filter((c) => c.severity === ConflictSeverity.TRAVEL).length,
      protectionViolations: conflicts.filter((c) => c.severity === ConflictSeverity.PROTECTION).length,
      conflicts,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // AVAILABLE SLOTS
  // ════════════════════════════════════════════════════════════════

  async findAvailableSlots(
    userId: string,
    date: string,
    durationMinutes: number,
    timezone: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const bufferMinutes = await this.protectionService.getBufferMinutes(userId);
    const range = getDailyRange(date, timezone);
    const events = await this.getEventsInRange(userId, range.start, range.end);

    const [startHour, startMin] = user.workingHoursStart.split(':').map(Number);
    const [endHour, endMin] = user.workingHoursEnd.split(':').map(Number);

    const workStart = new Date(range.start);
    workStart.setHours(startHour, startMin, 0, 0);
    const workEnd = new Date(range.start);
    workEnd.setHours(endHour, endMin, 0, 0);

    const slots: Array<{ start: Date; end: Date }> = [];
    let cursor = workStart.getTime();
    const durationMs = durationMinutes * 60 * 1000;
    const bufferMs = bufferMinutes * 60 * 1000;

    const busyPeriods = events
      .map((e) => ({
        start: new Date(e.startTime).getTime() - bufferMs,
        end: new Date(e.endTime).getTime() + bufferMs,
      }))
      .sort((a, b) => a.start - b.start);

    for (const busy of busyPeriods) {
      if (cursor + durationMs <= busy.start) {
        slots.push({ start: new Date(cursor), end: new Date(cursor + durationMs) });
      }
      cursor = Math.max(cursor, busy.end);
    }

    if (cursor + durationMs <= workEnd.getTime()) {
      slots.push({ start: new Date(cursor), end: new Date(cursor + durationMs) });
    }

    return slots;
  }

  // ════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ════════════════════════════════════════════════════════════════

  private async getEventsInRange(userId: string, start: Date, end: Date) {
    return this.prisma.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          // Events that start within the range
          { startTime: { gte: start, lte: end } },
          // Events that end within the range
          { endTime: { gte: start, lte: end } },
          // Events that span the entire range
          { AND: [{ startTime: { lte: start } }, { endTime: { gte: end } }] },
        ],
      },
      orderBy: { startTime: 'asc' },
      include: { meeting: true },
    });
  }

  /**
   * Detect conflicts within a list of already-fetched events.
   * Used by view endpoints to include conflict info in the response.
   */
  private detectConflictsInList(events: CalendarEventRow[], _userId: string): ConflictResult[] {
    const conflicts: ConflictResult[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const a = events[i]!;
        const b = events[j]!;
        const aStart = new Date(a.startTime);
        const aEnd = new Date(a.endTime);
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);

        if (aStart < bEnd && aEnd > bStart) {
          const overlapStart = aStart > bStart ? aStart : bStart;
          const overlapEnd = aEnd < bEnd ? aEnd : bEnd;
          const overlapMinutes = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000);

          conflicts.push({
            severity: ConflictSeverity.HARD,
            eventA: { id: a.id, title: a.title, startTime: aStart, endTime: aEnd },
            eventB: { id: b.id, title: b.title, startTime: bStart, endTime: bEnd },
            overlapMinutes,
            message: `"${a.title}" overlaps "${b.title}" by ${overlapMinutes} minutes`,
          });
        }
      }
    }

    return conflicts;
  }

  private formatHourLabel(hour: number): string {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    if (hour < 12) return `${hour}:00 AM`;
    return `${hour - 12}:00 PM`;
  }

  private validateBufferIncrements(before?: number, after?: number) {
    if (before !== undefined && before > 0 && before % 5 !== 0) {
      throw new BadRequestException('Buffer before must be in 5-minute increments');
    }
    if (after !== undefined && after > 0 && after % 5 !== 0) {
      throw new BadRequestException('Buffer after must be in 5-minute increments');
    }
  }
}
