import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { SupersedeAgreementDto } from './dto/supersede-agreement.dto';
import { PaginationQueryDto } from '../common';

@Injectable()
export class AgreementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAgreementDto) {
    return this.prisma.agreement.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        parties: dto.parties,
        agreedAt: dto.agreedAt ? new Date(dto.agreedAt) : new Date(),
        meetingId: dto.meetingId,
      },
    });
  }

  async findAll(userId: string, query: PaginationQueryDto) {
    const [data, total] = await Promise.all([
      this.prisma.agreement.findMany({
        where: { userId },
        include: { meeting: true, supersededBy: true, supersedes: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder }
          : { agreedAt: 'desc' },
      }),
      this.prisma.agreement.count({ where: { userId } }),
    ]);

    return { data, total };
  }

  async findOne(userId: string, id: string) {
    const agreement = await this.prisma.agreement.findFirst({
      where: { id, userId },
      include: { meeting: true, supersededBy: true, supersedes: true },
    });
    if (!agreement) throw new NotFoundException('Agreement not found');
    return agreement;
  }

  async update(userId: string, id: string, dto: UpdateAgreementDto) {
    await this.findOne(userId, id);
    return this.prisma.agreement.update({
      where: { id },
      data: dto as any,
    });
  }

  async supersede(userId: string, id: string, dto: SupersedeAgreementDto) {
    await this.findOne(userId, id);

    const newAgreement = await this.prisma.agreement.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        parties: dto.parties,
        agreedAt: new Date(),
      },
    });

    await this.prisma.agreement.update({
      where: { id },
      data: {
        isActive: false,
        supersededById: newAgreement.id,
      },
    });

    return newAgreement;
  }

  async deactivate(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.agreement.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.agreement.delete({ where: { id } });
  }
}
