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
    const { eventId, zoneId, originalBuyerId, ...rest } = createTicketDto;

    // Verificar que el evento existe
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { zones: true }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Si el evento tiene zonas, zoneId debe ser proporcionado
    if (event.zones.length > 0 && !zoneId) {
      throw new BadRequestException('Zone ID is required for events with zones');
    }

    // Si se proporciona zoneId, verificar que existe y pertenece al evento
    let zone
    if (zoneId) {
      zone = await this.prisma.eventZone.findFirst({
        where: {
          id: zoneId,
          eventId: eventId
        }
      });

      if (!zone) {
        throw new NotFoundException(`Zone with ID ${zoneId} not found or does not belong to the specified event`);
      }

      // Verificar que hay capacidad disponible en la zona
      if (zone.sold >= zone.capacity) {
        throw new BadRequestException(`Zone "${zone.name}" is sold out`);
      }
    }

    // Verificar que el comprador original existe
    const originalBuyer = await this.prisma.user.findUnique({
      where: { id: originalBuyerId }
    });

    if (!originalBuyer) {
      throw new NotFoundException(`User with ID ${originalBuyerId} not found`);
    }

    // Usar transacción para asegurar consistencia
    return this.prisma.$transaction(async (prisma) => {
      // Crear el ticket
      const ticket = await prisma.ticket.create({
        data: {
          ...rest,
          eventId,
          zoneId: zoneId || null,
          originalBuyerId,
          ownerId: originalBuyerId,
          mintedAt: new Date(createTicketDto.mintedAt),
        },
        include: {
          zone: true,
          event: true,
          originalBuyer: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            }
          }
        }
      });

      // Si hay una zona, actualizar el contador de vendidos
      if (zone) {
        await prisma.eventZone.update({
          where: { id: zoneId },
          data: {
            sold: zone.sold + 1n // Usar BigInt
          }
        });
      }

      return ticket;
    });
  }

  private serializeTicket(ticket: any): any {
    if (!ticket) return ticket;
  
    const serialized: any = {
      id: ticket.id,
      blockchainTicketId: ticket.blockchainTicketId?.toString() || null,
      eventId: ticket.eventId,
      ownerId: ticket.ownerId,
      originalBuyerId: ticket.originalBuyerId,
      zoneId: ticket.zoneId,
      status: ticket.status,
      usedAt: ticket.usedAt,
      mintedAt: ticket.mintedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      lastSyncedAt: ticket.lastSyncedAt,
    };

    // Serializar zone si existe
    if (ticket.zone) {
      serialized.zone = {
        id: ticket.zone.id,
        name: ticket.zone.name,
        price: ticket.zone.price ? (typeof ticket.zone.price === 'object' && 'toNumber' in ticket.zone.price ? ticket.zone.price.toNumber() : ticket.zone.price) : 0,
        capacity: ticket.zone.capacity?.toString() || '0',
        sold: ticket.zone.sold?.toString() || '0',
      };
    }
  
    // Serializar owner si existe
    if (ticket.owner) {
      serialized.owner = {
        id: ticket.owner.id,
        email: ticket.owner.email,
        username: ticket.owner.username,
        walletAddress: ticket.owner.walletAddress,
        dni: ticket.owner.dni,
        role: ticket.owner.role,
        // No incluir password por seguridad
      };
    }
  
    // Serializar originalBuyer si existe
    if (ticket.originalBuyer) {
      serialized.originalBuyer = {
        id: ticket.originalBuyer.id,
        username: ticket.originalBuyer.username,
        walletAddress: ticket.originalBuyer.walletAddress,
      };
    }
  
    // Serializar event si existe
    if (ticket.event) {
      serialized.event = {
        id: ticket.event.id,
        blockchainEventId: ticket.event.blockchainEventId?.toString() || null,
        name: ticket.event.name,
        description: ticket.event.description,
        eventStartTime: ticket.event.eventStartTime,
        ticketsMinted: ticket.event.ticketsMinted?.toString() || '0',
        ticketsTotal: ticket.event.ticketsTotal?.toString() || '0',
        active: ticket.event.active,
        resaleEnabled: ticket.event.resaleEnabled,
        maxResalePrice: ticket.event.maxResalePrice?.toString() || null,
        resaleStartTime: ticket.event.resaleStartTime,
        resaleEndTime: ticket.event.resaleEndTime,
        sellerPercentage: ticket.event.sellerPercentage,
        organizerPercentage: ticket.event.organizerPercentage,
        platformPercentage: ticket.event.platformPercentage,
        // Serializar organizer si está incluido
        ...(ticket.event.organizer && {
          organizer: {
            id: ticket.event.organizer.id,
            username: ticket.event.organizer.username,
            walletAddress: ticket.event.organizer.walletAddress,
          },
        }),
      };
    }
  
    // Serializar listings si existen
    if (ticket.listings && Array.isArray(ticket.listings)) {
      serialized.listings = ticket.listings.map((listing: any) => ({
        id: listing.id,
        price: listing.price?.toString() || '0',
        status: listing.status,
        listedAt: listing.listedAt,
        soldAt: listing.soldAt,
        blockchainTxHash: listing.blockchainTxHash,
        ...(listing.seller && {
          seller: {
            id: listing.seller.id,
            username: listing.seller.username,
            walletAddress: listing.seller.walletAddress,
          },
        }),
        ...(listing.buyer && {
          buyer: {
            id: listing.buyer.id,
            username: listing.buyer.username,
            walletAddress: listing.buyer.walletAddress,
          },
        }),
      }));
    }
  
    return serialized;
  }
  
  private serializeTickets(tickets: any[]): any[] {
    return tickets.map(ticket => this.serializeTicket(ticket));
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
          zone: true,
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
      data: this.serializeTickets(tickets),
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
        zone: true,
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
    return this.serializeTicket(ticket);
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
          zone: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.ticket.count({ where: { ownerId } }),
    ]);

    return {
      data: this.serializeTickets(tickets),
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
          zone: true,
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
      data: this.serializeTickets(tickets),
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

  async createBatch(ticketsData: CreateTicketDto[]) {
    // Agrupar por eventId para validaciones eficientes
    const eventIds = [...new Set(ticketsData.map(t => t.eventId))];
    
    // Obtener todos los eventos y sus zonas
    const events = await this.prisma.event.findMany({
      where: { id: { in: eventIds } },
      include: { zones: true }
    });
  
    const eventMap = new Map(events.map(e => [e.id, e]));
  
    // Validar que todos los eventos existen
    for (const ticketData of ticketsData) {
      const event = eventMap.get(ticketData.eventId);
      if (!event) {
        throw new NotFoundException(`Event with ID ${ticketData.eventId} not found`);
      }
  
      // Si el evento tiene zonas, zoneId debe ser proporcionado
      if (event.zones.length > 0 && !ticketData.zoneId) {
        throw new BadRequestException(`Zone ID is required for event ${event.id} which has zones`);
      }
  
      // Si se proporciona zoneId, verificar que existe
      if (ticketData.zoneId) {
        const zoneExists = event.zones.some(z => z.id === ticketData.zoneId);
        if (!zoneExists) {
          throw new NotFoundException(`Zone with ID ${ticketData.zoneId} not found in event ${event.id}`);
        }
      }
    }
  
    // Usar transacción para consistencia
    return this.prisma.$transaction(async (prisma) => {
      const createdTickets: any[] = []; // Especificar el tipo explícitamente
      
      for (const ticketData of ticketsData) {
        const { eventId, zoneId, originalBuyerId, ...rest } = ticketData;
        const event = eventMap.get(eventId);
  
        // Verificar que el usuario existe
        const originalBuyer = await prisma.user.findUnique({
          where: { id: originalBuyerId }
        });
  
        if (!originalBuyer) {
          throw new NotFoundException(`User with ID ${originalBuyerId} not found`);
        }
  
        // Crear ticket
        const ticket = await prisma.ticket.create({
          data: {
            ...rest,
            eventId,
            zoneId: zoneId || null,
            originalBuyerId,
            ownerId: originalBuyerId,
            mintedAt: new Date(ticketData.mintedAt),
          },
          include: {
            zone: true
          }
        });
  
        createdTickets.push(ticket);
  
        // Si hay zona, actualizar contador
        if (zoneId && event) {
          const zone = event.zones.find(z => z.id === zoneId);
          if (zone) {
            await prisma.eventZone.update({
              where: { id: zoneId },
              data: {
                sold: zone.sold + 1n
              }
            });
          }
        }
      }
  
      return createdTickets;
    });
  }
 async mintTickets(
    eventId: string,
    buyerWalletAddress: string,
    amount: number,
    zones?: Array<string | null>,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { zones: true }
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Si el evento tiene zonas, validar las zonas proporcionadas
    if (event.zones.length > 0) {
      if (!zones || zones.length !== amount) {
        throw new BadRequestException(`Must specify exactly ${amount} zones for this event`);
      }

      // Verificar que todas las zonas existen
      for (const zoneId of zones) {
        if (zoneId) {
          const zoneExists = event.zones.some(z => z.id === zoneId);
          if (!zoneExists) {
            throw new NotFoundException(`Zone with ID ${zoneId} not found in event ${event.id}`);
          }
        }
      }
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

