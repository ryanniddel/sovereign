import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { EscalationService } from './escalation.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateEscalationRuleDto } from './dto/create-escalation-rule.dto';
import { UpdateEscalationRuleDto } from './dto/update-escalation-rule.dto';
import { TriggerEscalationDto } from './dto/trigger-escalation.dto';
import { EscalationQueryDto } from './dto/escalation-query.dto';
import { EscalationLogQueryDto } from './dto/escalation-log-query.dto';
import { RecordResponseDto } from './dto/record-response.dto';
import { wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('escalation')
export class EscalationController {
  constructor(
    private readonly escalationService: EscalationService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  // ── Rule CRUD ──

  @Post('rules')
  async createRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateEscalationRuleDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const rule = await this.escalationService.createRule(userId, dto);
    return wrapResponse(rule);
  }

  @Get('rules')
  async findAllRules(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: EscalationQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.escalationService.findAllRules(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Get('analytics')
  async getAnalytics(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('days') days?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const analytics = await this.escalationService.getAnalytics(userId, days ? parseInt(days, 10) : 30);
    return wrapResponse(analytics);
  }

  @Get('active-chains')
  async getActiveChains(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const chains = await this.escalationService.getActiveChains(userId);
    return wrapResponse(chains);
  }

  @Get('rules/:id')
  async findOneRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const rule = await this.escalationService.findOneRule(userId, id);
    return wrapResponse(rule);
  }

  @Patch('rules/:id')
  async updateRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateEscalationRuleDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const rule = await this.escalationService.updateRule(userId, id, dto);
    return wrapResponse(rule);
  }

  @Delete('rules/:id')
  async deleteRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.escalationService.deleteRule(userId, id);
    return wrapResponse(null, 'Escalation rule deleted');
  }

  @Post('rules/:id/clone')
  async cloneRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const rule = await this.escalationService.cloneRule(userId, id);
    return wrapResponse(rule);
  }

  // ── Logs ──

  @Get('logs')
  async getLogs(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: EscalationLogQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.escalationService.getLogs(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  // ── Actions ──

  @Post('trigger')
  async trigger(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: TriggerEscalationDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.escalationService.triggerEscalation(
      userId,
      dto.targetId,
      dto.targetType,
      dto.escalationRuleId,
    );
    return wrapResponse(null, 'Escalation triggered');
  }

  @Post('pause')
  async pause(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body('targetId') targetId: string,
    @Body('targetType') targetType: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.escalationService.pauseEscalation(userId, targetId, targetType);
    return wrapResponse(null, 'Escalation paused');
  }

  @Post('resume')
  async resume(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body('targetId') targetId: string,
    @Body('targetType') targetType: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.escalationService.resumeEscalation(userId, targetId, targetType);
    return wrapResponse(null, 'Escalation resumed');
  }

  @Post('cancel')
  async cancel(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body('targetId') targetId: string,
    @Body('targetType') targetType: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.escalationService.cancelEscalation(userId, targetId, targetType);
    return wrapResponse(null, 'Escalation cancelled');
  }

  @Post('record-response')
  async recordResponse(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: RecordResponseDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const log = await this.escalationService.recordResponse(userId, dto.logId, dto.responseContent);
    return wrapResponse(log);
  }
}
