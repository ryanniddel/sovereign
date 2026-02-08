import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateFocusModeDto } from './dto/create-focus-mode.dto';
import { UpdateFocusModeDto } from './dto/update-focus-mode.dto';

const DEFAULT_FOCUS_MODES = [
  { name: 'Deep Work', description: 'Block all non-critical notifications', allowCriticalOnly: true, allowMeetingPrep: false, allowAll: false },
  { name: 'Meeting Mode', description: 'Allow meeting prep notifications', allowCriticalOnly: false, allowMeetingPrep: true, allowAll: false },
  { name: 'Available', description: 'Allow all notifications', allowCriticalOnly: false, allowMeetingPrep: true, allowAll: true },
  { name: 'Off Hours', description: 'Critical only outside work hours', allowCriticalOnly: true, allowMeetingPrep: false, allowAll: false },
];

@Injectable()
export class FocusModesService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults(userId: string) {
    const existing = await this.prisma.focusMode.findMany({ where: { userId } });
    if (existing.length > 0) return existing;

    return this.prisma.$transaction(
      DEFAULT_FOCUS_MODES.map((mode) =>
        this.prisma.focusMode.create({ data: { ...mode, userId } }),
      ),
    );
  }

  async create(userId: string, dto: CreateFocusModeDto) {
    return this.prisma.focusMode.create({
      data: { ...dto, userId } as any,
    });
  }

  async findAll(userId: string) {
    return this.prisma.focusMode.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const mode = await this.prisma.focusMode.findFirst({ where: { id, userId } });
    if (!mode) throw new NotFoundException('Focus mode not found');
    return mode;
  }

  async update(userId: string, id: string, dto: UpdateFocusModeDto) {
    await this.findOne(userId, id);
    return this.prisma.focusMode.update({
      where: { id },
      data: dto as any,
    });
  }

  async activate(userId: string, id: string) {
    await this.findOne(userId, id);

    // Deactivate all other focus modes
    await this.prisma.focusMode.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    return this.prisma.focusMode.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.focusMode.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async override2fa(userId: string, id: string, confirmationCode: string) {
    const mode = await this.findOne(userId, id);

    if (!mode.requires2faOverride) {
      throw new BadRequestException('This focus mode does not require 2FA override');
    }

    if (confirmationCode !== 'CONFIRM_OVERRIDE') {
      throw new BadRequestException('Invalid confirmation code');
    }

    return this.prisma.focusMode.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getActive(userId: string) {
    return this.prisma.focusMode.findFirst({
      where: { userId, isActive: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.focusMode.delete({ where: { id } });
  }
}
