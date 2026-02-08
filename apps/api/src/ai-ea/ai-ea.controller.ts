import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AiEaService } from './ai-ea.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { Public } from '../auth/public.decorator';
import { QualifyMeetingEaDto } from './dto/qualify-meeting-ea.dto';
import { BulkCreateItemsDto } from './dto/bulk-create-items.dto';
import { wrapResponse } from '../common';

@Public()
@UseGuards(ApiKeyGuard)
@Controller('ai-ea')
export class AiEaController {
  constructor(private readonly aiEaService: AiEaService) {}

  @Get('pending-meetings')
  async getPendingMeetings(@Query('userId') userId: string) {
    const meetings = await this.aiEaService.getPendingMeetings(userId);
    return wrapResponse(meetings);
  }

  @Post('qualify')
  async qualifyMeeting(@Body() dto: QualifyMeetingEaDto) {
    const meeting = await this.aiEaService.qualifyMeeting(dto);
    return wrapResponse(meeting);
  }

  @Get('scheduling-params')
  async getSchedulingParams(@Query('userId') userId: string) {
    const params = await this.aiEaService.getSchedulingParams(userId);
    return wrapResponse(params);
  }

  @Get('available-slots')
  async getAvailableSlots(
    @Query('userId') userId: string,
    @Query('date') date: string,
    @Query('durationMinutes') durationMinutes: string,
  ) {
    const slots = await this.aiEaService.getAvailableSlots(
      userId,
      date,
      parseInt(durationMinutes, 10) || 30,
    );
    return wrapResponse(slots);
  }

  @Post('bulk-create')
  async bulkCreate(@Body() dto: BulkCreateItemsDto) {
    const results = await this.aiEaService.bulkCreateItems(dto);
    return wrapResponse(results);
  }

  @Get('context')
  async getContext(@Query('userId') userId: string) {
    const context = await this.aiEaService.getContext(userId);
    return wrapResponse(context);
  }

  @Get('dashboard')
  async getDashboard(@Query('userId') userId: string) {
    const dashboard = await this.aiEaService.getDashboard(userId);
    return wrapResponse(dashboard);
  }
}
