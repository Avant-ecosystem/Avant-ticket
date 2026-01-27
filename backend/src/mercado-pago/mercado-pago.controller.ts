import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import { MercadoPagoService } from './mercado-pago.service';

@Controller('mercado-pago')
export class MercadoPagoController {
  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  /* =========================
        OAUTH
  ========================== */

  /**
   * Genera la URL de autorización de Mercado Pago
   * El organizerId viaja en `state`
   *
   * GET /mercado-pago/authorize?organizerId=UUID
   */
  @Get('authorize')
  authorize(
    @Query('organizerId') organizerId: string,
  ) {
    return {
      url: this.mercadoPagoService.getAuthorizationUrl(
        organizerId,
      ),
    };
  }

  /**
   * Callback OAuth de Mercado Pago
   * MP devuelve: ?code=XXX&state=organizerId
   *
   * GET /mercado-pago/connect?code=XXX&state=UUID
   */
  @Get('connect')
  async connect(
    @Query('code') code: string,
    @Query('state') organizerId: string,
  ) {
    return this.mercadoPagoService.connectMarketplace(
      code,
      organizerId,
    );
  }

  /* =========================
        PAYMENTS
  ========================== */

  /**
   * Crea una preference con split de pagos
   *
   * POST /mercado-pago/checkout
   */
  @Post('checkout')
  async checkout(
    @Body()
    body: {
      buyerId: string;
      organizerId: string;
      eventId: string;
      items: {
        title: string;
        quantity: number;
        unitPrice: number;
        zoneId?: string;
      }[];
    },
  ) {
    const preference =
      await this.mercadoPagoService.createMessagePreference(
        body,
      );

    return {
      preferenceId: preference.id,
      init_point: preference.init_point,
      sandbox_init_point:
        preference.sandbox_init_point,
    };
  }
}
