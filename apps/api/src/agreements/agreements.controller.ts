import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { AgreementsService } from './agreements.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { UpdateAgreementDto } from './dto/update-agreement.dto';
import { SupersedeAgreementDto } from './dto/supersede-agreement.dto';
import { PaginationQueryDto, wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('agreements')
export class AgreementsController {
  constructor(
    private readonly agreementsService: AgreementsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Post()
  async create(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateAgreementDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const agreement = await this.agreementsService.create(userId, dto);
    return wrapResponse(agreement);
  }

  @Get()
  async findAll(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: PaginationQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.agreementsService.findAll(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const agreement = await this.agreementsService.findOne(userId, id);
    return wrapResponse(agreement);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateAgreementDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const agreement = await this.agreementsService.update(userId, id, dto);
    return wrapResponse(agreement);
  }

  @Post(':id/supersede')
  async supersede(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: SupersedeAgreementDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const agreement = await this.agreementsService.supersede(userId, id, dto);
    return wrapResponse(agreement);
  }

  @Post(':id/deactivate')
  async deactivate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const agreement = await this.agreementsService.deactivate(userId, id);
    return wrapResponse(agreement);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.agreementsService.remove(userId, id);
    return wrapResponse(null, 'Agreement deleted');
  }
}
