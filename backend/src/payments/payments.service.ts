import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPurchaseDetails(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
      include: {
        user: true,
        organizer: true,
        event: true,
        items: {
          include: {
            zone: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const tickets = payment.items.map(item => ({
      id: item.id,
      zone: item.zone?.name ?? 'General',
      quantity: item.quantity,
      price: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    }));

    const totalTickets = payment.items.reduce(
      (acc, it) => acc + it.quantity,
      0,
    );

    return {
      orderId: payment.orderId,
      eventName: payment.event.name,
      tickets,
      totalPrice: Number(payment.amount),
      totalTickets,
      purchaseDate: payment.createdAt,
      buyerEmail: payment.user.email,
      eventDate: payment.event.eventStartTime,
      eventLocation: payment.event.location,
      organizerName: payment.organizer.username ?? payment.organizer.email,
    };
  }

  async getPaymentStatus(orderId: string) {
  const payment = await this.prisma.payment.findUnique({
    where: { orderId },
    select: {
      orderId: true,
      status: true,
      paymentMethod: true,
      currency: true,
      amount: true,
      updatedAt: true,
    },
  });

  if (!payment) {
    throw new NotFoundException('Payment not found');
  }

  return {
    orderId: payment.orderId,
    status: payment.status,
    paymentMethod: payment.paymentMethod,
    currency: payment.currency,
    amount: Number(payment.amount),
    lastUpdate: payment.updatedAt,
  };
}
}
