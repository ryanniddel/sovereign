import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SchedulerGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-scheduler-key'] || request.headers['x-api-key'];
    const expectedKey = this.configService.get<string>('SCHEDULER_API_KEY');

    // If no key is configured, block all requests (fail-closed)
    if (!expectedKey) {
      throw new UnauthorizedException('Scheduler API key not configured');
    }

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid scheduler API key');
    }

    return true;
  }
}
