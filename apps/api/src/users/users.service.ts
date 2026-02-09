import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePsychometricsDto } from './dto/update-psychometrics.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateBriefingPreferencesDto } from './dto/update-briefing-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByAuth0Id(auth0Id: string) {
    return this.prisma.user.findUnique({ where: { auth0Id } });
  }

  async findOrCreateFromAuth0(auth0Id: string, email?: string) {
    let user = await this.prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      const resolvedEmail = email || `${auth0Id}@unknown`;
      user = await this.prisma.user.create({
        data: {
          auth0Id,
          email: resolvedEmail,
          name: resolvedEmail.split('@')[0],
        },
      });
    } else if (email && user.email.endsWith('@unknown')) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { email, name: email.split('@')[0] },
      });
    }
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async updatePsychometrics(userId: string, dto: UpdatePsychometricsDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async updateWorkingHours(userId: string, dto: UpdateWorkingHoursDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  async updateBriefingPreferences(userId: string, dto: UpdateBriefingPreferencesDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }
}
