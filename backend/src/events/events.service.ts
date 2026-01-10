import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { BlockchainActionsService } from '../blockchain/blockchain-actions.service';
import { decodeAddress } from '@polkadot/util-crypto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainActions: BlockchainActionsService,
  ) {}

  // Helper para convertir BigInt a string en eventos
  private serializeEvent(event: any) {
    if (!event) return event;
    
    const serialized = {
      ...event,
      ticketsTotal: typeof event.ticketsTotal === 'bigint' ? event.ticketsTotal.toString() : (event.ticketsTotal ?? '0'),
      ticketsMinted: typeof event.ticketsMinted === 'bigint' ? event.ticketsMinted.toString() : (event.ticketsMinted ?? '0'),
      maxResalePrice: event.maxResalePrice 
        ? (typeof event.maxResalePrice === 'bigint' ? event.maxResalePrice.toString() : event.maxResalePrice)
        : null,
    };
    
    // Si hay tickets incluidos, serializarlos también
    if (event.tickets && Array.isArray(event.tickets)) {
      serialized.tickets = event.tickets.map((ticket: any) => ({
        ...ticket,
        // Los tickets no tienen BigInt directamente en este contexto, pero por si acaso
      }));
    }
    
    return serialized;
  }

  async create(userId: string, createEventDto: CreateEventDto) {
    // Obtener el usuario organizador
    const organizer = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!organizer) {
      throw new NotFoundException('Organizer not found');
    }

    try {
      // Preparar datos para blockchain
      const organizerAddress = organizer.walletAddress;
      const organizerId = decodeAddress(organizerAddress);
      const metadataHash = Buffer.from(createEventDto.metadataHash.replace('0x', ''), 'hex');
      const metadataArray = Array.from(metadataHash);

      const eventStartTime = Math.floor(new Date(createEventDto.eventStartTime).getTime() / 1000);
      const ticketsTotal = BigInt(createEventDto.ticketsTotal);
      if(!createEventDto.resaleEnabled){
        throw new BadRequestException('Resale is not enabled');
       }
      const resaleConfig = {
        enabled: createEventDto.resaleEnabled,
        max_price: createEventDto.maxResalePrice ? BigInt(createEventDto.maxResalePrice) : null,
        resale_start_time: createEventDto.resaleStartTime
          ? BigInt(Math.floor(new Date(createEventDto.resaleStartTime).getTime() / 1000))
          : null,
        resale_end_time: createEventDto.resaleEndTime
          ? BigInt(Math.floor(new Date(createEventDto.resaleEndTime).getTime() / 1000))
          : null,
      };

      const commissionConfig = {
        seller_percentage: createEventDto.sellerPercentage ?? 8500,
        organizer_percentage: createEventDto.organizerPercentage ?? 1000,
        platform_percentage: createEventDto.platformPercentage ?? 500,
      };

      if(!organizerAddress){
        throw new BadRequestException('Organizer address is required');
      }
      // 1. Crear evento en blockchain
      this.logger.log(`Creating event on blockchain for organizer ${organizerAddress}`);


      const blockchainResult = await this.blockchainActions.createEvent(
        organizerAddress,
        createEventDto.metadataHash as `0x${string}`,
        BigInt(eventStartTime),
        ticketsTotal,
        resaleConfig,
        commissionConfig,
      );

      this.logger.log(`Event created on blockchain: ${blockchainResult.hash}`);

      // 2. Intentar obtener el event_id del resultado de la transacción
      // Si el smart contract devuelve el event_id en la respuesta, lo usamos
      let blockchainEventId: string | undefined = createEventDto.blockchainEventId;
      
      // Intentar extraer event_id del resultado de la transacción
      // NOTA: En GearApi/Sails, el event_id normalmente NO viene en la respuesta de la transacción
      // Se obtiene del evento EventCreated que se emite después. Por eso usamos un placeholder temporal.
      if (blockchainResult.response) {
        try {
          // El resultado puede tener diferentes formatos dependiendo del smart contract
          // Intentamos obtener el event_id de diferentes formas posibles
          const result = blockchainResult.response;
          
          // Si es un objeto con event_id
          if (result && typeof result === 'object') {
            const resultObj = result as any;
            
            // Intentar llamar toHuman si existe
            let processedResult = resultObj;
            if (resultObj.toHuman && typeof resultObj.toHuman === 'function') {
              try {
                processedResult = resultObj.toHuman();
              } catch (e) {
                this.logger.warn(`Could not call toHuman: ${e.message}`);
              }
            }
            
            // Buscar event_id en diferentes lugares
            if (processedResult && typeof processedResult === 'object') {
              if (processedResult.event_id !== undefined) {
                blockchainEventId = String(processedResult.event_id);
              } else if (processedResult.ok?.event_id !== undefined) {
                blockchainEventId = String(processedResult.ok.event_id);
              } else if (processedResult.Err) {
                // Si hay error, loguearlo
                this.logger.warn(`Transaction returned error: ${JSON.stringify(processedResult.Err)}`);
              } else {
                // Log completo del resultado para debugging
                this.logger.debug(`Transaction result structure: ${JSON.stringify(processedResult)}`);
              }
            }
          }
          
          if (blockchainEventId && blockchainEventId !== createEventDto.blockchainEventId) {
            this.logger.log(`Event ID extracted from blockchain result: ${blockchainEventId}`);
          } else {
            this.logger.warn(`Could not extract event_id from transaction result. Will use pending placeholder.`);
          }
        } catch (error) {
          this.logger.warn(`Error extracting event_id from transaction result: ${error.message}`);
        }
      } else {
        this.logger.warn(`No result in blockchain transaction response. Will use pending placeholder.`);
      }

      // 3. Crear evento en DB
      // Usamos el blockchainEventId si lo tenemos, sino usamos el hash como placeholder
      // El evento se actualizará con el event_id real cuando llegue el EventCreated
      const dbEvent = await this.prisma.event.create({
        data: {
          blockchainEventId: blockchainEventId || `pending-${blockchainResult.hash}`,
          metadataHash: createEventDto.metadataHash,
          name: createEventDto.name,
          description: createEventDto.description,
          eventStartTime: new Date(createEventDto.eventStartTime),
          resaleStartTime: createEventDto.resaleStartTime ? new Date(createEventDto.resaleStartTime) : null,
          resaleEndTime: createEventDto.resaleEndTime ? new Date(createEventDto.resaleEndTime) : null,
          ticketsTotal: ticketsTotal,
          maxResalePrice: createEventDto.maxResalePrice ? BigInt(createEventDto.maxResalePrice) : null,
          organizerId: userId,
          resaleEnabled: createEventDto.resaleEnabled ?? true,
          sellerPercentage: commissionConfig.seller_percentage,
          organizerPercentage: commissionConfig.organizer_percentage,
          platformPercentage: commissionConfig.platform_percentage,
        },
      });

      this.logger.log(`Event created in database: ${dbEvent.id}`);
      
      return this.serializeEvent(dbEvent);
    } catch (error) {
      this.logger.error(`Error creating event:`, error);
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create event on blockchain: ${error.message}`);
    }
  }

  async findAll(pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        skip,
        take: limit,
        include: {
          organizer: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
        },
        orderBy: {
          eventStartTime: 'asc',
        },
      }),
      this.prisma.event.count(),
    ]);

    return {
      data: events.map(event => this.serializeEvent(event)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
          },
        },
        tickets: {
          include: {
            owner: {
              select: {
                id: true,
                walletAddress: true,
              },
            },
          },
        },
      },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return this.serializeEvent(event);
  }

  async findByBlockchainId(blockchainEventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { blockchainEventId },
    });
    return event ? this.serializeEvent(event) : null;
  }

  async update(id: string, userId: string, updateEventDto: UpdateEventDto) {
    const event = await this.findOne(id);
    if (event.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can update this event');
    }

    const updateData: any = { ...updateEventDto };
    if (updateEventDto.eventStartTime) {
      updateData.eventStartTime = new Date(updateEventDto.eventStartTime);
    }
    if (updateEventDto.resaleStartTime) {
      updateData.resaleStartTime = new Date(updateEventDto.resaleStartTime);
    }
    if (updateEventDto.resaleEndTime) {
      updateData.resaleEndTime = new Date(updateEventDto.resaleEndTime);
    }
    if (updateEventDto.ticketsTotal) {
      updateData.ticketsTotal = BigInt(updateEventDto.ticketsTotal);
    }
    if (updateEventDto.maxResalePrice !== undefined) {
      updateData.maxResalePrice = updateEventDto.maxResalePrice ? BigInt(updateEventDto.maxResalePrice) : null;
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: updateData,
    });
    return this.serializeEvent(updatedEvent);
  }

  async remove(id: string, userId: string) {
    const event = await this.findOne(id);
    if (event.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can delete this event');
    }
    const deletedEvent = await this.prisma.event.delete({
      where: { id },
    });
    return this.serializeEvent(deletedEvent);
  }

  async mintTickets(
    eventId: string,
    userId: string,
    amount: number,
    buyerWalletAddress?: string,
    zones?: string[],
  ) {
    const event = await this.findOne(eventId);

    // Verificar permisos: solo organizador o admin
    if (event.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenException('Only the organizer or admin can mint tickets');
      }
    }

    // Validar que el evento esté activo
    if (!event.active) {
      throw new BadRequestException('Cannot mint tickets for an inactive event');
    }

    // Validar que no se exceda el total de tickets
    const currentTickets = await this.prisma.ticket.count({
      where: { eventId: event.id },
    });

    if (BigInt(currentTickets) + BigInt(amount) > event.ticketsTotal) {
      throw new BadRequestException(
        `Cannot mint ${amount} tickets. Event can only have ${event.ticketsTotal} tickets total. Currently has ${currentTickets}`,
      );
    }

    // Obtener la dirección del comprador
    let buyerAddress = buyerWalletAddress;
    if (!buyerAddress) {
      const buyer = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!buyer) {
        throw new NotFoundException('Buyer not found');
      }
      if(!buyer.walletAddress){
        throw new BadRequestException('Buyer address is required');
      }
      buyerAddress = buyer.walletAddress;
      if(!buyerAddress){
        throw new BadRequestException('Buyer address is required');
      }
    } else {
      // Validar que el buyerWalletAddress existe en la DB
      const buyer = await this.prisma.user.findUnique({
        where: { walletAddress: buyerAddress },
      });
      if (!buyer) {
        throw new NotFoundException(`Buyer with wallet address ${buyerAddress} not found`);
      }
    }

    try {
      // Mintear tickets en blockchain
      this.logger.log(`Minting ${amount} tickets for event ${event.blockchainEventId}`);
      const blockchainResult = await this.blockchainActions.mintTickets(
        BigInt(event.blockchainEventId),
        buyerAddress,
        BigInt(amount),
        zones || [],
      );

      this.logger.log(`Tickets minted on blockchain: ${blockchainResult.hash}`);

      return {
        success: true,
        message: 'Tickets are being minted. They will appear in your account once the transaction is confirmed.',
        blockchainTxHash: blockchainResult.hash,
        blockHash: blockchainResult.blockHash,
        amount,
        eventId: event.id,
        blockchainEventId: event.blockchainEventId,
      };
    } catch (error) {
      this.logger.error(`Error minting tickets:`, error);
      throw new BadRequestException(`Failed to mint tickets on blockchain: ${error.message}`);
    }
  }

  async getEventStats(eventId: string, userId?: string) {
    // Obtener evento directamente de Prisma (sin serializar) para trabajar con BigInt
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Verificar permisos para estadísticas detalladas
    if (userId && event.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || (user.role !== 'ADMIN' && user.role !== 'ORGANIZER')) {
        // Si no es organizador o admin, retornar solo estadísticas públicas
        return this.getPublicStats(event);
      }
    }

    // Estadísticas completas para organizador/admin
    const [
      totalTickets,
      activeTickets,
      usedTickets,
      cancelledTickets,
      listedTickets,
      soldListings,
      activeListings,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: { eventId: event.id } }),
      this.prisma.ticket.count({ where: { eventId: event.id, status: 'ACTIVE' } }),
      this.prisma.ticket.count({ where: { eventId: event.id, status: 'USED' } }),
      this.prisma.ticket.count({ where: { eventId: event.id, status: 'CANCELLED' } }),
      this.prisma.marketplaceListing.count({
        where: { ticket: { eventId: event.id } },
      }),
      this.prisma.marketplaceListing.count({
        where: { ticket: { eventId: event.id }, status: 'SOLD' },
      }),
      this.prisma.marketplaceListing.count({
        where: { ticket: { eventId: event.id }, status: 'ACTIVE' },
      }),
    ]);

    // Convertir a BigInt para cálculos
    const ticketsTotal = typeof event.ticketsTotal === 'bigint' ? event.ticketsTotal : BigInt(event.ticketsTotal);
    const ticketsMinted = BigInt(totalTickets);
    const ticketsRemaining = ticketsTotal - ticketsMinted; 
    const mintPercentage = ticketsTotal > 0n
      ? Number((ticketsMinted * 100n) / ticketsTotal)
      : 0;

    return {
      eventId: event.id,
      blockchainEventId: event.blockchainEventId,
      name: event.name,
      totalTickets: ticketsTotal.toString(),
      ticketsMinted: ticketsMinted.toString(),
      ticketsRemaining: ticketsRemaining.toString(),
      mintPercentage: mintPercentage.toFixed(2),
      activeTickets,
      usedTickets,
      cancelledTickets,
      totalListings: listedTickets,
      soldListings,
      activeListings,
      eventStartTime: event.eventStartTime,
      resaleEnabled: event.resaleEnabled,
      active: event.active,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private async getPublicStats(event: any) {
    const totalTickets = await this.prisma.ticket.count({ where: { eventId: event.id } });
    
    // Convertir a BigInt para cálculos
    const ticketsTotal = typeof event.ticketsTotal === 'bigint' ? event.ticketsTotal : BigInt(event.ticketsTotal);
    const ticketsMinted = BigInt(totalTickets);
    const ticketsRemaining = ticketsTotal - ticketsMinted;

    return {
      eventId: event.id,
      name: event.name,
      totalTickets: event.ticketsTotal.toString(),
      ticketsMinted: ticketsMinted.toString(),
      ticketsRemaining: ticketsRemaining.toString(),
      eventStartTime: event.eventStartTime,
      resaleEnabled: event.resaleEnabled,
      active: event.active,
    };
  }
}

