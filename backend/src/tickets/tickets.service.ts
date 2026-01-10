import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketStatus } from '@prisma/client';
import { BlockchainActionsService } from '../blockchain/blockchain-actions.service';
import { decodeAddress } from '@polkadot/util-crypto';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainActions: BlockchainActionsService,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        ownerId: createTicketDto.originalBuyerId,
        mintedAt: new Date(createTicketDto.mintedAt),
      },
    });
  }

  async findAll(pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        include: {
          event: true,
          owner: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.ticket.count(),
    ]);

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                walletAddress: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
          },
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return ticket;
  }

  async findByBlockchainId(blockchainTicketId: string) {
    return this.prisma.ticket.findUnique({
      where: { blockchainTicketId },
      include: {
        event: true,
        owner: true,
      },
    });
  }

  async findByOwner(ownerId: string, pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        where: { ownerId },
        include: {
          event: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.ticket.count({ where: { ownerId } }),
    ]);

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByEvent(eventId: string, pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        where: { eventId },
        include: {
          owner: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.ticket.count({ where: { eventId } }),
    ]);

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOwner(ticketId: string, newOwnerId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { ownerId: newOwnerId },
    });
  }

  async markAsUsed(ticketId: string) {
    const ticket = await this.findOne(ticketId);
    
    if (ticket.status === TicketStatus.USED) {
      throw new BadRequestException('Ticket is already used');
    }

    try {
      // Marcar como usado en blockchain
      this.logger.log(`Marking ticket ${ticket.blockchainTicketId} as used on blockchain`);
      await this.blockchainActions.markTicketUsed(BigInt(ticket.blockchainTicketId));
      
      // Actualizar en DB (se sincronizará completamente cuando llegue el evento)
      return this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.USED,
          usedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Error marking ticket as used:`, error);
      throw new BadRequestException(`Failed to mark ticket as used on blockchain: ${error.message}`);
    }
  }

  async mintTickets(
    eventId: string,
    buyerWalletAddress: string,
    amount: number,
    zones?: Array<string | null>,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    try {
      // Mintear tickets en blockchain
      this.logger.log(`Minting ${amount} tickets for event ${event.blockchainEventId}`);
      const blockchainResult = await this.blockchainActions.mintTickets(
        BigInt(event.blockchainEventId),
        buyerWalletAddress,
        BigInt(amount),
        zones || [],
      );

      this.logger.log(`Tickets minted on blockchain: ${blockchainResult.hash}`);
      
      // Los tickets se crearán en DB cuando llegue el evento TicketsMinted
      // Por ahora retornamos el resultado de blockchain
      return {
        blockchainTxHash: blockchainResult.hash,
        message: 'Tickets are being minted. They will appear in your account once the transaction is confirmed.',
      };
    } catch (error) {
      this.logger.error(`Error minting tickets:`, error);
      throw new BadRequestException(`Failed to mint tickets on blockchain: ${error.message}`);
    }
  }

  async getStats(userId?: string) {
    // Si es admin, obtener estadísticas completas
    let isAdmin = false;
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      isAdmin = user?.role === 'ADMIN';
    }

    const [
      totalTickets,
      activeTickets,
      usedTickets,
      cancelledTickets,
      ticketsByEvent,
      totalListings,
      activeListings,
      soldListings,
    ] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: 'ACTIVE' } }),
      this.prisma.ticket.count({ where: { status: 'USED' } }),
      this.prisma.ticket.count({ where: { status: 'CANCELLED' } }),
      this.prisma.ticket.groupBy({
        by: ['eventId'],
        _count: { id: true },
      }),
      this.prisma.marketplaceListing.count(),
      this.prisma.marketplaceListing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.marketplaceListing.count({ where: { status: 'SOLD' } }),
    ]);

    // Si es admin, incluir estadísticas de usuarios
    let uniqueOwners = 0;
    let userTickets = 0;
    if (isAdmin) {
      uniqueOwners = await this.prisma.ticket.groupBy({
        by: ['ownerId'],
        _count: { id: true },
      }).then(result => result.length);

      if (userId) {
        userTickets = await this.prisma.ticket.count({ where: { ownerId: userId } });
      }
    }

    const usedPercentage = totalTickets > 0
      ? ((usedTickets / totalTickets) * 100).toFixed(2)
      : '0';

    const activePercentage = totalTickets > 0
      ? ((activeTickets / totalTickets) * 100).toFixed(2)
      : '0';

    return {
      totalTickets,
      activeTickets,
      usedTickets,
      cancelledTickets,
      usedPercentage,
      activePercentage,
      totalListings,
      activeListings,
      soldListings,
      eventsWithTickets: ticketsByEvent.length,
      ...(isAdmin && {
        uniqueOwners,
        userTickets: userId ? userTickets : undefined,
      }),
    };
  }
}

