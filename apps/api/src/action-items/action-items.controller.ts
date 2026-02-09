import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ActionItemsService } from './action-items.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { DelegateActionItemDto } from './dto/delegate-action-item.dto';
import { ActionItemQueryDto } from './dto/action-item-query.dto';
import { wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('action-items')
export class ActionItemsController {
  constructor(
    private readonly actionItemsService: ActionItemsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Post()
  async create(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateActionItemDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const item = await this.actionItemsService.create(userId, dto);
    return wrapResponse(item);
  }

  @Get()
  async findAll(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: ActionItemQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.actionItemsService.findAll(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const item = await this.actionItemsService.findOne(userId, id);
    return wrapResponse(item);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateActionItemDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const item = await this.actionItemsService.update(userId, id, dto);
    return wrapResponse(item);
  }

  @Post(':id/complete')
  async complete(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const item = await this.actionItemsService.complete(userId, id);
    return wrapResponse(item);
  }

  @Post(':id/reschedule')
  async reschedule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body('dueDate') dueDate: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const item = await this.actionItemsService.reschedule(userId, id, dueDate);
    return wrapResponse(item);
  }

  @Post(':id/delegate')
  async delegate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: DelegateActionItemDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const item = await this.actionItemsService.delegate(userId, id, dto);
    return wrapResponse(item);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.actionItemsService.remove(userId, id);
    return wrapResponse(null, 'Action item deleted');
  }
}
