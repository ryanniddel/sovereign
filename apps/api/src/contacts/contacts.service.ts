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
}
