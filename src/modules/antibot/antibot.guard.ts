/**
 * AntiBotGuard — NestJS Guard that applies rate limiting and bot detection.
 *
 * Apply with: @UseGuards(AntiBotGuard)
 * Or configure the action per-route with @SetMetadata('antiBotAction', 'ads_reward')
 */
import {
  Injectable, CanActivate, ExecutionContext,
  HttpException, HttpStatus, SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AntiBotService } from './antibot.service';

export const AntiBotAction = (action: string) => SetMetadata('antiBotAction', action);

@Injectable()
export class AntiBotGuard implements CanActivate {
  constructor(
    private antiBotService: AntiBotService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.userId;

    // Only check authenticated requests
    if (!userId) return true;

    const action = this.reflector.get<string>('antiBotAction', context.getHandler())
      ?? this.reflector.get<string>('antiBotAction', context.getClass())
      ?? 'default';

    const ip = req.ip || req.connection?.remoteAddress || '';
    const result = this.antiBotService.check(userId, action, ip);

    if (!result.allowed) {
      const headers: Record<string, string> = {};
      if (result.retryAfter) headers['Retry-After'] = String(result.retryAfter);

      throw new HttpException(
        {
          statusCode: result.reason === 'BANNED' ? 403 : 429,
          message: result.reason === 'BANNED'
            ? 'נחסמת עקב פעילות חשודה. פנה לתמיכה אם זו טעות.'
            : 'יותר מדי בקשות. אנא המתן.',
          reason: result.reason,
          retryAfter: result.retryAfter,
        },
        result.reason === 'BANNED' ? HttpStatus.FORBIDDEN : HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
