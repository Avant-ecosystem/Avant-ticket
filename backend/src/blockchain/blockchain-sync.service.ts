import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncEventDto } from './dto/sync-event.dto';
import { SyncTicketDto } from './dto/sync-ticket.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class BlockchainSyncService {
  private readonly logger = new Logger(BlockchainSyncService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  async syncEvent(eventData: SyncEventDto) {
    try {
      /**
       * 1. Si ya existe un evento con el blockchainEventId real
       *    → solo actualizamos campos que vienen del blockchain
       */
      const existingEvent = await this.prisma.event.findUnique({
        where: { blockchainEventId: eventData.eventId },
      });
  
      if (existingEvent) {
        this.logger.log(
          `Event with blockchainEventId ${eventData.eventId} already exists. Updating blockchain fields only.`,
        );
  
        const updatedEvent = await this.prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            metadataHash: eventData.metadataHash,
            eventStartTime: new Date(eventData.eventStartTime),
            lastSyncedAt: new Date(),
          },
        });
  
        this.logger.log(`Event ${eventData.eventId} updated in database`);
        return updatedEvent;
      }
  
      /**
       * 2. Buscar organizador
       *    (syncEvent NO crea organizers ni eventos)
       */
      const organizer = await this.prisma.user.findUnique({
        where: { walletAddress: eventData.organizer },
      });
  
      if (!organizer) {
        this.logger.error(
          `CRITICAL: Organizer not found for blockchain event ${eventData.eventId}. Skipping sync.`,
        );
        return null;
      }
  
      /**
       * 3. Buscar evento pendiente (pending-*)
       *    Ventana amplia para evitar race conditions
       */
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
      this.logger.log(
        `Searching pending event for organizer ${organizer.id} and metadataHash ${eventData.metadataHash}`,
      );
  
      let pendingEvent = await this.prisma.event.findFirst({
        where: {
          blockchainEventId: { startsWith: 'pending-' },
          organizerId: organizer.id,
          createdAt: { gte: thirtyMinutesAgo },
        },
        orderBy: { createdAt: 'desc' },
      });
  
      if (!pendingEvent) {
        this.logger.error(
          `CRITICAL: Blockchain event ${eventData.eventId} arrived but no pending event exists. Skipping update to avoid duplicates.`,
        );
        return null;
      }
  
      /**
       * 4. Actualizar evento pendiente con el ID real del blockchain
       *    ⚠️ NO tocar campos de negocio (zonas, precios, resale, etc.)
       */
      this.logger.log(
        `Updating pending event ${pendingEvent.id} with blockchainEventId ${eventData.eventId}`,
      );
  
      const updatedEvent = await this.prisma.event.update({
        where: { id: pendingEvent.id },
        data: {
          blockchainEventId: eventData.eventId,
          metadataHash: eventData.metadataHash,
          eventStartTime: new Date(eventData.eventStartTime),
          lastSyncedAt: new Date(),
        },
      });
  
      this.logger.log(
        `Pending event ${pendingEvent.id} successfully linked to blockchainEventId ${eventData.eventId}`,
      );
  
      return updatedEvent;
    } catch (error) {
      this.logger.error(
        `Error syncing blockchain event ${eventData.eventId}`,
        error,
      );
      throw error;
    }
  }
  async syncTicket(ticketData: SyncTicketDto) {
    try {
      const event = await this.prisma.event.findUnique({
        where: { blockchainEventId: ticketData.eventId },
      });
      if (!event) return null;
  
      if (!ticketData.currentOwner || !ticketData.originalBuyer) return null;
  
      const [owner, originalBuyer] = await Promise.all([
        this.findOrCreateUserByWallet(ticketData.currentOwner),
        this.findOrCreateUserByWallet(ticketData.originalBuyer),
      ]);
      if (!owner || !originalBuyer) return null;
  
      // 🔍 Buscar ticket PENDING más antiguo
      const pendingTicket = await this.prisma.ticket.findFirst({
        where: {
          eventId: event.id,
          ownerId: originalBuyer.id,
          blockchainTicketId: { startsWith: 'pending-' },
        },
        orderBy: { createdAt: 'asc' },
      });
  
      if (!pendingTicket) {
        this.logger.warn(`No pending ticket found for ${ticketData.ticketId}`);
        return null;
      }
  
      // ✅ CONFIRMAR TICKET
      const updatedTicket = await this.prisma.ticket.update({
        where: { id: pendingTicket.id },
        data: {
          blockchainTicketId: ticketData.ticketId,
          ownerId: owner.id,
          status: ticketData.used ? TicketStatus.USED : TicketStatus.ACTIVE,
          usedAt: ticketData.used ? new Date() : null,
          lastSyncedAt: new Date(),
        },
      });
  
      this.logger.log(`Ticket confirmed ${ticketData.ticketId}`);
      return updatedTicket;
  
    } catch (error) {
      this.logger.error(`Error syncing ticket ${ticketData.ticketId}`, error);
      throw error;
    }
  }

  private async updateExistingTicketSafe(
    existingTicket: any,
    ownerId: string,
    ticketData: SyncTicketDto,
    resolvedZoneId: string | null,
  ) {
    const updateData: any = {
      ownerId,
      status: ticketData.used ? TicketStatus.USED : TicketStatus.ACTIVE,
      lastSyncedAt: new Date(),
    };
  
    // 👉 solo setear zona si antes NO tenía
    if (!existingTicket.zoneId && resolvedZoneId) {
      updateData.zoneId = resolvedZoneId;
      await this.incrementZoneSoldCount(resolvedZoneId);
    }
  
    if (ticketData.used && !existingTicket.usedAt) {
      updateData.usedAt = new Date();
    }
  
    return this.prisma.ticket.update({
      where: { id: existingTicket.id },
      data: updateData,
    });
  }
  
  private async findOrCreateUserByWallet(walletAddress: string) {
    try {
      // Primero buscar usuario existente
      let user = await this.prisma.user.findUnique({
        where: { walletAddress },
      });

      // Si no existe, crear un usuario placeholder
      if (!user) {
        this.logger.log(`Creating placeholder user for wallet: ${walletAddress}`);
        
        // Generar un email temporal basado en el wallet
        const tempEmail = `${walletAddress.toLowerCase().substring(0, 20)}@temp-wallet.com`;
        // Generar un DNI temporal
        const tempDni = `WALLET_${walletAddress.substring(0, 10)}`;
        // Generar username temporal
        const tempUsername = `wallet_${walletAddress.substring(0, 10)}`;

        user = await this.prisma.user.create({
          data: {
            email: tempEmail,
            dni: tempDni,
            username: tempUsername,
            walletAddress: walletAddress,
            password: 'placeholder_password_need_to_reset', // Usuario deberá resetear
            pais: 'Unknown',
            provincia: 'Unknown',
            ciudad: 'Unknown',
            calle: 'Unknown',
            numero: 'Unknown',
            codigoPostal: '00000',
            role: 'USER',
          },
        });

        this.logger.log(`Created placeholder user: ${user.id} for wallet: ${walletAddress}`);
      }

      return user;
    } catch (error) {
      this.logger.error(`Error finding/creating user for wallet ${walletAddress}:`, error);
      return null;
    }
  }

  private async handleTicketZone(eventId: string, ticketData: SyncTicketDto) {
    try {
      if (!ticketData.zone) return null;

      // Buscar zona existente por nombre
      let zone = await this.prisma.eventZone.findFirst({
        where: {
          eventId: eventId,
          name: ticketData.zone,
        },
      });

      // Si no existe, crear la zona
      if (!zone) {
        this.logger.log(`Zone "${ticketData.zone}" not found, creating it...`);
        
        zone = await this.prisma.eventZone.create({
          data: {
            eventId: eventId,
            name: ticketData.zone,
            price: ticketData.zonePrice ? parseFloat(ticketData.zonePrice) : 0,
            capacity: ticketData.zoneCapacity ? BigInt(ticketData.zoneCapacity) : BigInt(0),
            sold: BigInt(0), // Inicialmente 0 vendidos
          },
        });

        this.logger.log(`Created zone: ${zone.id} for event: ${eventId}`);
      }

      return zone;
    } catch (error) {
      this.logger.error(`Error handling zone for ticket ${ticketData.ticketId}:`, error);
      return null;
    }
  }

  private async incrementZoneSoldCount(zoneId: string) {
    try {
      await this.prisma.eventZone.update({
        where: { id: zoneId },
        data: {
          sold: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error incrementing zone sold count for zone ${zoneId}:`, error);
    }
  }

  private async updateExistingTicket(
    existingTicket: any,
    owner: any,
    originalBuyer: any,
    ticketData: SyncTicketDto,
    zoneId: string | null
  ) {
    const updateData: any = {
      ownerId: owner.id,
      status: ticketData.used ? TicketStatus.USED : TicketStatus.ACTIVE,
      lastSyncedAt: new Date(),
    };

    // Si el ticket cambió de zona, actualizar
    if (zoneId !== null && existingTicket.zoneId !== zoneId) {
      updateData.zoneId = zoneId;
      
      // Si tenía una zona anterior, decrementar su contador
      if (existingTicket.zoneId) {
        await this.decrementZoneSoldCount(existingTicket.zoneId);
      }
    }

    if (ticketData.used && !existingTicket.usedAt) {
      updateData.usedAt = new Date();
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id: existingTicket.id },
      data: updateData,
    });

    this.logger.log(`Ticket updated: ${ticketData.ticketId}`);
    return updatedTicket;
  }

  private async decrementZoneSoldCount(zoneId: string) {
    try {
      await this.prisma.eventZone.update({
        where: { id: zoneId },
        data: {
          sold: {
            decrement: 1,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error decrementing zone sold count for zone ${zoneId}:`, error);
    }
  }

  private async createNewTicket(
    ticketData: SyncTicketDto,
    eventId: string,
    ownerId: string,
    originalBuyerId: string,
    zoneId: string | null
  ) {
    return await this.prisma.ticket.create({
      data: {
        blockchainTicketId: ticketData.ticketId,
        eventId: eventId,
        zoneId: zoneId,
        ownerId: ownerId,
        originalBuyerId: originalBuyerId,
        mintedAt: new Date(ticketData.mintedAt * 1000),
        status: ticketData.used ? TicketStatus.USED : TicketStatus.ACTIVE,
        usedAt: ticketData.used ? new Date() : null,
        lastSyncedAt: new Date(),
      },
    });
  }

  async syncTicketResale(ticketId: string, seller: string, buyer: string, price: string) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { blockchainTicketId: ticketId },
        include: {
          event: true,
        },
      });
      
      if (!ticket) {
        this.logger.warn(`Ticket not found for resale: ${ticketId}`);
        return null;
      }

      // Buscar o crear usuario comprador
      const buyerUser = await this.findOrCreateUserByWallet(buyer);
      if (!buyerUser) {
        this.logger.warn(`Failed to find/create buyer: ${buyer}`);
        return null;
      }

      // Actualizar owner del ticket
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { 
          ownerId: buyerUser.id,
          lastSyncedAt: new Date(),
        },
      });

      // Manejar listing del marketplace
      const activeListing = await this.prisma.marketplaceListing.findFirst({
        where: {
          ticketId: ticket.id,
          status: 'ACTIVE',
        },
      });

      if (activeListing) {
        await this.prisma.marketplaceListing.update({
          where: { id: activeListing.id },
          data: {
            status: 'SOLD',
            buyerId: buyerUser.id,
            soldAt: new Date(),
            blockchainTxHash: ticketId, // O el hash de la transacción real
            updatedAt: new Date(),
          },
        });
      } else {
        // Crear un registro histórico si no había listing activo
        await this.prisma.marketplaceListing.create({
          data: {
            ticketId: ticket.id,
            sellerId: ticket.ownerId, // El anterior owner
            buyerId: buyerUser.id,
            price: BigInt(price),
            status: 'SOLD',
            soldAt: new Date(),
            blockchainTxHash: ticketId,
          },
        });
      }

      this.logger.log(`Ticket resale synced: ${ticketId}`);
      return ticket;
    } catch (error) {
      this.logger.error(`Error syncing ticket resale ${ticketId}:`, error);
      throw error;
    }
  }
}


