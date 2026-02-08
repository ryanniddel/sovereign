import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CommitmentsService } from './commitments.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';
import { DelegateCommitmentDto } from './dto/delegate-commitment.dto';
import { CommitmentQueryDto } from './dto/commitment-query.dto';
import { wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('commitments')
export class CommitmentsController {
  constructor(
    private readonly commitmentsService: CommitmentsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Post()
  async create(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateCommitmentDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const commitment = await this.commitmentsService.create(userId, dto);
    return wrapResponse(commitment);
  }

  @Get()
  async findAll(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CommitmentQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.commitmentsService.findAll(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const commitment = await this.commitmentsService.findOne(userId, id);
    return wrapResponse(commitment);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateCommitmentDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const commitment = await this.commitmentsService.update(userId, id, dto);
    return wrapResponse(commitment);
  }

  @Post(':id/complete')
  async complete(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const commitment = await this.commitmentsService.complete(userId, id);
    return wrapResponse(commitment);
  }

  @Post(':id/reschedule')
  async reschedule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body('dueDate') dueDate: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const commitment = await this.commitmentsService.reschedule(userId, id, dueDate);
    return wrapResponse(commitment);
  }

  @Post(':id/delegate')
  async delegate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: DelegateCommitmentDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const commitment = await this.commitmentsService.delegate(userId, id, dto);
    return wrapResponse(commitment);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.commitmentsService.remove(userId, id);
    return wrapResponse(null, 'Commitment deleted');
  }
}
