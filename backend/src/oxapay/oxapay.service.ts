import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsService } from 'src/events/events.service';
import * as crypto from 'crypto';

@Injectable()
export class OxaPayService {
  private readonly baseUrl = process.env.OXAPAY_BASE_URL!;
  private readonly apiKey = process.env.OXAPAY_API_KEY!;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  private async getCryptoUsdRate(): Promise<number> {
  const { data } = await axios.get('https://dolarapi.com/v1/dolares');

  const cryptoUsd = data.find(
    (d: any) => d.casa === 'cripto'
  );

  if (!cryptoUsd?.venta) {
    throw new Error('No se pudo obtener dólar cripto');
  }

  return cryptoUsd.venta;
}

  // ======================================
  // CREATE PAYMENT (INVOICE)
  // ======================================
  async createPayment(dto: {
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
    const { buyerId, organizerId, eventId, items } = dto;

    const [buyer, organizer, event] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: buyerId } }),
      this.prisma.user.findUnique({ where: { id: organizerId } }),
      this.prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    if (!buyer || !organizer || !event) {
      throw new BadRequestException('Datos inválidos');
    }

    const totalAmount = items.reduce(
      (acc, i) => acc + i.unitPrice * i.quantity,
      0,
    );

    const platformFee =
      (totalAmount * event.platformPercentage) / 10000;

    const platformFeeRounded = Math.round(platformFee);
    const organizerAmount = totalAmount - platformFeeRounded;

    const externalReference = `event-${event.id}-${Date.now()}`;
    const orderId = crypto.randomUUID();
const usdRate = await this.getCryptoUsdRate();

// ARS → USD
const MARGIN = 1.01; // 1%
const amountUsd = Number(
  ((totalAmount / usdRate) * MARGIN).toFixed(2)
);
    // ============================
    // CREATE INVOICE OXAPAY
    // ============================
    const { data } = await axios.post(
       `${this.baseUrl}/v1/payment/invoice`,
{
  amount: amountUsd,
  currency: 'USD',
  to_currency: 'USDT',
  order_id: orderId,
  description: `sandbox-NFT Ticket - ${event.name}`,
  callback_url: `${process.env.APP_URL}/api/oxapay/webhook`,
  return_url: `${process.env.FRONTEND_URL}/payment/processing?orderId=${orderId}`,
  thanks_message: "Thanks for your purchase!",
  sandbox: true,
},
      { headers: { 'Content-Type': 'application/json', 'merchant_api_key': this.apiKey } },
    );

    
const oxaData = data?.data;

if (!oxaData?.track_id || !oxaData?.payment_url) {
  console.error('OXAPAY RESPONSE:', data);
  throw new BadRequestException('Error creando pago en OxaPay');
}


    // ============================
    // SAVE PAYMENT
    // ============================
    await this.prisma.payment.create({
      data: {
        oxapayPaymentId: oxaData.track_id,
        externalReference,
        orderId,

        userId: buyer.id,
        organizerId: organizer.id,
        eventId: event.id,

        amount: BigInt(totalAmount),
        platformFee: BigInt(platformFeeRounded),
        organizerAmount: BigInt(organizerAmount),

        currency: 'USDT',
        status: 'PENDING',
        paymentMethod: 'CRYPTO',
        idempotencyKey: crypto.randomUUID(),

        items: {
          create: items.map(i => ({
            zoneId: i.zoneId,
            quantity: i.quantity,
            unitPrice: BigInt(i.unitPrice),
            subtotal: BigInt(i.unitPrice * i.quantity),
          })),
        },
      },
    });

    return {
      payLink: oxaData.payment_url,
      trackId: oxaData.track_id,
    };
  }

  // ======================================
  // WEBHOOK
  // ======================================
  async handleWebhook(body: any) {
  const trackId = body.track_id;
  const status = body.status?.toLowerCase();

  if (!trackId) return;

  const payment = await this.prisma.payment.findUnique({
    where: { oxapayPaymentId: trackId },
    include: {
      items: true,
      event: { include: { zones: true } },
    },
  });

  if (!payment) return;

  // =============================
  // IDEMPOTENCIA DURA
  // =============================
  if (
    payment.status === 'APPROVED' ||
    payment.status === 'COMPLETED'
  ) {
    return;
  }

  // =============================
  // PAYMENT CONFIRMED
  // =============================
  if (status === 'paid' || status === 'confirmed') {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        rawWebhook: body,
      },
    });

    // =============================
    // PREPARAR MINT
    // =============================
    const totalTickets = payment.items.reduce(
      (acc, it) => acc + it.quantity,
      0,
    );

    let zonesNames: string[] | undefined = undefined;

    if (payment.event.zones.length > 0) {
      const zoneMap = new Map(
        payment.event.zones.map(z => [z.id, z.name]),
      );

      zonesNames = [];
      for (const it of payment.items) {
        if (!it.zoneId) continue;
        const name = zoneMap.get(it.zoneId);
        if (!name) continue;
        for (let i = 0; i < it.quantity; i++) {
          zonesNames.push(name);
        }
      }
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: payment.userId },
    });

    if (!buyer?.walletAddress) {
      throw new Error('User wallet address not found');
    }

    // =============================
    // MINT
    // =============================
    await this.eventsService.mintTickets(
      payment.eventId,
      payment.userId,
      totalTickets,
      buyer.walletAddress,
      zonesNames,
    );

    // =============================
    // FINAL STATE
    // =============================
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });
  }

  // =============================
  // FAILED / EXPIRED
  // =============================
  if (status === 'expired' || status === 'failed') {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        rawWebhook: body,
      },
    });
  }
}
}
