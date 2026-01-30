import {
  Controller,
  Post,
  Req,
  Res,
  Body,
  HttpCode,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { OxaPayService } from './oxapay.service';
import { CreateOxaPayPaymentDto } from './dto/create-oxapay-payment.dto';

@Controller('oxapay')
export class OxaPayController {
  constructor(private readonly oxaPayService: OxaPayService) {}

  @Post('checkout')
  createPayment(@Body() dto: CreateOxaPayPaymentDto) {
    return this.oxaPayService.createPayment(dto);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    await this.oxaPayService.handleWebhook(body);
    return { ok: true }; // RESPUESTA SIMPLE
  }
}
