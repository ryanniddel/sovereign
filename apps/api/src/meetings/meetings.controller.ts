import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { Public } from '../auth/public.decorator';
import { RequestMeetingDto } from './dto/request-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { QualifyMeetingDto } from './dto/qualify-meeting.dto';
import { ScheduleMeetingDto } from './dto/schedule-meeting.dto';
import { RescheduleMeetingDto } from './dto/reschedule-meeting.dto';
import { SubmitAgendaDto } from './dto/submit-agenda.dto';
import { DistributePreReadDto } from './dto/distribute-pre-read.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { RateMeetingDto } from './dto/rate-meeting.dto';
import { SubmitRecapDto } from './dto/submit-recap.dto';
import { CompleteMeetingDto } from './dto/complete-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
import { MeetingAnalyticsQueryDto } from './dto/meeting-analytics-query.dto';
import { wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('meetings')
export class MeetingsController {
  constructor(
    private readonly meetingsService: MeetingsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  // ════════════════════════════════════════════════════════════════
  // CRUD
  // ════════════════════════════════════════════════════════════════

  @Post()
  async requestMeeting(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: RequestMeetingDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.requestMeeting(userId, dto);
    return wrapResponse(meeting);
  }

  @Get()
  async findAll(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: MeetingQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.meetingsService.findAll(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Get('analytics')
  async getAnalytics(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: MeetingAnalyticsQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const analytics = await this.meetingsService.getAnalytics(userId, query);
    return wrapResponse(analytics);
  }

  @Get('recurring-reviews')
  async getRecurringReviews(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
  ) {
    const userId = await this.resolveUserId(currentUser);
    const reviews = await this.meetingsService.getRecurringReviews(userId);
    return wrapResponse(reviews);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.findOne(userId, id);
    return wrapResponse(meeting);
  }

  @Patch(':id')
  async updateMeeting(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.updateMeeting(userId, id, dto);
    return wrapResponse(meeting);
  }

  // ════════════════════════════════════════════════════════════════
  // LIFECYCLE TRANSITIONS
  // ════════════════════════════════════════════════════════════════

  @Post(':id/qualify')
  async qualify(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: QualifyMeetingDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.qualify(userId, id, dto);
    return wrapResponse(meeting);
  }

  @Post(':id/schedule')
  async schedule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: ScheduleMeetingDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.schedule(userId, id, dto);
    return wrapResponse(meeting);
  }

  @Post(':id/reschedule')
  async reschedule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: RescheduleMeetingDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.reschedule(userId, id, dto);
    return wrapResponse(meeting);
  }

  @Post(':id/agenda')
  async submitAgenda(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: SubmitAgendaDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.submitAgenda(userId, id, dto);
    return wrapResponse(meeting);
  }

  @Post(':id/pre-read')
  async distributePreRead(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: DistributePreReadDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.distributePreRead(userId, id, dto);
    return wrapResponse(meeting);
  }

  @Post(':id/start')
  async startMeeting(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.startMeeting(userId, id);
    return wrapResponse(meeting);
  }

  @Post(':id/complete')
  async completeMeeting(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: CompleteMeetingDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.completeMeeting(userId, id, dto);
    return wrapResponse(meeting);
  }

  @Post(':id/cancel')
  async cancelMeeting(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.cancelMeeting(userId, id);
    return wrapResponse(meeting);
  }

  // ════════════════════════════════════════════════════════════════
  // POST-MEETING
  // ════════════════════════════════════════════════════════════════

  @Post(':id/rate')
  async rateMeeting(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: RateMeetingDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.rateMeeting(userId, id, dto);
    return wrapResponse(meeting);
  }

  @Post(':id/recap')
  async submitRecap(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: SubmitRecapDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.meetingsService.submitRecap(userId, id, dto);
    return wrapResponse(result);
  }

  // ════════════════════════════════════════════════════════════════
  // PARTICIPANTS
  // ════════════════════════════════════════════════════════════════

  @Post(':id/participants')
  async addParticipant(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: AddParticipantDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const participant = await this.meetingsService.addParticipant(userId, id, dto);
    return wrapResponse(participant);
  }

  @Delete(':id/participants/:pid')
  async removeParticipant(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Param('pid') pid: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.meetingsService.removeParticipant(userId, id, pid);
    return wrapResponse(null, 'Participant removed');
  }

  @Public()
  @Post(':id/participants/:pid/acknowledge')
  async acknowledgeParticipant(
    @Param('id') id: string,
    @Param('pid') pid: string,
  ) {
    const participant = await this.meetingsService.acknowledgeParticipant(id, pid);
    return wrapResponse(participant);
  }
}
