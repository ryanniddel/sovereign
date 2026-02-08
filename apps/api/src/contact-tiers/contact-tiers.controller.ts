import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ContactTiersService } from './contact-tiers.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateContactTierDto } from './dto/create-contact-tier.dto';
import { UpdateContactTierDto } from './dto/update-contact-tier.dto';
import { wrapResponse } from '../common';

@Controller('contact-tiers')
export class ContactTiersController {
  constructor(
    private readonly contactTiersService: ContactTiersService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Post()
  async create(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateContactTierDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const tier = await this.contactTiersService.create(userId, dto);
    return wrapResponse(tier);
  }

  @Get()
  async findAll(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const tiers = await this.contactTiersService.findAll(userId);
    return wrapResponse(tiers);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateContactTierDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const tier = await this.contactTiersService.update(userId, id, dto);
    return wrapResponse(tier);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.contactTiersService.remove(userId, id);
    return wrapResponse(null, 'Contact tier deleted');
  }
}
