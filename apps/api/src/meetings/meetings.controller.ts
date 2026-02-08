import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { Public } from '../auth/public.decorator';
import { RequestMeetingDto } from './dto/request-meeting.dto';
import { QualifyMeetingDto } from './dto/qualify-meeting.dto';
import { SubmitAgendaDto } from './dto/submit-agenda.dto';
import { DistributePreReadDto } from './dto/distribute-pre-read.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { RateMeetingDto } from './dto/rate-meeting.dto';
import { MeetingQueryDto } from './dto/meeting-query.dto';
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

  @Get(':id')
  async findOne(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.findOne(userId, id);
    return wrapResponse(meeting);
  }

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
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.schedule(userId, id);
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
  ) {
    const userId = await this.resolveUserId(currentUser);
    const meeting = await this.meetingsService.completeMeeting(userId, id);
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
