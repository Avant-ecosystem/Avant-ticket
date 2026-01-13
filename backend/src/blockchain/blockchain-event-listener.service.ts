import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BlockchainConnectionService } from './blockchain-connection.service';
import { BlockchainWorkerService } from './blockchain-worker.service';
import { PrismaService } from '../prisma/prisma.service';
import { encodeAddress } from '@polkadot/util-crypto';
import { hexToU8a } from '@polkadot/util';
@Injectable()
export class BlockchainEventListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BlockchainEventListenerService.name);
  private unsubscribeCallbacks: (() => void)[] = [];

  constructor(
    private connectionService: BlockchainConnectionService,
    private workerService: BlockchainWorkerService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Esperar un poco para que la conexión blockchain esté lista
    setTimeout(async () => {
      try {
        let retries = 0;
        const maxRetries = 10;
        
        while (!this.connectionService.isConnected() && retries < maxRetries) {
          this.logger.log(`Waiting for blockchain connection... (${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries++;
        }

        if (!this.connectionService.isConnected()) {
          this.logger.error('Blockchain not connected after retries, event listeners will not be initialized');
          return;
        }

        await this.subscribeToEvents();
        this.logger.log('Blockchain event listeners initialized');
      } catch (error) {
        this.logger.error('Failed to initialize event listeners:', error);
      }
    }, 10000); // Esperar 3 segundos después del init
  }

  private async subscribeToEvents() {
    try {
      const sailsProgram = this.connectionService.getSailsProgram();
      
      // Verificar que el programId esté configurado
      try {
        sailsProgram.programId;
      } catch (error) {
        this.logger.error('Program ID not set, cannot subscribe to events. Make sure CONTRACT_ADDRESS is configured.');
        return;
      }

      // Suscribirse a EventCreated
    const unsubEventCreated = await sailsProgram.ticket.subscribeToEventCreatedEvent(
      async (data) => {
        this.logger.log(`Event created on-chain: ${data.event_id}`);
        await this.handleEventCreated(data);
      },
    );
    this.unsubscribeCallbacks.push(unsubEventCreated);

    // Suscribirse a TicketsMinted
    const unsubTicketsMinted = await sailsProgram.ticket.subscribeToTicketsMintedEvent(
      async (data) => {
        this.logger.log(`Tickets minted on-chain: ${data.ticket_ids.length} tickets for event ${data.event_id}`);
        await this.handleTicketsMinted(data);
      },
    );
    this.unsubscribeCallbacks.push(unsubTicketsMinted);

    // Suscribirse a TicketResold
    const unsubTicketResold = await sailsProgram.ticket.subscribeToTicketResoldEvent(
      async (data) => {
        this.logger.log(`Ticket resold on-chain: ${data.ticket_id}`);
        await this.handleTicketResold(data);
      },
    );
    this.unsubscribeCallbacks.push(unsubTicketResold);

    // Suscribirse a TicketUsed
    const unsubTicketUsed = await sailsProgram.ticket.subscribeToTicketUsedEvent(
      async (data) => {
        this.logger.log(`Ticket used on-chain: ${data.ticket_id}`);
        await this.handleTicketUsed(data);
      },
    );
    this.unsubscribeCallbacks.push(unsubTicketUsed);

    // Suscribirse a TicketListed (Marketplace) - desde Ticket service
    const unsubTicketListed = await sailsProgram.ticket.subscribeToTicketListedEvent(
      async (data) => {
        this.logger.log(`Ticket listed on-chain: ${data.ticket_id}`);
        await this.handleTicketListed(data);
      },
    );
    this.unsubscribeCallbacks.push(unsubTicketListed);

    // Suscribirse a TicketSold (Marketplace) - ya manejado por TicketResold
    // Pero también escuchamos el evento específico del Market si existe

    // Suscribirse a ListingCancelled - desde Market service
    const unsubListingCancelled = await sailsProgram.market.subscribeToListingCancelledEvent(
      async (data) => {
        this.logger.log(`Listing cancelled on-chain: ${data.ticket_id}`);
        await this.handleListingCancelled(data);
      },
    );
    this.unsubscribeCallbacks.push(unsubListingCancelled);
    } catch (error) {
      this.logger.error('Error subscribing to events:', error);
      throw error;
    }
  }

  private async handleEventCreated(data: {
    event_id: number | string | bigint;
    organizer: Uint8Array;
    metadata_hash: Array<number>;
    event_start_time: number | string | bigint;
  }) {
    try {
      // Convertir ActorId (array de bytes) a dirección SS58 de Polkadot/Substrate
      // El ActorId es un [u8;32] que necesita ser convertido a formato SS58 para coincidir con walletAddress en DB
      const organizerWalletAddress = encodeAddress(data.organizer, 42); // 42 es el prefix de Polkadot/Substrate
      const metadataHashHex = '0x' + Buffer.from(data.metadata_hash).toString('hex');
      const eventIdStr = String(data.event_id);

      this.logger.log(`Handling blockchain event EventCreated for event_id: ${eventIdStr}`);
      this.logger.log(`Organizer Wallet Address (SS58): ${organizerWalletAddress}`);

      // NO consultar getEvent() inmediatamente porque puede fallar o no estar sincronizado
      // En su lugar, buscar el evento pendiente en la DB que fue creado con todos los datos
      // Si existe, usamos esos datos. Si no, usamos valores por defecto y se consultará después

      // Buscar evento pendiente en la DB por metadataHash y organizer (creado recientemente)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // Buscar por walletAddress en formato SS58 (que es como se guarda en la DB)
      const organizerUser = await this.prisma.user.findUnique({
        where: { walletAddress: organizerWalletAddress },
      });

      if (!organizerUser) {
        this.logger.warn(`Organizer with wallet address ${organizerWalletAddress} not found in database. Cannot sync blockchain event ${eventIdStr} without organizer.`);
        this.logger.warn(`If the event was created directly on blockchain, the organizer user must be created first.`);
        return;
      }

      // Buscar evento pendiente (evento de concierto) que coincida
      const pendingEvent = await this.prisma.event.findFirst({
        where: {
          blockchainEventId: { startsWith: 'pending-' },
          metadataHash: metadataHashHex,
          organizerId: organizerUser.id,
          createdAt: { gte: thirtyMinutesAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Si encontramos el evento pendiente, usar sus datos
      // Si no, usar valores por defecto (el evento se creará/actualizará con datos básicos)
      let ticketsTotal = '0';
      let resaleConfig = {
        enabled: false,
        maxPrice: undefined as string | undefined,
        resaleStartTime: undefined as number | undefined,
        resaleEndTime: undefined as number | undefined,
      };
      let commissionConfig = {
        sellerPercentage: 8500,
        organizerPercentage: 1000,
        platformPercentage: 500,
      };

      if (pendingEvent) {
        this.logger.log(`Found pending event ${pendingEvent.id} with all configuration data. Using those values.`);
        ticketsTotal = pendingEvent.ticketsTotal.toString();
        resaleConfig = {
          enabled: pendingEvent.resaleEnabled,
          maxPrice: pendingEvent.maxResalePrice ? pendingEvent.maxResalePrice.toString() : undefined,
          resaleStartTime: pendingEvent.resaleStartTime
            ? Math.floor(pendingEvent.resaleStartTime.getTime() / 1000)
            : undefined,
          resaleEndTime: pendingEvent.resaleEndTime
            ? Math.floor(pendingEvent.resaleEndTime.getTime() / 1000)
            : undefined,
        };
        commissionConfig = {
          sellerPercentage: pendingEvent.sellerPercentage,
          organizerPercentage: pendingEvent.organizerPercentage,
          platformPercentage: pendingEvent.platformPercentage,
        };
      } else {
        this.logger.warn(`No pending event found for blockchain event ${eventIdStr}. Using default values. Event will be created/updated with basic data.`);
      }

      // Construir syncData solo con los datos del evento blockchain + datos del evento pendiente (si existe)
      // Usar organizerWalletAddress (SS58) en lugar de organizerHex para que coincida con la DB
      const syncData = {
        eventId: eventIdStr,
        organizer: organizerWalletAddress,
        metadataHash: metadataHashHex,
        eventStartTime: Number(data.event_start_time),
        ticketsTotal,
        resaleConfig,
        commissionConfig,
      };

      await this.workerService.addSyncEventJob(syncData);
      this.logger.log(`Sync job queued for blockchain event ${eventIdStr}`);
    } catch (error) {
      this.logger.error(`Error handling EventCreated blockchain event:`, error);
    }
  }

  private async handleTicketsMinted(data: {
    event_id: number | string | bigint;
    ticket_ids: Array<number | string | bigint>;
    buyer: string; // ¡Esto es un string hexadecimal, no Uint8Array!
    amount: number | string | bigint;
  }) {
    try {
      this.logger.debug(`Received buyer hex: ${data.buyer}`);
      
      // Convertir el hexadecimal a Uint8Array
      let buyerWalletAddress: string | null = null;
      
      if (data.buyer && data.buyer.startsWith('0x')) {
        try {
          const buyerBytes = hexToU8a(data.buyer);
          buyerWalletAddress = encodeAddress(buyerBytes, 42);
          this.logger.debug(`Converted buyer address: ${buyerWalletAddress}`);
        } catch (error) {
          this.logger.error(`Failed to convert buyer hex to address: ${error.message}`);
        }
      } else {
        this.logger.warn(`Invalid buyer format: ${data.buyer}`);
      }
  
      if (!buyerWalletAddress) {
        this.logger.warn(`Could not decode buyer address for event ${data.event_id}`);
      }
  
      // Para cada ticket, obtener sus datos y sincronizar
      for (const ticketId of data.ticket_ids) {
        const ticketData = await this.connectionService.getSailsProgram().ticket.getTicket(ticketId);
        if (!ticketData) {
          this.logger.warn(`Ticket ${ticketId} not found after minting`);
          continue;
        }
  
        // Función helper para convertir direcciones
        const convertHexAddress = (hexAddress: string): string | null => {
          if (!hexAddress || !hexAddress.startsWith('0x')) {
            return null;
          }
          try {
            const bytes = hexToU8a(hexAddress);
            return encodeAddress(bytes, 42);
          } catch (error) {
            this.logger.warn(`Failed to convert hex address ${hexAddress}: ${error.message}`);
            return null;
          }
        };
  
        // Asumiendo que ticketData.original_buyer y current_owner también son hexadecimales
        const originalBuyerAddress = convertHexAddress(ticketData.original_buyer);
        const currentOwnerAddress = convertHexAddress(ticketData.current_owner);
  
        // Log para debugging
        this.logger.debug(`Ticket ${ticketId} - Original buyer hex: ${ticketData.original_buyer}`);
        this.logger.debug(`Ticket ${ticketId} - Current owner hex: ${ticketData.current_owner}`);
  
        // Verificar si los datos del ticket tienen direcciones válidas
        // Si no, usar la dirección del evento como fallback
        const finalOriginalBuyer = originalBuyerAddress || buyerWalletAddress;
        const finalCurrentOwner = currentOwnerAddress || buyerWalletAddress;
  
        if (!finalOriginalBuyer || !finalCurrentOwner) {
          this.logger.warn(`No valid addresses for ticket ${ticketId}, skipping...`);
          continue;
        }
  
        const syncData = {
          ticketId: String(ticketId),
          eventId: String(data.event_id),
          originalBuyer: finalOriginalBuyer,
          currentOwner: finalCurrentOwner,
          zone: ticketData.zone || undefined,
          used: ticketData.used,
          mintedAt: Number(ticketData.minted_at),
        };
  
        this.logger.debug(`Syncing ticket ${ticketId} with data:`, syncData);
        await this.workerService.addSyncTicketJob(syncData);
      }
    } catch (error) {
      this.logger.error(`Error handling TicketsMinted:`, error);
      this.logger.error(`Error context: ${JSON.stringify({
        event_id: data.event_id,
        ticket_ids: data.ticket_ids,
        buyer: data.buyer,
        buyer_type: typeof data.buyer,
        amount: data.amount
      })}`);
    }
  }
  

  private async handleTicketResold(data: {
    ticket_id: number | string | bigint;
    event_id: number | string | bigint;
    seller: Uint8Array;
    buyer: Uint8Array;
    price: number | string | bigint;
    seller_share: number | string | bigint;
    organizer_share: number | string | bigint;
    platform_share: number | string | bigint;
  }) {
    try {
      // Convertir ActorId a direcciones SS58
      const sellerWalletAddress = encodeAddress(data.seller, 42);
      const buyerWalletAddress = encodeAddress(data.buyer, 42);

      await this.workerService.addSyncResaleJob({
        ticketId: String(data.ticket_id),
        seller: sellerWalletAddress,
        buyer: buyerWalletAddress,
        price: String(data.price),
      });
    } catch (error) {
      this.logger.error(`Error handling TicketResold:`, error);
    }
  }

  private async handleTicketUsed(data: {
    ticket_id: number | string | bigint;
    event_id: number | string | bigint;
    scanner: Uint8Array;
  }) {
    try {
      const ticketData = await this.connectionService.getSailsProgram().ticket.getTicket(data.ticket_id);
      if (!ticketData) {
        this.logger.warn(`Ticket ${data.ticket_id} not found`);
        return;
      }
  
      // Función segura para convertir direcciones
      const safeEncodeAddress = (address: Uint8Array): string | null => {
        try {
          if (!address || address.length === 0) {
            return null;
          }
          return encodeAddress(address, 42);
        } catch (error) {
          this.logger.warn(`Failed to encode address: ${error.message}`);
          return null;
        }
      };
  
      const syncData = {
        ticketId: String(data.ticket_id),
        eventId: String(data.event_id),
        originalBuyer: safeEncodeAddress(ticketData.original_buyer),
        currentOwner: safeEncodeAddress(ticketData.current_owner),
        zone: ticketData.zone || undefined,
        used: true,
        mintedAt: Number(ticketData.minted_at),
      };
  
      await this.workerService.addSyncTicketJob(syncData);
    } catch (error) {
      this.logger.error(`Error handling TicketUsed:`, error);
    }
  }

  private async handleTicketListed(data: {
    ticket_id: number | string | bigint;
    event_id: number | string | bigint;
    seller: Uint8Array;
    price: number | string | bigint;
  }) {
    // Este evento solo notifica, no requiere sincronización específica
    // El listing se maneja en el marketplace service
    this.logger.debug(`Ticket ${data.ticket_id} listed at price ${data.price}`);
  }

  private async handleTicketSold(data: {
    ticket_id: number | string | bigint;
    event_id: number | string | bigint;
    seller: Uint8Array;
    buyer: Uint8Array;
    price: number | string | bigint;
    seller_share: number | string | bigint;
    organizer_share: number | string | bigint;
    platform_share: number | string | bigint;
  }) {
    try {
      // Convertir ActorId a direcciones SS58
      const sellerWalletAddress = encodeAddress(data.seller, 42);
      const buyerWalletAddress = encodeAddress(data.buyer, 42);

      await this.workerService.addSyncResaleJob({
        ticketId: String(data.ticket_id),
        seller: sellerWalletAddress,
        buyer: buyerWalletAddress,
        price: String(data.price),
      });
    } catch (error) {
      this.logger.error(`Error handling TicketSold:`, error);
    }
  }

  private async handleListingCancelled(data: {
    ticket_id: number | string | bigint;
    event_id: number | string | bigint;
    seller: Uint8Array;
  }) {
    // Este evento solo notifica, el listing se cancela en el marketplace service
    this.logger.debug(`Listing cancelled for ticket ${data.ticket_id}`);
  }

  async onModuleDestroy() {
    try {
      for (const unsubscribe of this.unsubscribeCallbacks) {
        unsubscribe();
      }
      this.unsubscribeCallbacks = [];
      this.logger.log('Blockchain event listeners stopped');
    } catch (error) {
      this.logger.error('Error stopping event listeners:', error);
    }
  }
}

