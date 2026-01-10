import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @HttpCode(HttpStatus.OK)
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
