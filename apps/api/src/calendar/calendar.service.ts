import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateFocusBlockDto } from './dto/create-focus-block.dto';
import { DateRangeQueryDto } from '../common';
import {
  getDailyRange,
  getWeeklyRange,
  getMonthlyRange,
  getQuarterlyRange,
} from './helpers/view-projection.helper';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(userId: string, dto: CreateEventDto) {
    return this.prisma.calendarEvent.create({
      data: {
        ...dto,
        userId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
      },
    });
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

  async getDailyView(userId: string, date: string, timezone: string) {
    const range = getDailyRange(date, timezone);
    return this.getEventsInRange(userId, range.start, range.end);
  }

  async getWeeklyView(userId: string, date: string, timezone: string) {
    const range = getWeeklyRange(date, timezone);
    return this.getEventsInRange(userId, range.start, range.end);
  }

  async getMonthlyView(userId: string, date: string, timezone: string) {
    const range = getMonthlyRange(date, timezone);
    return this.getEventsInRange(userId, range.start, range.end);
  }

  async getQuarterlyView(userId: string, date: string, timezone: string) {
    const range = getQuarterlyRange(date, timezone);
    return this.getEventsInRange(userId, range.start, range.end);
  }

  async getAgendaView(userId: string, date: string, timezone: string) {
    const start = new Date(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 14);
    return this.getEventsInRange(userId, start, end);
  }

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
    };
  }

  async checkConflicts(userId: string, startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflicts = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        OR: [
          { startTime: { gte: start, lt: end } },
          { endTime: { gt: start, lte: end } },
          { AND: [{ startTime: { lte: start } }, { endTime: { gte: end } }] },
        ],
      },
      orderBy: { startTime: 'asc' },
    });

    return { hasConflicts: conflicts.length > 0, conflicts };
  }

  async findAvailableSlots(
    userId: string,
    date: string,
    durationMinutes: number,
    timezone: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

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

    const busyPeriods = events
      .map((e) => ({ start: new Date(e.startTime).getTime(), end: new Date(e.endTime).getTime() }))
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

  async updateEvent(userId: string, id: string, dto: UpdateEventDto) {
    const event = await this.prisma.calendarEvent.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Calendar event not found');

    const data: Record<string, unknown> = { ...dto };
    if (dto.startTime) data.startTime = new Date(dto.startTime);
    if (dto.endTime) data.endTime = new Date(dto.endTime);

    return this.prisma.calendarEvent.update({ where: { id }, data: data as any });
  }

  async deleteEvent(userId: string, id: string) {
    const event = await this.prisma.calendarEvent.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Calendar event not found');

    return this.prisma.calendarEvent.delete({ where: { id } });
  }

  private async getEventsInRange(userId: string, start: Date, end: Date) {
    return this.prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: { gte: start },
        endTime: { lte: end },
      },
      orderBy: { startTime: 'asc' },
      include: { meeting: true },
    });
  }
}
