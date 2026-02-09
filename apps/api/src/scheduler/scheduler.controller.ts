import { Controller, Get, Post, Param, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerHistoryQueryDto } from './dto/scheduler-query.dto';
import { SchedulerGuard } from './guards/scheduler.guard';
import { wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('scheduler')
@UseGuards(SchedulerGuard)
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('health')
  async getHealth() {
    const health = await this.schedulerService.getHealth();
    return wrapResponse(health);
  }

  @Get('history')
  async getJobHistory(@Query() query: SchedulerHistoryQueryDto) {
    const result = await this.schedulerService.getJobHistory({
      jobName: query.jobName,
      status: query.status,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });

    return {
      ...wrapPaginatedResponse(result.runs, result.total, query.page, query.pageSize),
      stats: result.stats,
    };
  }

  @Post('trigger/:jobName')
  async triggerJob(@Param('jobName') jobName: string) {
    try {
      const result = await this.schedulerService.triggerJob(jobName);
      return wrapResponse(result, `Job ${jobName} triggered`);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to trigger job',
      );
    }
  }
}
