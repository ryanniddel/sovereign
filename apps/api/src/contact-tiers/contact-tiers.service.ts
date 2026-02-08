import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContactTierDto } from './dto/create-contact-tier.dto';
import { UpdateContactTierDto } from './dto/update-contact-tier.dto';

const DEFAULT_TIERS = [
  { name: 'Inner Circle', priority: 1, escalationDelayMinutes: 0, calendarAccessLevel: 'full', communicationPriority: 'critical' },
  { name: 'Key Stakeholders', priority: 2, escalationDelayMinutes: 30, calendarAccessLevel: 'extended', communicationPriority: 'high' },
  { name: 'Standard', priority: 3, escalationDelayMinutes: 60, calendarAccessLevel: 'standard', communicationPriority: 'normal' },
  { name: 'Low Priority', priority: 4, escalationDelayMinutes: 120, calendarAccessLevel: 'limited', communicationPriority: 'low' },
];

@Injectable()
export class ContactTiersService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults(userId: string) {
    const existing = await this.prisma.contactTier.findMany({ where: { userId } });
    if (existing.length > 0) return existing;

    return this.prisma.$transaction(
      DEFAULT_TIERS.map((tier) =>
        this.prisma.contactTier.create({ data: { ...tier, userId } }),
      ),
    );
  }

  async create(userId: string, dto: CreateContactTierDto) {
    return this.prisma.contactTier.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: string) {
    return this.prisma.contactTier.findMany({
      where: { userId },
      orderBy: { priority: 'asc' },
      include: { _count: { select: { contacts: true } } },
    });
  }

  async update(userId: string, id: string, dto: UpdateContactTierDto) {
    const tier = await this.prisma.contactTier.findFirst({ where: { id, userId } });
    if (!tier) throw new NotFoundException('Contact tier not found');

    return this.prisma.contactTier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    const tier = await this.prisma.contactTier.findFirst({ where: { id, userId } });
    if (!tier) throw new NotFoundException('Contact tier not found');

    return this.prisma.contactTier.delete({ where: { id } });
  }
}
