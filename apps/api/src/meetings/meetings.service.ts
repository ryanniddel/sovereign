import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RequestMeetingDto } from './dto/request-meeting.dto';
import { QualifyMeetingDto } from './dto/qualify-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ScheduleMeetingDto } from './dto/schedule-meeting.dto';
import { RescheduleMeetingDto } from './dto/reschedule-meeting.dto';
import { SubmitAgendaDto } from './dto/submit-agenda.dto';
import { DistributePreReadDto } from './dto/distribute-pre-read.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { RateMeetingDto } from './dto/rate-meeting.dto';
import { SubmitRecapDto } from './dto/submit-recap.dto';
import { CompleteMeetingDto } from './dto/complete-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { MeetingAnalyticsQueryDto } from './dto/meeting-analytics-query.dto';
import { validateTransition } from './meetings-lifecycle.service';
import { calculateMeetingCost } from '../common';
import { MeetingStatus } from '@sovereign/shared';
import { Prisma } from '@prisma/client';
import { ContactsService } from '../contacts/contacts.service';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contactsService: ContactsService,
  ) {}

  // ════════════════════════════════════════════════════════════════
  // CREATE & READ
  // ════════════════════════════════════════════════════════════════

  async requestMeeting(userId: string, dto: RequestMeetingDto) {
    // Modern Meeting Standard: purpose is required
    if (!dto.purpose?.trim()) {
      throw new BadRequestException('Purpose is required (Modern Meeting Standard)');
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        purpose: dto.purpose,
        decisionRequired: dto.decisionRequired,
        estimatedDurationMinutes: dto.estimatedDurationMinutes || 30,
        meetingType: dto.meetingType as any,
        agendaUrl: dto.agendaUrl,
        preReadUrl: dto.preReadUrl,
        status: 'REQUESTED',
      },
      include: { participants: true },
    });

    if (dto.participantEmails?.length) {
      await this.prisma.$transaction(
        dto.participantEmails.map((email) =>
          this.prisma.meetingParticipant.create({
            data: {
              meetingId: meeting.id,
              email,
              name: email.split('@')[0],
              role: 'REQUIRED',
            },
          }),
        ),
      );
    }

    return this.prisma.meeting.findUnique({
      where: { id: meeting.id },
      include: { participants: true },
    });
  }

  async findAll(userId: string, query: MeetingQueryDto) {
    const where: Prisma.MeetingWhereInput = { userId };
    if (query.status) where.status = query.status;
    if (query.meetingType) where.meetingType = query.meetingType;

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: { participants: true, _count: { select: { participants: true } } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder }
          : { createdAt: 'desc' },
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(userId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, userId },
      include: {
        participants: { include: { contact: true } },
        calendarEvent: true,
        commitments: true,
        actionItems: true,
        agreements: true,
      },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async updateMeeting(userId: string, id: string, dto: UpdateMeetingDto) {
    const meeting = await this.getMeeting(userId, id);

    // Only allow updates on non-terminal meetings
    if (['COMPLETED', 'CANCELLED', 'AUTO_CANCELLED'].includes(meeting.status)) {
      throw new BadRequestException('Cannot update a completed or cancelled meeting');
    }

    return this.prisma.meeting.update({
      where: { id },
      data: dto as any,
      include: { participants: true },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // LIFECYCLE TRANSITIONS
  // ════════════════════════════════════════════════════════════════

  async qualify(userId: string, id: string, dto: QualifyMeetingDto) {
    const meeting = await this.getMeeting(userId, id);

    // Modern Meeting Standard enforcement: purpose must exist
    if (dto.approved && !meeting.purpose?.trim()) {
      throw new BadRequestException('Cannot qualify: no purpose defined (Modern Meeting Standard)');
    }

    validateTransition(meeting.status as MeetingStatus, MeetingStatus.QUALIFYING);

    if (dto.approved) {
      return this.prisma.meeting.update({
        where: { id },
        data: {
          status: 'QUALIFIED',
          isQualified: true,
          qualifiedAt: new Date(),
          qualifiedBy: (dto.qualifiedBy || 'USER') as any,
        },
        include: { participants: true },
      });
    } else {
      return this.prisma.meeting.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          rejectionReason: dto.rejectionReason,
        },
        include: { participants: true },
      });
    }
  }

  /**
   * Schedule a meeting: validates agenda exists, transitions to SCHEDULED,
   * auto-creates a CalendarEvent linked to this meeting.
   */
  async schedule(userId: string, id: string, dto: ScheduleMeetingDto) {
    const meeting = await this.getMeeting(userId, id);
    validateTransition(meeting.status as MeetingStatus, MeetingStatus.SCHEDULED);

    if (!meeting.agendaUrl) {
      throw new BadRequestException('Cannot schedule: no agenda submitted (Modern Meeting Standard)');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    // Auto-create calendar event
    const calendarEvent = await this.prisma.calendarEvent.create({
      data: {
        userId,
        title: meeting.title,
        description: meeting.purpose || meeting.description || undefined,
        startTime,
        endTime,
        eventType: 'MEETING',
        isProtected: false,
        source: 'SOVEREIGN',
        location: dto.location,
        meetingId: id,
        travelBufferMinutes: dto.travelBufferMinutes,
        travelOrigin: dto.travelOrigin,
        travelDestination: dto.travelDestination,
      },
    });

    // If travel buffer, create travel event
    if (dto.travelBufferMinutes && dto.travelBufferMinutes > 0) {
      const travelEnd = new Date(startTime);
      const travelStart = new Date(travelEnd.getTime() - dto.travelBufferMinutes * 60 * 1000);

      const travelEvent = await this.prisma.calendarEvent.create({
        data: {
          userId,
          title: `Travel to: ${meeting.title}`,
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

      await this.prisma.calendarEvent.update({
        where: { id: calendarEvent.id },
        data: { travelEventId: travelEvent.id },
      });
    }

    return this.prisma.meeting.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        scheduledLocation: dto.location,
      },
      include: { participants: true, calendarEvent: true },
    });
  }

  /**
   * Reschedule: update the scheduled time, log the reschedule in history,
   * and update the linked CalendarEvent.
   */
  async reschedule(userId: string, id: string, dto: RescheduleMeetingDto) {
    const meeting = await this.getMeeting(userId, id);

    if (!['SCHEDULED', 'PREP_SENT'].includes(meeting.status)) {
      throw new BadRequestException('Can only reschedule SCHEDULED or PREP_SENT meetings');
    }

    const newStart = new Date(dto.startTime);
    const newEnd = new Date(dto.endTime);

    // Build reschedule history entry
    const history = (meeting.rescheduleHistory as any[]) || [];
    history.push({
      previousStartTime: meeting.scheduledStartTime?.toISOString(),
      previousEndTime: meeting.scheduledEndTime?.toISOString(),
      newStartTime: dto.startTime,
      newEndTime: dto.endTime,
      reason: dto.reason,
      rescheduledAt: new Date().toISOString(),
    });

    // Update linked calendar event
    const calendarEvent = await this.prisma.calendarEvent.findFirst({
      where: { meetingId: id },
    });
    if (calendarEvent) {
      await this.prisma.calendarEvent.update({
        where: { id: calendarEvent.id },
        data: {
          startTime: newStart,
          endTime: newEnd,
          location: dto.location ?? undefined,
        },
      });

      // Update linked travel event if exists
      if (calendarEvent.travelEventId) {
        const travelBuffer = calendarEvent.travelBufferMinutes || 0;
        if (travelBuffer > 0) {
          const travelEnd = new Date(newStart);
          const travelStart = new Date(travelEnd.getTime() - travelBuffer * 60 * 1000);
          await this.prisma.calendarEvent.update({
            where: { id: calendarEvent.travelEventId },
            data: { startTime: travelStart, endTime: travelEnd },
          });
        }
      }
    }

    return this.prisma.meeting.update({
      where: { id },
      data: {
        scheduledStartTime: newStart,
        scheduledEndTime: newEnd,
        scheduledLocation: dto.location ?? meeting.scheduledLocation,
        rescheduleHistory: history as any,
        rescheduleCount: { increment: 1 },
      },
      include: { participants: true, calendarEvent: true },
    });
  }

  async submitAgenda(userId: string, id: string, dto: SubmitAgendaDto) {
    await this.getMeeting(userId, id);

    return this.prisma.meeting.update({
      where: { id },
      data: {
        agendaUrl: dto.agendaUrl,
        agendaSubmittedAt: new Date(),
      },
      include: { participants: true },
    });
  }

  async distributePreRead(userId: string, id: string, dto: DistributePreReadDto) {
    const meeting = await this.getMeeting(userId, id);

    const data: Record<string, unknown> = {
      preReadUrl: dto.preReadUrl,
      preReadDistributedAt: new Date(),
    };

    if (dto.deadline) {
      data.preReadDeadline = new Date(dto.deadline);
    } else {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      data.preReadDeadline = deadline;
    }

    if (meeting.status === 'SCHEDULED') {
      data.status = 'PREP_SENT';
    }

    return this.prisma.meeting.update({
      where: { id },
      data: data as any,
      include: { participants: true },
    });
  }

  async startMeeting(userId: string, id: string) {
    const meeting = await this.getMeeting(userId, id);
    validateTransition(meeting.status as MeetingStatus, MeetingStatus.IN_PROGRESS);

    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: { participants: true },
    });
  }

  /**
   * Complete a meeting: calculate cost from actual duration + participant count,
   * transition to COMPLETED.
   */
  async completeMeeting(userId: string, id: string, dto?: CompleteMeetingDto) {
    const meeting = await this.getMeeting(userId, id);
    validateTransition(meeting.status as MeetingStatus, MeetingStatus.COMPLETED);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const participantCount = await this.prisma.meetingParticipant.count({
      where: { meetingId: id },
    });

    const actualMinutes = dto?.actualDurationMinutes || meeting.estimatedDurationMinutes;

    const cost = calculateMeetingCost(
      participantCount + 1, // +1 for organizer
      actualMinutes,
      user?.defaultHourlyRate || 0,
    );

    const updated = await this.prisma.meeting.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        meetingCost: cost.totalCost,
        hourlyRate: user?.defaultHourlyRate || 0,
        actualDurationMinutes: actualMinutes,
      },
      include: { participants: true, calendarEvent: true },
    });

    // Boost relationship scores for all participants with linked contacts
    const participants = await this.prisma.meetingParticipant.findMany({
      where: { meetingId: id, contactId: { not: null } },
    });
    for (const p of participants) {
      if (p.contactId) {
        await this.contactsService.boostRelationshipScore(userId, p.contactId, 'meeting_completed');
      }
    }

    return updated;
  }

  async cancelMeeting(userId: string, id: string) {
    const meeting = await this.getMeeting(userId, id);
    validateTransition(meeting.status as MeetingStatus, MeetingStatus.CANCELLED);

    // Clean up linked calendar event
    const calendarEvent = await this.prisma.calendarEvent.findFirst({
      where: { meetingId: id },
    });
    if (calendarEvent) {
      if (calendarEvent.travelEventId) {
        await this.prisma.calendarEvent.delete({ where: { id: calendarEvent.travelEventId } }).catch(() => {});
      }
      await this.prisma.calendarEvent.delete({ where: { id: calendarEvent.id } }).catch(() => {});
    }

    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { participants: true },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // POST-MEETING
  // ════════════════════════════════════════════════════════════════

  async rateMeeting(userId: string, id: string, dto: RateMeetingDto) {
    const meeting = await this.getMeeting(userId, id);
    if (meeting.status !== 'COMPLETED') {
      throw new BadRequestException('Can only rate completed meetings');
    }

    return this.prisma.meeting.update({
      where: { id },
      data: {
        rating: dto.rating,
        valueScore: dto.valueScore,
        wasNecessary: dto.wasNecessary,
      },
      include: { participants: true },
    });
  }

  /**
   * Submit post-meeting recap with optional auto-creation of action items,
   * commitments, agreements, and contradiction detection.
   */
  async submitRecap(userId: string, id: string, dto: SubmitRecapDto) {
    const meeting = await this.getMeeting(userId, id);
    if (meeting.status !== 'COMPLETED') {
      throw new BadRequestException('Can only submit recap for completed meetings');
    }

    // Update meeting with transcript/recap
    const updateData: Record<string, unknown> = {};
    if (dto.transcriptUrl) updateData.transcriptUrl = dto.transcriptUrl;
    if (dto.recapContent) updateData.recapContent = dto.recapContent;
    if (dto.actualDurationMinutes) updateData.actualDurationMinutes = dto.actualDurationMinutes;
    if (dto.contradictions?.length) {
      updateData.contradictions = dto.contradictions as any;
    }

    await this.prisma.meeting.update({
      where: { id },
      data: updateData as any,
    });

    const created = { actionItems: 0, commitments: 0, agreements: 0 };

    // Auto-create extracted items if requested
    if (dto.autoCreateItems !== false) {
      if (dto.actionItems?.length) {
        for (const item of dto.actionItems) {
          await this.prisma.actionItem.create({
            data: {
              userId,
              meetingId: id,
              title: item.title,
              ownerId: userId,
              ownerType: 'USER',
              dueDate: item.dueDate ? new Date(item.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'PENDING',
              priority: 'MEDIUM',
            },
          });
          created.actionItems++;
        }
      }

      if (dto.commitments?.length) {
        for (const item of dto.commitments) {
          await this.prisma.commitment.create({
            data: {
              userId,
              meetingId: id,
              title: item.title,
              ownerId: userId,
              ownerType: 'USER',
              dueDate: item.dueDate ? new Date(item.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'PENDING',
              priority: 'MEDIUM',
            },
          });
          created.commitments++;
        }
      }

      if (dto.agreements?.length) {
        for (const item of dto.agreements) {
          await this.prisma.agreement.create({
            data: {
              userId,
              meetingId: id,
              title: item.title,
              description: item.description,
              parties: (item.parties || []) as any,
              agreedAt: new Date(),
            },
          });
          created.agreements++;
        }
      }
    }

    const updated = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        participants: true,
        actionItems: true,
        commitments: true,
        agreements: true,
      },
    });

    return {
      meeting: updated,
      created,
      contradictions: dto.contradictions || [],
    };
  }

  // ════════════════════════════════════════════════════════════════
  // PARTICIPANTS
  // ════════════════════════════════════════════════════════════════

  async addParticipant(userId: string, meetingId: string, dto: AddParticipantDto) {
    await this.getMeeting(userId, meetingId);

    // Auto-enrich: find or create contact from participant email
    let contactId = dto.contactId;
    if (!contactId) {
      const contact = await this.contactsService.findOrCreateFromEmail(
        userId,
        dto.email,
        dto.name,
      );
      contactId = contact.id;

      // Boost relationship score for meeting scheduling
      await this.contactsService.boostRelationshipScore(userId, contactId, 'meeting_scheduled');
    }

    return this.prisma.meetingParticipant.create({
      data: {
        meetingId,
        email: dto.email,
        name: dto.name,
        role: (dto.role || 'REQUIRED') as any,
        contactId,
      },
      include: { contact: true },
    });
  }

  async removeParticipant(userId: string, meetingId: string, participantId: string) {
    await this.getMeeting(userId, meetingId);

    const participant = await this.prisma.meetingParticipant.findFirst({
      where: { id: participantId, meetingId },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    return this.prisma.meetingParticipant.delete({ where: { id: participantId } });
  }

  async acknowledgeParticipant(meetingId: string, participantId: string) {
    const participant = await this.prisma.meetingParticipant.findFirst({
      where: { id: participantId, meetingId },
    });
    if (!participant) throw new NotFoundException('Participant not found');

    return this.prisma.meetingParticipant.update({
      where: { id: participantId },
      data: {
        hasAcknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ════════════════════════════════════════════════════════════════

  async getAnalytics(userId: string, query: MeetingAnalyticsQueryDto) {
    const where: Prisma.MeetingWhereInput = { userId };
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) (where.createdAt as any).gte = new Date(query.startDate);
      if (query.endDate) (where.createdAt as any).lte = new Date(query.endDate);
    }

    const meetings = await this.prisma.meeting.findMany({
      where,
      include: { _count: { select: { participants: true } } },
    });

    const completed = meetings.filter((m) => m.status === 'COMPLETED');
    const cancelled = meetings.filter((m) => m.status === 'CANCELLED');
    const autoCancelled = meetings.filter((m) => m.status === 'AUTO_CANCELLED');
    const rated = completed.filter((m) => m.rating !== null);
    const valueScored = completed.filter((m) => m.valueScore !== null);
    const qualified = meetings.filter((m) => m.isQualified);

    const totalCost = completed.reduce((sum, m) => sum + (m.meetingCost || 0), 0);
    const totalMinutes = completed.reduce((sum, m) => sum + (m.actualDurationMinutes || m.estimatedDurationMinutes), 0);

    const meetingsByType: Record<string, number> = {};
    const meetingsByStatus: Record<string, number> = {};
    for (const m of meetings) {
      if (m.meetingType) meetingsByType[m.meetingType] = (meetingsByType[m.meetingType] || 0) + 1;
      meetingsByStatus[m.status] = (meetingsByStatus[m.status] || 0) + 1;
    }

    return {
      totalMeetings: meetings.length,
      completedMeetings: completed.length,
      cancelledMeetings: cancelled.length,
      autoCancelledMeetings: autoCancelled.length,
      totalCost: Math.round(totalCost * 100) / 100,
      totalHoursInMeetings: Math.round((totalMinutes / 60) * 100) / 100,
      averageRating: rated.length > 0
        ? Math.round((rated.reduce((s, m) => s + m.rating!, 0) / rated.length) * 100) / 100
        : null,
      averageValueScore: valueScored.length > 0
        ? Math.round((valueScored.reduce((s, m) => s + m.valueScore!, 0) / valueScored.length) * 100) / 100
        : null,
      meetingsRatedUnnecessary: completed.filter((m) => m.wasNecessary === false).length,
      meetingsByType,
      meetingsByStatus,
      qualificationRate: meetings.length > 0
        ? Math.round((qualified.length / meetings.length) * 100) / 100
        : 0,
      averageDurationMinutes: completed.length > 0
        ? Math.round(totalMinutes / completed.length)
        : 0,
      costPerMeeting: completed.length > 0
        ? Math.round((totalCost / completed.length) * 100) / 100
        : 0,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // RECURRING MEETING GOVERNANCE
  // ════════════════════════════════════════════════════════════════

  async getRecurringReviews(userId: string) {
    // Get all recurring meeting groups
    const recurringMeetings = await this.prisma.meeting.findMany({
      where: { userId, isRecurring: true },
      include: { _count: { select: { participants: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Group by recurringGroupId
    const groups = new Map<string, typeof recurringMeetings>();
    for (const m of recurringMeetings) {
      const groupId = m.recurringGroupId || m.id;
      if (!groups.has(groupId)) groups.set(groupId, []);
      groups.get(groupId)!.push(m);
    }

    const reviews = [];
    for (const [groupId, groupMeetings] of groups) {
      const completed = groupMeetings.filter((m) => m.status === 'COMPLETED');
      const rated = completed.filter((m) => m.rating !== null);
      const totalCost = completed.reduce((s, m) => s + (m.meetingCost || 0), 0);
      const avgRating = rated.length > 0
        ? rated.reduce((s, m) => s + m.rating!, 0) / rated.length
        : null;
      const avgAttendance = completed.length > 0
        ? completed.reduce((s, m) => s + (m._count.participants + 1), 0) / completed.length
        : 0;
      const unnecessaryPct = completed.length > 0
        ? (completed.filter((m) => m.wasNecessary === false).length / completed.length) * 100
        : 0;

      let recommendation: 'KEEP' | 'REVIEW' | 'CANCEL' = 'KEEP';
      let reason = 'Meeting performance is acceptable';

      if (avgRating !== null && avgRating < 2.5) {
        recommendation = 'CANCEL';
        reason = `Low average rating (${avgRating.toFixed(1)}/5)`;
      } else if (unnecessaryPct > 50) {
        recommendation = 'CANCEL';
        reason = `${Math.round(unnecessaryPct)}% rated as unnecessary`;
      } else if (avgRating !== null && avgRating < 3.5) {
        recommendation = 'REVIEW';
        reason = `Below-average rating (${avgRating.toFixed(1)}/5) — consider restructuring`;
      } else if (unnecessaryPct > 25) {
        recommendation = 'REVIEW';
        reason = `${Math.round(unnecessaryPct)}% rated as unnecessary — review frequency`;
      }

      reviews.push({
        meetingId: groupId,
        title: groupMeetings[0].title,
        totalOccurrences: groupMeetings.length,
        averageRating: avgRating ? Math.round(avgRating * 100) / 100 : null,
        averageCost: completed.length > 0 ? Math.round((totalCost / completed.length) * 100) / 100 : 0,
        totalCost: Math.round(totalCost * 100) / 100,
        averageAttendance: Math.round(avgAttendance * 10) / 10,
        percentRatedUnnecessary: Math.round(unnecessaryPct),
        recommendation,
        reasonForRecommendation: reason,
      });
    }

    return reviews;
  }

  // ════════════════════════════════════════════════════════════════
  // INTERNAL / PROCESSOR HELPERS
  // ════════════════════════════════════════════════════════════════

  async autoCancel(meetingId: string) {
    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'AUTO_CANCELLED' },
    });
  }

  async getMeetingsByIds(ids: string[]) {
    return this.prisma.meeting.findMany({
      where: { id: { in: ids } },
      include: { participants: true },
    });
  }

  private async getMeeting(userId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, userId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }
}
