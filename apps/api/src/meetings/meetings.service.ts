import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RequestMeetingDto } from './dto/request-meeting.dto';
import { QualifyMeetingDto } from './dto/qualify-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { SubmitAgendaDto } from './dto/submit-agenda.dto';
import { DistributePreReadDto } from './dto/distribute-pre-read.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { RateMeetingDto } from './dto/rate-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { validateTransition } from './meetings-lifecycle.service';
import { calculateMeetingCost } from '../common';
import { MeetingStatus, QualifiedBy } from '@sovereign/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async requestMeeting(userId: string, dto: RequestMeetingDto) {
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

  async qualify(userId: string, id: string, dto: QualifyMeetingDto) {
    const meeting = await this.getMeeting(userId, id);
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
      });
    } else {
      return this.prisma.meeting.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          rejectionReason: dto.rejectionReason,
        },
      });
    }
  }

  async schedule(userId: string, id: string) {
    const meeting = await this.getMeeting(userId, id);
    validateTransition(meeting.status as MeetingStatus, MeetingStatus.SCHEDULED);

    if (!meeting.agendaUrl) {
      throw new BadRequestException('Cannot schedule: no agenda submitted');
    }

    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'SCHEDULED' },
    });
  }

  async submitAgenda(userId: string, id: string, dto: SubmitAgendaDto) {
    const meeting = await this.getMeeting(userId, id);

    return this.prisma.meeting.update({
      where: { id },
      data: {
        agendaUrl: dto.agendaUrl,
        agendaSubmittedAt: new Date(),
      },
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
    });
  }

  async startMeeting(userId: string, id: string) {
    const meeting = await this.getMeeting(userId, id);
    validateTransition(meeting.status as MeetingStatus, MeetingStatus.IN_PROGRESS);

    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async completeMeeting(userId: string, id: string) {
    const meeting = await this.getMeeting(userId, id);
    validateTransition(meeting.status as MeetingStatus, MeetingStatus.COMPLETED);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const participantCount = await this.prisma.meetingParticipant.count({
      where: { meetingId: id },
    });

    const cost = calculateMeetingCost(
      participantCount + 1,
      meeting.estimatedDurationMinutes,
      user?.defaultHourlyRate || 0,
    );

    return this.prisma.meeting.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        meetingCost: cost.totalCost,
        hourlyRate: user?.defaultHourlyRate || 0,
        actualDurationMinutes: meeting.estimatedDurationMinutes,
      },
    });
  }

  async cancelMeeting(userId: string, id: string) {
    const meeting = await this.getMeeting(userId, id);
    validateTransition(meeting.status as MeetingStatus, MeetingStatus.CANCELLED);

    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

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
    });
  }

  async addParticipant(userId: string, meetingId: string, dto: AddParticipantDto) {
    await this.getMeeting(userId, meetingId);

    return this.prisma.meetingParticipant.create({
      data: {
        meetingId,
        email: dto.email,
        name: dto.name,
        role: (dto.role || 'REQUIRED') as any,
        contactId: dto.contactId,
      },
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

  async autoCancel(meetingId: string) {
    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'AUTO_CANCELLED' },
    });
  }

  private async getMeeting(userId: string, id: string) {
    const meeting = await this.prisma.meeting.findFirst({ where: { id, userId } });
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }
}
