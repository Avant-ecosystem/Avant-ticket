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
      // 1. Buscar si ya existe un evento con el blockchainEventId real
      let existingEvent = await this.prisma.event.findUnique({
        where: { blockchainEventId: eventData.eventId },
      });

      if (existingEvent) {
        // Si existe un evento con este blockchainEventId, solo actualizar campos del blockchain
        // Preservar los valores existentes (ticketsTotal, resaleConfig, etc.) porque ya están establecidos
        this.logger.log(`Event with blockchainEventId ${eventData.eventId} already exists. Updating blockchain fields only.`);
        const updatedEvent = await this.prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            metadataHash: eventData.metadataHash,
            eventStartTime: new Date(eventData.eventStartTime),
            // NO actualizar ticketsTotal, resaleConfig, etc. - preservar valores existentes
            lastSyncedAt: new Date(),
          },
        });
        this.logger.log(`Event ${eventData.eventId} updated in database`);
        return updatedEvent;
      }

      // 2. Si no existe, buscar eventos pendientes (que empiezan con "pending-")
      // Buscamos por metadataHash y organizer para encontrar el evento pendiente
      const organizer = await this.prisma.user.findUnique({
        where: { walletAddress: eventData.organizer },
      });

      if (!organizer) {
        this.logger.warn(`Organizer not found: ${eventData.organizer}`);
        // Intentar crear un placeholder organizer si no existe (para eventos creados directamente en blockchain)
        this.logger.warn(`Will create event anyway, but organizer ${eventData.organizer} needs to be created first`);
        return null;
      }

      // Buscar eventos pendientes recientes (últimos 30 minutos) con el mismo metadataHash y organizer
      // Aumentamos el tiempo para dar más margen a la sincronización
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      this.logger.log(`Searching for pending event with metadataHash: ${eventData.metadataHash}, organizer: ${organizer.id}`);
      
      // Primero buscar por metadataHash exacto
      let pendingEvent = await this.prisma.event.findFirst({
        where: {
          blockchainEventId: { startsWith: 'pending-' },
          metadataHash: eventData.metadataHash,
          organizerId: organizer.id,
          createdAt: { gte: thirtyMinutesAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Si no encuentra por metadataHash exacto, buscar solo por organizer (último evento pendiente)
      if (!pendingEvent) {
        this.logger.log(`No pending event found with exact metadataHash, trying broader search...`);
        pendingEvent = await this.prisma.event.findFirst({
          where: {
            blockchainEventId: { startsWith: 'pending-' },
            organizerId: organizer.id,
            createdAt: { gte: thirtyMinutesAgo },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      if (pendingEvent) {
        this.logger.log(`Found pending event ${pendingEvent.id} with blockchainEventId: ${pendingEvent.blockchainEventId}`);
      } else {
        this.logger.warn(`No pending event found for event ${eventData.eventId}. Will create new event.`);
      }

      if (pendingEvent) {
        // Actualizar el evento pendiente con el blockchainEventId real
        // IMPORTANTE: Preservar los valores originales del evento pendiente (ticketsTotal, resaleConfig, etc.)
        // porque fueron creados con los datos correctos del usuario. Solo actualizar campos del blockchain.
        this.logger.log(`Updating pending event ${pendingEvent.id} with blockchainEventId ${eventData.eventId}`);
        this.logger.log(`Preserving original values: ticketsTotal=${pendingEvent.ticketsTotal}, resaleEnabled=${pendingEvent.resaleEnabled}, maxResalePrice=${pendingEvent.maxResalePrice}`);
        
        // Solo actualizar los campos que vienen del blockchain:
        // - blockchainEventId: El ID real del blockchain
        // - metadataHash: El hash del metadata del blockchain
        // - eventStartTime: La fecha del blockchain (fuente de verdad)
        // - ticketsMinted: Resetear a 0 (nuevo evento)
        // - lastSyncedAt: Fecha de sincronización
        // Los demás campos (ticketsTotal, resaleEnabled, maxResalePrice, resaleStartTime, resaleEndTime, percentages)
        // se preservan automáticamente porque NO los incluimos en el update
        const updatedEvent = await this.prisma.event.update({
          where: { id: pendingEvent.id },
          data: {
            blockchainEventId: eventData.eventId,
            metadataHash: eventData.metadataHash,
            eventStartTime: new Date(eventData.eventStartTime),
            ticketsMinted: BigInt(0), // Resetear tickets minted
            lastSyncedAt: new Date(),
            // NO actualizar: ticketsTotal, resaleEnabled, maxResalePrice, resaleStartTime, resaleEndTime, percentages
            // Estos se preservan del evento pendiente original
          },
        });
        this.logger.log(`Pending event updated with blockchainEventId: ${eventData.eventId}`);
        this.logger.log(`Final values: ticketsTotal=${updatedEvent.ticketsTotal}, resaleEnabled=${updatedEvent.resaleEnabled}, maxResalePrice=${updatedEvent.maxResalePrice}`);
        return updatedEvent;
      }

      // 3. Si no hay evento pendiente, crear uno nuevo
      // Esto puede pasar si el evento se creó directamente en blockchain sin pasar por el backend
      // En este caso, usar los valores por defecto de eventData porque no hay evento pendiente con datos correctos
      this.logger.warn(`No pending event found. Creating new event with default values from blockchain.`);
      const newEvent = await this.prisma.event.create({
        data: {
          blockchainEventId: eventData.eventId,
          organizerId: organizer.id,
          metadataHash: eventData.metadataHash,
          eventStartTime: new Date(eventData.eventStartTime),
          ticketsTotal: BigInt(eventData.ticketsTotal),
          ticketsMinted: BigInt(0),
          resaleEnabled: eventData.resaleConfig.enabled,
          maxResalePrice: eventData.resaleConfig.maxPrice
            ? BigInt(eventData.resaleConfig.maxPrice)
            : null,
          resaleStartTime: eventData.resaleConfig.resaleStartTime
            ? new Date(eventData.resaleConfig.resaleStartTime )
            : null,
          resaleEndTime: eventData.resaleConfig.resaleEndTime
            ? new Date(eventData.resaleConfig.resaleEndTime )
            : null,
          sellerPercentage: eventData.commissionConfig.sellerPercentage,
          organizerPercentage: eventData.commissionConfig.organizerPercentage,
          platformPercentage: eventData.commissionConfig.platformPercentage,
          lastSyncedAt: new Date(),
        },
      });

      this.logger.log(`New event created in database: ${eventData.eventId}`);
      return newEvent;
    } catch (error) {
      this.logger.error(`Error syncing event ${eventData.eventId}:`, error);
      throw error;
    }
  }

  async syncTicket(ticketData: SyncTicketDto) {
    try {
      const existingTicket = await this.prisma.ticket.findUnique({
        where: { blockchainTicketId: ticketData.ticketId },
      });

      const event = await this.prisma.event.findUnique({
        where: { blockchainEventId: ticketData.eventId },
      });
      if (!event) {
        this.logger.warn(`Event not found for ticket: ${ticketData.ticketId}`);
        return null;
      }

      if (!ticketData.currentOwner) {
        this.logger.warn(`Current owner is null/undefined for ticket: ${ticketData.ticketId}`);
        return null;
      }
      if (!ticketData.originalBuyer) {
        this.logger.warn(`Original buyer is null/undefined for ticket: ${ticketData.ticketId}`);
        return null;
      }

      const owner = await this.prisma.user.findUnique({
        where: { walletAddress: ticketData.currentOwner },
      });

      if (!owner) {
        this.logger.warn(`Owner not found: ${ticketData.currentOwner}`);
        return null;
      }

      if (existingTicket) {
        const updateData: any = {
          ownerId: owner.id,
          status: ticketData.used ? TicketStatus.USED : TicketStatus.ACTIVE,
          lastSyncedAt: new Date(),
        };

        if (ticketData.used && !existingTicket.usedAt) {
          updateData.usedAt = new Date();
        }

        return this.prisma.ticket.update({
          where: { id: existingTicket.id },
          data: updateData,
        });
      }

      const originalBuyer = await this.prisma.user.findUnique({
        where: { walletAddress: ticketData.originalBuyer },
      });

      if (!originalBuyer) {
        this.logger.warn(`Original buyer not found: ${ticketData.originalBuyer}`);
        return null;
      }

      const ticket = await this.prisma.ticket.create({
        data: {
          blockchainTicketId: ticketData.ticketId,
          eventId: event.id,
          ownerId: ticketData.currentOwner === ticketData.originalBuyer ? originalBuyer.id : owner.id,
          originalBuyerId: originalBuyer.id,
          zone: ticketData.zone || null,
          mintedAt: new Date(ticketData.mintedAt * 1000),
          status: ticketData.used ? TicketStatus.USED : TicketStatus.ACTIVE,
          usedAt: ticketData.used ? new Date() : null,
        },
      });

      this.logger.log(`Ticket synced: ${ticketData.ticketId}`);
      return ticket;
    } catch (error) {
      this.logger.error(`Error syncing ticket ${ticketData.ticketId}:`, error);
      throw error;
    }
  }

  async syncTicketResale(ticketId: string, seller: string, buyer: string, price: string) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { blockchainTicketId: ticketId },
      });
      if (!ticket) {
        this.logger.warn(`Ticket not found for resale: ${ticketId}`);
        return null;
      }

      const buyerUser = await this.prisma.user.findUnique({
        where: { walletAddress: buyer },
      });

      if (!buyerUser) {
        this.logger.warn(`Buyer not found: ${buyer}`);
        return null;
      }

      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { ownerId: buyerUser.id },
      });

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

