import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class DelegationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const user = request.user;

    if (body?.delegateToId && user?.auth0Id) {
      if (body.delegateToId === user.auth0Id) {
        throw new BadRequestException('Cannot delegate to yourself');
      }
    }

    return true;
  }
}
