import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { UpdateDiscDto } from './dto/update-disc.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: { ...dto, userId },
      include: { tier: true },
    });
  }

  async bulkImport(userId: string, contacts: CreateContactDto[]) {
    const results = await this.prisma.$transaction(
      contacts.map((dto) =>
        this.prisma.contact.upsert({
          where: { userId_email: { userId, email: dto.email } },
          create: { ...dto, userId },
          update: { ...dto },
        }),
      ),
    );
    return results;
  }

  async findAll(userId: string, query: ContactQueryDto) {
    const where: Prisma.ContactWhereInput = { userId };

    if (query.tierId) where.tierId = query.tierId;
    if (query.company) where.company = { contains: query.company, mode: 'insensitive' };
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: { tier: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder }
          : { name: 'asc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { data, total };
  }

  async search(userId: string, q: string) {
    return this.prisma.contact.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { tier: true },
      take: 20,
    });
  }

  async findOne(userId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, userId },
      include: { tier: true, meetingParticipants: { include: { meeting: true }, take: 10 } },
    });
    if (!contact) throw new NotFoundException('Contact not found');
    return contact;
  }

  async update(userId: string, id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findFirst({ where: { id, userId } });
    if (!contact) throw new NotFoundException('Contact not found');

    return this.prisma.contact.update({
      where: { id },
      data: dto,
      include: { tier: true },
    });
  }

  async updateDisc(userId: string, id: string, dto: UpdateDiscDto) {
    const contact = await this.prisma.contact.findFirst({ where: { id, userId } });
    if (!contact) throw new NotFoundException('Contact not found');

    return this.prisma.contact.update({
      where: { id },
      data: dto,
    });
  }

  async assignTier(userId: string, id: string, tierId: string) {
    const contact = await this.prisma.contact.findFirst({ where: { id, userId } });
    if (!contact) throw new NotFoundException('Contact not found');

    return this.prisma.contact.update({
      where: { id },
      data: { tierId },
      include: { tier: true },
    });
  }

  async remove(userId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({ where: { id, userId } });
    if (!contact) throw new NotFoundException('Contact not found');

    return this.prisma.contact.delete({ where: { id } });
  }

  /**
   * Find or create a contact from an email address.
   * Used for auto-enrichment when meeting participants are added.
   */
  async findOrCreateFromEmail(userId: string, email: string, name?: string, company?: string) {
    const existing = await this.prisma.contact.findFirst({
      where: { userId, email },
      include: { tier: true },
    });
    if (existing) return existing;

    return this.prisma.contact.create({
      data: {
        userId,
        email,
        name: name || email.split('@')[0],
        company: company || email.split('@')[1]?.split('.')[0] || undefined,
      },
      include: { tier: true },
    });
  }

  /**
   * Boost relationship score based on interaction type.
   * meeting_completed: +5, commitment_delivered: +3, responded: +2, meeting_scheduled: +1
   */
  async boostRelationshipScore(
    userId: string,
    contactId: string,
    interactionType: 'meeting_completed' | 'commitment_delivered' | 'responded' | 'meeting_scheduled',
  ) {
    const boosts: Record<string, number> = {
      meeting_completed: 5,
      commitment_delivered: 3,
      responded: 2,
      meeting_scheduled: 1,
    };

    const contact = await this.prisma.contact.findFirst({ where: { id: contactId, userId } });
    if (!contact) return null;

    const newScore = Math.min(100, contact.relationshipScore + boosts[interactionType]);

    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        relationshipScore: newScore,
        lastInteractionAt: new Date(),
      },
    });
  }

  /**
   * Get meeting context intelligence for a contact.
   * Returns DISC profile, last interaction, open commitments in both directions,
   * delivery track record, and meeting history.
   */
  async getMeetingContext(userId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, userId },
      include: { tier: true },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    // Get meeting history via MeetingParticipant
    const participantRecords = await this.prisma.meetingParticipant.findMany({
      where: { contactId },
      include: { meeting: true },
      orderBy: { meeting: { createdAt: 'desc' } },
      take: 10,
    });

    const meetings = participantRecords.map((p) => p.meeting);
    const completedMeetings = meetings.filter((m) => m.status === 'COMPLETED');

    // Open commitments where this contact is the owner
    const openCommitmentsToContact = await this.prisma.commitment.findMany({
      where: {
        userId,
        ownerId: contactId,
        ownerType: 'CONTACT',
        status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Open commitments delegated to this contact
    const openCommitmentsFromContact = await this.prisma.commitment.findMany({
      where: {
        userId,
        delegatedToId: contactId,
        isDelegated: true,
        status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Delivery track record: commitments involving this contact
    const allContactCommitments = await this.prisma.commitment.findMany({
      where: {
        userId,
        OR: [
          { ownerId: contactId, ownerType: 'CONTACT' },
          { delegatedToId: contactId },
        ],
      },
    });

    const delivered = allContactCommitments.filter((c) => c.status === 'COMPLETED').length;
    const missed = allContactCommitments.filter((c) => c.status === 'OVERDUE').length;
    const total = allContactCommitments.length;
    const deliveryRate = total > 0 ? delivered / total : null;

    // Meeting outcome stats
    const rated = completedMeetings.filter((m) => m.rating !== null);
    const avgRating = rated.length > 0
      ? rated.reduce((s, m) => s + m.rating!, 0) / rated.length
      : null;

    // Acknowledgment responsiveness
    const ackRecords = participantRecords.filter((p) => p.hasAcknowledged);
    const responsiveness = participantRecords.length > 0
      ? ackRecords.length / participantRecords.length
      : null;

    return {
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        company: contact.company,
        title: contact.title,
        tier: contact.tier,
        relationshipScore: contact.relationshipScore,
        lastInteractionAt: contact.lastInteractionAt,
      },
      discProfile: contact.discD !== null ? {
        dominance: contact.discD,
        influence: contact.discI,
        steadiness: contact.discS,
        conscientiousness: contact.discC,
      } : null,
      openCommitments: {
        toContact: openCommitmentsToContact.map((c) => ({
          id: c.id,
          title: c.title,
          dueDate: c.dueDate,
          status: c.status,
          priority: c.priority,
        })),
        fromContact: openCommitmentsFromContact.map((c) => ({
          id: c.id,
          title: c.title,
          dueDate: c.dueDate,
          status: c.status,
          priority: c.priority,
        })),
      },
      deliveryTrackRecord: {
        total,
        delivered,
        missed,
        deliveryRate: deliveryRate !== null ? Math.round(deliveryRate * 100) / 100 : null,
      },
      meetingHistory: {
        totalMeetings: meetings.length,
        completedMeetings: completedMeetings.length,
        averageRating: avgRating !== null ? Math.round(avgRating * 100) / 100 : null,
        responsiveness: responsiveness !== null ? Math.round(responsiveness * 100) / 100 : null,
        recentMeetings: meetings.slice(0, 5).map((m) => ({
          id: m.id,
          title: m.title,
          status: m.status,
          meetingType: m.meetingType,
          createdAt: m.createdAt,
        })),
      },
    };
  }
}
