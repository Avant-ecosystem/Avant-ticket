import { Controller, Post, Body, Req } from '@nestjs/common';
import { AmplifyService } from './amplify.service';

@Controller('amplify')
export class AmplifyController {
  constructor(private readonly amplifyService: AmplifyService) {}

  // ============================
  // CREATE CHECKOUT
  // ============================
  @Post('checkout')
  createCheckout(@Body() body: any) {
    return this.amplifyService.createCheckout(body);
  }

  // ============================
  // WEBHOOK
  // ============================
  @Post('webhook')
  handleWebhook(@Body() body: any, @Req() req: any) {
    return this.amplifyService.handleWebhook(body);
  }
}
