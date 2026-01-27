import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class MercadoPagoService {
  constructor(private readonly prisma: PrismaService) {}

  // ======================================================
  // ALIASES PARA TU CONTROLLER
  // ======================================================

  getAuthorizationUrl(organizerId: string) {
    return this.getOAuthRedirectUrl(organizerId);
  }

  async connectMarketplace(code: string, organizerId: string) {
    return this.handleOAuthCallback(code, organizerId);
  }

  async createMessagePreference(dto: {
    buyerId: string;
    organizerId: string;
    eventId: string;
    items: {
      title: string;
      quantity: number;
      unitPrice: number;
      zoneId?: string;
    }[];
  }) {
    return this.createPreference(dto);
  }

  // ======================================================
  // OAUTH
  // ======================================================

getOAuthRedirectUrl(organizerId: string) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_MP_CLIENT_ID!,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: `${process.env.APP_URL}/api/mercado-pago/connect`,
    state: organizerId, 
  });

  return `https://auth.mercadopago.com.ar/authorization?${params.toString()}`;
}
  async handleOAuthCallback(code: string, organizerId: string) {
  const { data } = await axios.post(
    'https://api.mercadopago.com/oauth/token',
    {
      grant_type: 'authorization_code',
      client_id: process.env.NEXT_PUBLIC_MP_CLIENT_ID,
      client_secret: process.env.MP_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.APP_URL}/api/mercado-pago/connect`,
    },
    { headers: { 'Content-Type': 'application/json' } },
  );

    await this.prisma.user.update({
      where: { id: organizerId },
      data: {
        mpUserId: data.user_id?.toString(),
        mpAccessToken: data.access_token,
        mpRefreshToken: data.refresh_token,
        mpTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    });

    return data;
  }

  // ======================================================
  // TOKEN REFRESH
  // ======================================================

  async getValidAccessToken(organizerId: string): Promise<string> {
    const organizer = await this.prisma.user.findUnique({
      where: { id: organizerId },
    });

    if (!organizer?.mpAccessToken) {
      throw new BadRequestException('Organizer no tiene Mercado Pago conectado');
    }

    if (
      organizer.mpTokenExpiresAt &&
      organizer.mpTokenExpiresAt > new Date()
    ) {
      return organizer.mpAccessToken;
    }

    const { data } = await axios.post(
      'https://api.mercadopago.com/oauth/token',
      {
        grant_type: 'refresh_token',
        client_id: process.env.NEXT_PUBLIC_MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        refresh_token: organizer.mpRefreshToken,
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    await this.prisma.user.update({
      where: { id: organizerId },
      data: {
        mpAccessToken: data.access_token,
        mpRefreshToken: data.refresh_token,
        mpTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
      },
    });

    return data.access_token;
  }


  // ======================================================
// STATUS
// ======================================================
async getMarketplaceStatus(organizerId: string) {
  const organizer = await this.prisma.user.findUnique({
    where: { id: organizerId },
    select: {
      mpUserId: true,
      mpAccessToken: true,
      mpTokenExpiresAt: true,
      email: true,
    },
  });

  if (!organizer || !organizer.mpAccessToken) {
    return {
      connected: false,
    };
  }

  return {
    connected: true,
    accountId: organizer.mpUserId,
    email: organizer.email,
    tokenExpiresAt: organizer.mpTokenExpiresAt,
  };
}

  // ======================================================
  // CREATE PREFERENCE (SPLIT)
  // ======================================================

  async createPreference({
    buyerId,
    organizerId,
    eventId,
    items,
  }: {
    buyerId: string;
    organizerId: string;
    eventId: string;
    items: {
      title: string;
      quantity: number;
      unitPrice: number;
      zoneId?: string;
    }[];
  }) {
    const [buyer, organizer, event] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: buyerId } }),
      this.prisma.user.findUnique({ where: { id: organizerId } }),
      this.prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    if (!buyer || !organizer || !event) {
      throw new BadRequestException('Datos inválidos');
    }

    const accessToken = await this.getValidAccessToken(organizerId);
    const mp = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(mp);

    const totalAmount = items.reduce(
      (acc, i) => acc + i.unitPrice * i.quantity,
      0,
    );

    const platformFee =
      (totalAmount * event.platformPercentage) / 10000;

    const externalReference = `event-${event.id}-${Date.now()}`;

    const pref = await preference.create({
      body: {
        items: items.map((i, index) => ({
          id: i.zoneId ?? `item-${index}`,
          title: i.title,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          currency_id: 'ARS',
        })),

        payer: { email: buyer.email },

        marketplace_fee: Math.round(platformFee),
        external_reference: externalReference,

        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
        },

        auto_return: 'approved',
      },
    });

    await this.prisma.payment.create({
      data: {
        mpPreferenceId: pref.id!,
        externalReference,
        orderId: crypto.randomUUID(),
        userId: buyer.id,
        organizerId: organizer.id,
        eventId: event.id,
        amount: BigInt(totalAmount),
        platformFee: BigInt(platformFee),
        organizerAmount: BigInt(totalAmount - platformFee),
        idempotencyKey: crypto.randomUUID(),
        status: 'PENDING',
      },
    });

    return pref;
  }
}
