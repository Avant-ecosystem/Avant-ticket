import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse();
    const statusCode = exception.getStatus();

    let message = exception.message;
    let errors = [];

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      
      if (Array.isArray(responseObj.message)) {
        errors = responseObj.message;
        message = 'Validation failed';
      } else if (responseObj.message) {
        message = responseObj.message;
      }
    }

    const errorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors.length > 0 && { errors }),
    };

    this.logger.warn(`Validation failed: ${request.method} ${request.url} - ${JSON.stringify(errorResponse)}`);

    response.status(statusCode).json(errorResponse);
  }
}

