import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { BlockchainActionsService } from '../blockchain/blockchain-actions.service';
import { decodeAddress } from '@polkadot/util-crypto';
import { Decimal } from '@prisma/client/runtime/index-browser';
import { TicketStatus } from '@prisma/client';
import { randomUUID ,createHash} from 'crypto';

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
    
    // Verificar si el evento tiene zonas
    const hasZones = event.zones && Array.isArray(event.zones);
    
    // Calcular ticketsTotal desde las zonas (nuevo cálculo)
    let ticketsTotal = BigInt(0);
    let ticketsMintedFromZones = BigInt(0);
    
    if (hasZones) {
      ticketsTotal = event.zones.reduce((total: bigint, zone: any) => {
        const capacity = typeof zone.capacity === 'bigint' 
          ? zone.capacity 
          : BigInt(zone.capacity || 0);
        return total + capacity;
      }, BigInt(0));
      
      ticketsMintedFromZones = event.zones.reduce((total: bigint, zone: any) => {
        const sold = typeof zone.sold === 'bigint' 
          ? zone.sold 
          : BigInt(zone.sold || 0);
        return total + sold;
      }, BigInt(0));
    }
    
    // Calcular tickets minteados desde la relación tickets (backup)
    const ticketsMintedFromRelation = event._count?.tickets || event.tickets?.length || 0;
    
    // Usar el mayor valor entre tickets minteados de zonas y de relación
    const ticketsMintedBigInt = ticketsMintedFromZones > BigInt(0) 
      ? ticketsMintedFromZones 
      : BigInt(ticketsMintedFromRelation);
    
    const ticketsRemaining = ticketsTotal - ticketsMintedBigInt;
    const mintPercentage = ticketsTotal > 0n
      ? Number((ticketsMintedBigInt * 100n) / ticketsTotal)
      : 0;
  
    // Serializar zonas si existen
    const serializedZones = hasZones
      ? event.zones.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          price: zone.price instanceof Decimal 
            ? zone.price.toNumber() 
            : Number(zone.price || 0),
          capacity: (typeof zone.capacity === 'bigint' 
            ? zone.capacity.toString() 
            : String(zone.capacity || 0)),
          sold: (typeof zone.sold === 'bigint' 
            ? zone.sold.toString() 
            : String(zone.sold || 0)),
          available: (typeof zone.capacity === 'bigint' && typeof zone.sold === 'bigint'
            ? (zone.capacity - zone.sold).toString()
            : String((Number(zone.capacity || 0) - Number(zone.sold || 0)))),
        }))
      : [];
  
    const serialized = {
      ...event,
      // Calcular campos basados en zonas
      ticketsTotal: ticketsTotal.toString(),
      ticketsMinted: ticketsMintedBigInt.toString(),
      ticketsRemaining: ticketsRemaining.toString(),
      mintPercentage: mintPercentage.toFixed(2),
      
      // Serializar otros campos
      maxResalePrice: event.maxResalePrice 
        ? (typeof event.maxResalePrice === 'bigint' 
            ? event.maxResalePrice.toString() 
            : String(event.maxResalePrice || ''))
        : null,
      
      // Serializar zones
      zones: serializedZones,
      
    };
    
    // Si hay tickets incluidos, serializarlos también
    if (event.tickets && Array.isArray(event.tickets)) {
      serialized.tickets = event.tickets.map((ticket: any) => ({
        ...ticket,
        blockchainTicketId: ticket.blockchainTicketId,
        // Serializar zona si el ticket tiene relación con EventZone
        zone: ticket.zone ? {
          id: ticket.zone.id,
          name: ticket.zone.name,
        } : null,
        // Si el ticket tiene owner, serializarlo
        owner: ticket.owner ? {
          id: ticket.owner.id,
          username: ticket.owner.username,
          email: ticket.owner.email,
        } : ticket.owner,
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
  
    if (!organizer.walletAddress) {
      throw new BadRequestException('Organizer address is required');
    }
  
    // Validaciones
    if (!createEventDto.zones || createEventDto.zones.length === 0) {
      throw new BadRequestException('Zones are required');
    }
  
    if (!createEventDto.resaleEnabled) {
      throw new BadRequestException('Resale is not enabled');
    }
  
    try {
      // Calcular valores
      const ticketsTotal = createEventDto.zones.reduce((total, zone) => {
        return total + BigInt(zone.capacity);
      }, BigInt(0));
  
      const eventStartTime = Math.floor(new Date(createEventDto.eventStartTime).getTime());
  
      this.logger.log(`Total tickets from zones: ${ticketsTotal} (${createEventDto.zones.length} zones)`);
  
      // Configuraciones
      const resaleConfig = {
        enabled: createEventDto.resaleEnabled,
        max_price: createEventDto.maxResalePrice ? BigInt(createEventDto.maxResalePrice) : null,
        resale_start_time: createEventDto.resaleStartTime
          ? BigInt(new Date(createEventDto.resaleStartTime).getTime())
          : null,
        resale_end_time: createEventDto.resaleEndTime
          ? BigInt(new Date(createEventDto.resaleEndTime).getTime())
          : null,
      };
  
      const commissionConfig = {
        seller_percentage: createEventDto.sellerPercentage ?? 8500,
        organizer_percentage: createEventDto.organizerPercentage ?? 1000,
        platform_percentage: createEventDto.platformPercentage ?? 500,
      };
  
      // === PASO 1: GUARDAR EVENTO COMO PENDIENTE EN BASE DE DATOS ===
      const pendingTransactionHash = `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const dbEvent = await this.prisma.event.create({
        data: {
          // Usar un placeholder temporal para blockchainEventId
          blockchainEventId: pendingTransactionHash,
          metadataHash: createEventDto.metadataHash,
          name: createEventDto.name,
          imageUrl: createEventDto.imageUrl ?? "",
          description: createEventDto.description,
          location: createEventDto.location ?? "",
          eventStartTime: new Date(createEventDto.eventStartTime),
          eventEndTime: new Date(createEventDto.eventEndTime),
          resaleStartTime: createEventDto.resaleStartTime ? new Date(createEventDto.resaleStartTime) : null,
          resaleEndTime: createEventDto.resaleEndTime ? new Date(createEventDto.resaleEndTime) : null,
          maxResalePrice: createEventDto.maxResalePrice ? BigInt(createEventDto.maxResalePrice) : null,
          organizerId: userId,
          resaleEnabled: createEventDto.resaleEnabled ?? true,
          sellerPercentage: commissionConfig.seller_percentage,
          organizerPercentage: commissionConfig.organizer_percentage,
          platformPercentage: commissionConfig.platform_percentage,
          zones: {
            create: createEventDto.zones.map(zone => ({
              name: zone.name,
              price: new Decimal(zone.price),
              capacity: BigInt(zone.capacity),
              sold: BigInt(0),
            })),
          },
        },
        include: {
          zones: true,
        },
      });
  
      this.logger.log(`Event saved as pending in database: ${dbEvent.id}`);
      this.logger.log(`Pending blockchainEventId placeholder: ${pendingTransactionHash}`);
  
      // === PASO 2: ENVIAR TRANSACCIÓN A BLOCKCHAIN ===
      this.logger.log(`Creating event on blockchain for organizer ${organizer.walletAddress}`);
  
      const blockchainResult = await this.blockchainActions.createEvent(
        organizer.walletAddress,
        createEventDto.metadataHash as `0x${string}`,
        BigInt(eventStartTime),
        ticketsTotal,
        resaleConfig,
        commissionConfig,
      );
  
      this.logger.log(`Transaction sent to blockchain: ${blockchainResult.hash}`);
  
  
      // === PASO 4: MANEJAR RESPUESTA DE BLOCKCHAIN (OPCIONAL) ===
      // Solo intentamos extraer event_id si viene en la respuesta inmediata
      let immediateEventId: string | undefined;
      
      if (blockchainResult.response) {
        try {
          const result = blockchainResult.response;
          if (result && typeof result === 'object') {
            const resultObj = result as any;
            
            if (resultObj.toHuman && typeof resultObj.toHuman === 'function') {
              try {
                const processedResult = resultObj.toHuman();
                if (processedResult && typeof processedResult === 'object') {
                  if (processedResult.event_id !== undefined) {
                    immediateEventId = String(processedResult.event_id);
                  } else if (processedResult.ok?.event_id !== undefined) {
                    immediateEventId = String(processedResult.ok.event_id);
                  }
                }
              } catch (e) {
                this.logger.warn(`Could not process blockchain response: ${e.message}`);
              }
            }
          }
        } catch (error) {
          this.logger.warn(`Error extracting event_id: ${error.message}`);
        }
      }
  
      // Si tenemos un event_id inmediato, actualizamos
      if (immediateEventId) {
        this.logger.log(`Immediate event ID received: ${immediateEventId}`);
        await this.prisma.event.update({
          where: { id: dbEvent.id },
          data: {
            blockchainEventId: immediateEventId,
          },
        });
      } else {
        this.logger.log(`Waiting for EventCreated blockchain event. Event remains as pending.`);
        // El evento se actualizará cuando llegue el EventCreated desde el listener
      }
  
      return this.serializeEvent(dbEvent);
    } catch (error) {
      this.logger.error(`Error creating event:`, error);
      
      // Si hay error de blockchain, podemos marcar el evento como fallido
      // Buscar si se creó un evento pendiente
      
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create event: ${error.message}`);
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
          zones: true,
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
        zones: true,
        tickets: {
          include: {
            zone: true,
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

  async addStaffToEvent(
  eventId: string,
  requesterId: string,
  staffEmail: string,
) {
  const event = await this.prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    throw new NotFoundException('Event not found');
  }

  const requester = await this.prisma.user.findUnique({
    where: { id: requesterId },
  });

  if (!requester) {
    throw new NotFoundException('Requester not found');
  }

  // 🔐 Permisos
  if (
    event.organizerId !== requesterId &&
    requester.role !== 'ADMIN'
  ) {
    throw new ForbiddenException('You cannot assign staff to this event');
  }
  
  if (!staffEmail) {
  throw new BadRequestException('staffEmail is required');
}

  // 🔎 Buscar staff por EMAIL
  const staff = await this.prisma.user.findUnique({
    where: { email: staffEmail.toLowerCase() },
  });

  if (!staff) {
    throw new NotFoundException('Staff user not found');
  }

  if (!['SCANNER', 'ADMIN'].includes(staff.role)) {
    throw new BadRequestException('User is not allowed to be staff');
  }

  // 🚫 Evitar duplicados
  const alreadyAssigned = await this.prisma.eventStaff.findUnique({
    where: {
      eventId_staffId: {
        eventId,
        staffId: staff.id, // 👈 ID real
      },
    },
  });

  if (alreadyAssigned) {
    throw new BadRequestException('Staff already assigned to this event');
  }

  // ✅ Crear relación
  await this.prisma.eventStaff.create({
    data: {
      eventId,
      staffId: staff.id, // 👈 SIEMPRE ID
    },
  });

  return {
    success: true,
    eventId,
    staffId: staff.id,
    staffEmail: staff.email,
  };
}

async findEventsByStaff(staffId: string) {
  const staff = await this.prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!staff) {
    throw new NotFoundException('Staff not found');
  }

  if (!['SCANNER', 'ADMIN'].includes(staff.role)) {
    throw new ForbiddenException('User is not staff');
  }

  const events = await this.prisma.event.findMany({
    where: {
      staffAssignments: {
        some: {
          staffId,
        },
      },
    },
    include: {
      zones: true,
      _count: {
        select: {
          tickets: true,
        },
      },
    },
    orderBy: {
      eventStartTime: 'asc',
    },
  });

  return events.map(event => this.serializeEvent(event));
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
  
    // Permisos

    if (!event.active) {
      throw new BadRequestException('Cannot mint tickets for an inactive event');
    }
  
    const eventWithZones = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { zones: true },
    });
    if (!eventWithZones) {
      throw new NotFoundException('Event not found');
    }
  
    // Validación de zonas
    if (eventWithZones.zones.length > 0) {
      if (!zones || zones.length !== amount) {
        throw new BadRequestException(`Must specify exactly ${amount} zones`);
      }
  
      for (const zoneName of zones) {
        const zone = eventWithZones.zones.find(z => z.name === zoneName);
        if (!zone) {
          throw new NotFoundException(`Zone "${zoneName}" not found`);
        }
        if (zone.sold >= zone.capacity) {
          throw new BadRequestException(`Zone "${zone.name}" is sold out`);
        }
      }
    }
  
    // Buyer
    let buyerAddress = buyerWalletAddress;
    let buyerUser;
  
    if (!buyerAddress) {
      buyerUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!buyerUser?.walletAddress) {
        throw new BadRequestException('Buyer wallet required');
      }
      buyerAddress = buyerUser.walletAddress;
    } else {
      buyerUser = await this.prisma.user.findUnique({
        where: { walletAddress: buyerAddress },
      });
      if (!buyerUser) {
        throw new NotFoundException('Buyer not found');
      }
    }
  
    // 🔑 MAP ZONAS
    const zoneMap = new Map(
      eventWithZones.zones.map(z => [z.name, z.id]),
    );
  
    // Idempotencia básica: evitar compras duplicadas simultáneas del mismo comprador para el mismo evento
    const recentPendingCount = await this.prisma.ticket.count({
      where: {
        eventId: event.id,
        ownerId: buyerUser.id,
        blockchainTicketId: { startsWith: 'pending-' },
        createdAt: { gte: new Date(Date.now() - 90 * 1000) },
      },
    });
    if (recentPendingCount > 0) {
      throw new BadRequestException('Ya hay una compra de tickets en proceso. Por favor espera unos segundos.');
    }

    
    // 🔥 CREAR TICKETS EN DB (PENDING) y preparar contadores por zona
    const requestId = randomUUID();
    const zoneCounter = new Map<string, number>();
    for (const zoneName of zones!) {
      const zoneId = zoneMap.get(zoneName)!;
      zoneCounter.set(zoneId, (zoneCounter.get(zoneId) || 0) + 1);
    }

    await this.prisma.$transaction(async tx => {
      // 1️⃣ Crear tickets
      await Promise.all(
        zones!.map(zoneName =>
          tx.ticket.create({
            data: {
              blockchainTicketId: `pending-${requestId}-${randomUUID()}`,
              eventId: event.id,
              zoneId: zoneMap.get(zoneName)!,
              ownerId: buyerUser.id,
              originalBuyerId: buyerUser.id,
              mintedAt: new Date(),
              status: TicketStatus.ACTIVE,
            },
          }),
        ),
      );

      // 2️⃣ Incrementar sold por zona
      for (const [zoneId, count] of zoneCounter.entries()) {
        await tx.eventZone.update({
          where: { id: zoneId },
          data: {
            sold: {
              increment: count,
            },
          },
        });
      }
    });
  

    if(!buyerAddress) {
      throw new BadRequestException('Buyer wallet required');
    }
    // ⛓️ MINT EN BLOCKCHAIN con rollback si falla
    let blockchainResult;
    try {
      blockchainResult = await this.blockchainActions.mintTickets(
        BigInt(event.blockchainEventId),
        buyerAddress,
        BigInt(amount),
        zones!,
      );
    } catch (chainError) {
      // Compensar: eliminar tickets pendientes creados y revertir sold por zona
      await this.prisma.$transaction(async tx => {
        await tx.ticket.deleteMany({
          where: {
            eventId: event.id,
            ownerId: buyerUser.id,
            blockchainTicketId: { startsWith: `pending-${requestId}-` },
          },
        });

        for (const [zoneId, count] of zoneCounter.entries()) {
          await tx.eventZone.update({
            where: { id: zoneId },
            data: {
              sold: {
                decrement: count,
              },
            },
          });
        }
      });
      throw chainError;
    }
  
    return {
      success: true,
      blockchainTxHash: blockchainResult.hash,
      blockHash: blockchainResult.blockHash,
    };
  }

  async getEventStats(eventId: string, userId?: string) {
    // Obtener evento CON zonas incluidas
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        zones: true, // ¡IMPORTANTE! Incluir las zonas
      },
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
  
    // Calcular ticketsTotal sumando las capacidades de todas las zonas
    const ticketsTotal = event.zones.reduce((total, zone) => {
      const capacity = typeof zone.capacity === 'bigint' ? zone.capacity : BigInt(zone.capacity);
      return total + capacity;
    }, BigInt(0));
  
    const ticketsMinted = BigInt(totalTickets);
    const ticketsRemaining = ticketsTotal - ticketsMinted; 
    const mintPercentage =
    ticketsTotal > 0n
      ? (Number(ticketsMinted) / Number(ticketsTotal)) * 100
      : 0;
  
    // También calcular estadísticas por zona
    const zoneStats = event.zones.map(zone => ({
      id: zone.id,
      name: zone.name,
      capacity: zone.capacity.toString(),
      sold: zone.sold.toString(),
      available: (BigInt(zone.capacity) - BigInt(zone.sold)).toString(),
      price: Number(zone.price),
      soldPercentage:
      Number(zone.capacity) > 0
        ? (Number(zone.sold) / Number(zone.capacity)) * 100
        : 0,
    }));
  
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
      // Nuevas estadísticas por zona
      zones: zoneStats,
      zoneCount: event.zones.length,
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
    const ticketsTotal = event.zones && Array.isArray(event.zones) ? event.zones.reduce((total, zone) => {
      return total + BigInt(zone.capacity);
    }, BigInt(0)) : BigInt(0);
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

  private buildTicketSignature(
    blockchainTicketId: string,
    eventSecret: string,
  ): string {
    return createHash('sha256')
      .update(`${blockchainTicketId}:${eventSecret}`)
      .digest('hex');
  }
  
  async getTicketsForSync(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        tickets: true,
      },
    });
  
    if (!event) {
      throw new NotFoundException('Event not found');
    }
  
    if (!event.metadataHash) {
      throw new BadRequestException('Event has no metadataHash');
    }
  
    return event.tickets.map(ticket => ({
      ticketId: ticket.blockchainTicketId,
      eventId: event.id,
      signature: this.buildTicketSignature(
        ticket.blockchainTicketId,
        event.metadataHash,
      ),
      status: ticket.status === TicketStatus.USED ? 'used' : 'unused',
    }));
  }
}

