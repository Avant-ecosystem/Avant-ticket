import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from 'src/events/events.service';

@Injectable()
export class AmplifyService {
  private readonly baseUrl = process.env.AMPLIFY_BASE_URL; // ajustar si usan otro host

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  // ======================================================
  // CREATE CHECKOUT
  // ======================================================
  async createCheckout(dto: {
    buyerId: string;
    eventId: string;
    items: {
      title: string;
      quantity: number;
      unitPrice: number;
      zoneId?: string;
    }[];
  }) {
    const [buyer, event] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.buyerId } }),
      this.prisma.event.findUnique({
        where: { id: dto.eventId },
        include: { zones: true },
      }),
    ]);

    if (!buyer || !event) {
      throw new BadRequestException('Datos inválidos');
    }

    const totalAmount = dto.items.reduce(
      (acc, i) => acc + i.unitPrice * i.quantity,
      0,
    );

    const platformFee =
      (totalAmount * event.platformPercentage) / 10000;

    const externalReference = `event-${event.id}-${Date.now()}`;

    // 1️⃣ Crear pago en Amplify
    const { data: amplifyPayment } = await axios.post(
      `${this.baseUrl}/payment_intent`,
      {
        amount: totalAmount,
        currency: 'ARS',
        external_reference: externalReference,
        description: `Tickets ${event.name}`,
        success_url: `${process.env.FRONTEND_URL}/payment/success`,
        failure_url: `${process.env.FRONTEND_URL}/payment/failure`,
        metadata: {
          eventId: event.id,
          buyerId: buyer.id,
        },
      },
      {
        headers: {
          'apiKey': ` ${process.env.AMPLIFY_API_KEY}`,
          'clientiD': `${process.env.AMPLIFY_CLIENT_ID}`,
          'Content-Type': 'application/json',
        },
      },
    );


     const platformFeeRounded = Math.round(platformFee);
const organizerAmount = totalAmount - platformFeeRounded;   
    // 2️⃣ Guardar payment local
    await this.prisma.payment.create({
      data: {
        externalReference,
        mpPreferenceId:'',
        amplifyPaymentId: amplifyPayment.id!,
        orderId: crypto.randomUUID(),
        organizerId: event.organizerId,
        userId: buyer.id,
        eventId: event.id,

        amount: BigInt(totalAmount),
        currency: 'ARS',
        status: 'PENDING',

    platformFee: BigInt(platformFeeRounded),
    organizerAmount: BigInt(organizerAmount),
        idempotencyKey: crypto.randomUUID(),

        items: {
          create: dto.items.map(i => ({
            zoneId: i.zoneId,
            quantity: i.quantity,
            unitPrice: BigInt(i.unitPrice),
            subtotal: BigInt(i.unitPrice * i.quantity),
          })),
        },
      },
    });

    return {
      checkoutUrl: amplifyPayment.checkout_url,
    };
  }

  // ======================================================
  // WEBHOOK (MINT DIRECTO)
  // ======================================================
  async handleWebhook(body: any) {
    /**
     * Amplify envía:
     * {
     *   type: "payment.updated",
     *   data: { id: "pay_xxx" }
     * }
     */
    if (!body?.data?.id) {
      return { received: true };
    }

    const amplifyPaymentId = body.data.id;

    // 1️⃣ Consultar pago real (source of truth)
    const { data: amplifyPayment } = await axios.get(
      `${this.baseUrl}/payments/${amplifyPaymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AMPLIFY_API_KEY}`,
        },
      },
    );

    if (!amplifyPayment.external_reference) {
      return { ok: true };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { externalReference: amplifyPayment.external_reference },
      include: {
        items: true,
        event: { include: { zones: true } },
      },
    });

    if (!payment) {
      return { ok: true };
    }

    // ⛔ Idempotencia dura
    if (payment.status === 'COMPLETED') {
      return { ok: true };
    }

    // ============================
    // PAYMENT APPROVED
    // ============================
    if (amplifyPayment.status === 'approved') {
      // 2️⃣ Marcar APPROVED
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'APPROVED',
          rawWebhook: body,
        },
      });

      // 3️⃣ Preparar datos de minteo
      const totalTickets = payment.items.reduce(
        (acc, it) => acc + Number(it.quantity),
        0,
      );

      let zonesNames: string[] | undefined = undefined;
      const eventZones = payment.event?.zones ?? [];

      if (eventZones.length > 0) {
        const zoneIdToName = new Map(
          eventZones.map(z => [z.id, z.name] as const),
        );

        zonesNames = [];
        for (const it of payment.items) {
          if (!it.zoneId) continue;
          const name = zoneIdToName.get(it.zoneId);
          if (name) {
            for (let i = 0; i < Number(it.quantity); i++) {
              zonesNames.push(name);
            }
          }
        }
      }

      const buyerUser = await this.prisma.user.findUnique({
        where: { id: payment.userId },
      });

      if (!buyerUser?.walletAddress) {
        throw new Error('User wallet address not found');
      }

      // 4️⃣ Mint DIRECTO (igual que MP)
      await this.eventsService.mintTickets(
        payment.eventId,
        payment.userId,
        totalTickets,
        buyerUser.walletAddress,
        zonesNames,
      );

      // 5️⃣ COMPLETED
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });
    }

    return { ok: true };
  }
}
