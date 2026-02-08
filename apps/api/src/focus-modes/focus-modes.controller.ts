import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { FocusModesService } from './focus-modes.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateFocusModeDto } from './dto/create-focus-mode.dto';
import { UpdateFocusModeDto } from './dto/update-focus-mode.dto';
import { OverrideFocusModeDto } from './dto/override-focus-mode.dto';
import { wrapResponse } from '../common';

@Controller('focus-modes')
export class FocusModesController {
  constructor(
    private readonly focusModesService: FocusModesService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Post()
  async create(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateFocusModeDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.create(userId, dto);
    return wrapResponse(mode);
  }

  @Get()
  async findAll(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const modes = await this.focusModesService.findAll(userId);
    return wrapResponse(modes);
  }

  @Get('active')
  async getActive(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.getActive(userId);
    return wrapResponse(mode);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.findOne(userId, id);
    return wrapResponse(mode);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateFocusModeDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.update(userId, id, dto);
    return wrapResponse(mode);
  }

  @Post(':id/activate')
  async activate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.activate(userId, id);
    return wrapResponse(mode);
  }

  @Post(':id/deactivate')
  async deactivate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.deactivate(userId, id);
    return wrapResponse(mode);
  }

  @Post(':id/override')
  async override2fa(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: OverrideFocusModeDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.override2fa(userId, id, dto.confirmationCode);
    return wrapResponse(mode);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.focusModesService.remove(userId, id);
    return wrapResponse(null, 'Focus mode deleted');
  }
}
