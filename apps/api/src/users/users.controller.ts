import { Controller, Get, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePsychometricsDto } from './dto/update-psychometrics.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { UpdateBriefingPreferencesDto } from './dto/update-briefing-preferences.dto';
import { wrapResponse } from '../common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(
      currentUser.auth0Id,
      currentUser.email,
    );
    return wrapResponse(user);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.findOrCreateFromAuth0(
      currentUser.auth0Id,
      currentUser.email,
    );
    const updated = await this.usersService.updateProfile(user.id, dto);
    return wrapResponse(updated);
  }

  @Patch('me/psychometrics')
  async updatePsychometrics(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: UpdatePsychometricsDto,
  ) {
    const user = await this.usersService.findOrCreateFromAuth0(
      currentUser.auth0Id,
      currentUser.email,
    );
    const updated = await this.usersService.updatePsychometrics(user.id, dto);
    return wrapResponse(updated);
  }

  @Patch('me/working-hours')
  async updateWorkingHours(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: UpdateWorkingHoursDto,
  ) {
    const user = await this.usersService.findOrCreateFromAuth0(
      currentUser.auth0Id,
      currentUser.email,
    );
    const updated = await this.usersService.updateWorkingHours(user.id, dto);
    return wrapResponse(updated);
  }

  @Patch('me/briefing-preferences')
  async updateBriefingPreferences(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: UpdateBriefingPreferencesDto,
  ) {
    const user = await this.usersService.findOrCreateFromAuth0(
      currentUser.auth0Id,
      currentUser.email,
    );
    const updated = await this.usersService.updateBriefingPreferences(user.id, dto);
    return wrapResponse(updated);
  }
}
