import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface RateLimitConfig {
  ttl: number; // Time window in seconds
  limit: number; // Max requests per window
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection.remoteAddress;
    const key = `${ip}:${request.url}`;

    const now = Date.now();
    const config = this.reflector.get<RateLimitConfig>('rateLimit', context.getHandler()) || {
      ttl: 60, // 1 minute
      limit: 100, // 100 requests per minute
    };

    const record = this.requestCounts.get(key);

    // Limpiar registros expirados
    if (record && now > record.resetTime) {
      this.requestCounts.delete(key);
    }

    const current = this.requestCounts.get(key);

    if (!current) {
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + config.ttl * 1000,
      });
      return true;
    }

    if (current.count >= config.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count++;
    return true;
  }
}

