import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { PurchaseListingDto } from './dto/purchase-listing.dto';
import { ListingStatus } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { BlockchainActionsService } from '../blockchain/blockchain-actions.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private blockchainActions: BlockchainActionsService,
  ) {}

  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

  
    // ✅ FECHAS
    if (obj instanceof Date) {
      return obj.toISOString();
    }
  
    // ✅ BIGINT
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
  
    // ✅ ARRAYS
    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeBigInt(item));
    }

    if (obj.zone) {
      obj.zone = {
        id: obj.zone.id,
        name: obj.zone.name,
        price: obj.zone.price ? (typeof obj.zone.price === 'object' && 'toNumber' in obj.zone.price ? obj.zone.price.toNumber() : obj.zone.price) : 0,
        capacity: obj.zone.capacity?.toString() || '0',
        sold: obj.zone.sold?.toString() || '0',
      };
    }
  
    // ❌ PROMISES (seguridad)
    if (typeof obj === 'object' && typeof obj.then === 'function') {
      return obj;
    }
  
    // ✅ OBJETOS NORMALES
    if (typeof obj === 'object') {
      const transformed: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          transformed[key] = this.serializeBigInt(obj[key]);
        }
      }
      return transformed;
    }
  
    return obj;
  }
  
  async createListing(userId: string, createListingDto: CreateListingDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: createListingDto.ticketId },
      include: { event: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.ownerId !== userId) {
      throw new ForbiddenException('You can only list your own tickets');
    }

    if (ticket.status !== 'ACTIVE') {
      throw new BadRequestException('Ticket is not available for listing');
    }

    const event = await this.eventsService.findOne(ticket.eventId);
    if (!event.resaleEnabled) {
      throw new BadRequestException('Resale is not enabled for this event');
    }

    const now = new Date();
    if (event.resaleStartTime && now < event.resaleStartTime) {
      throw new BadRequestException('Resale window has not started');
    }

    if (event.resaleEndTime && now > event.resaleEndTime) {
      throw new BadRequestException('Resale window has ended');
    }

    if (event.maxResalePrice && BigInt(createListingDto.price) > event.maxResalePrice) {
      throw new BadRequestException('Price exceeds maximum resale price');
    }

    const existingListing = await this.prisma.marketplaceListing.findFirst({
      where: {
        ticketId: createListingDto.ticketId,
        status: 'ACTIVE',
      },
    });

    if (existingListing) {
      throw new BadRequestException('Ticket is already listed');
    }

    const seller = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (!seller.walletAddress) {
      throw new NotFoundException('Seller Wallet not found');
    }
    const sellerWallet = seller.walletAddress

    try {
      // Listar ticket en blockchain
      this.logger.log(`Listing ticket ${ticket.blockchainTicketId} on blockchain`);
      const blockchainResult = await this.blockchainActions.listTicket(
        sellerWallet,
        BigInt(ticket.blockchainTicketId),
        BigInt(createListingDto.price),
      );

      this.logger.log(`Ticket listed on blockchain: ${blockchainResult.hash}`);
      

      // Crear listing en DB (se sincronizará completamente cuando llegue el evento)
      const listing = await this.prisma.marketplaceListing.create({
        data: {
          ticketId: createListingDto.ticketId,
          sellerId: userId,
          price: BigInt(createListingDto.price),
          blockchainTxHash: blockchainResult.hash,
        },
        include: {
          ticket: {
            include: {
              event: true,
            },
          },
          seller: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
            },
          },
        },
      });
      return this.serializeBigInt(listing);
    } catch (error) {
      this.logger.error(`Error listing ticket:`, error);
      throw new BadRequestException(`Failed to list ticket on blockchain: ${error.message}`);
    }
  }

  async findAll(eventId?: string, pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
    };

    if (eventId) {
      where.ticket = {
        eventId,
      };
    }

    const [listings, total] = await Promise.all([
      this.prisma.marketplaceListing.findMany({
        skip,
        take: limit,
        where,
        include: {
          ticket: {
            include: {
              zone: true,
              event: true,
              owner: {
                select: {
                  username: true,
                },
              },
            },
          },
          seller: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          listedAt: 'desc',
        },
      }),
      this.prisma.marketplaceListing.count({ where }),
    ]);

    return {
      data: this.serializeBigInt(listings),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const listing = await this.prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        ticket: {
          include: {
            zone: true,
            event: true,
            owner: true,
          },
        },
        seller: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
          },
        },
        buyer: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.serializeBigInt(listing);
  }

  async purchaseListing(buyerId: string, purchaseListingDto: PurchaseListingDto) {
    const listing = await this.findOne(purchaseListingDto.listingId);

    if (listing.status !== 'ACTIVE') {
      throw new BadRequestException('Listing is not active');
    }

    if (listing.sellerId === buyerId) {
      throw new BadRequestException('You cannot purchase your own listing');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: listing.ticketId },
    });

    if (!ticket || ticket.ownerId !== listing.sellerId) {
      throw new BadRequestException('Ticket ownership has changed');
    }

    const event = await this.eventsService.findOne(ticket.eventId);
    const now = new Date();
    if (event.resaleStartTime && now < event.resaleStartTime) {
      throw new BadRequestException('Resale window has not started');
    }
    if (event.resaleEndTime && now > event.resaleEndTime) {
      throw new BadRequestException('Resale window has ended');
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }
    if (!buyer.walletAddress) {
      throw new NotFoundException('Buyer wallet not found');
    }
    const buyerWalletAddress = buyer.walletAddress
    try {
      // Comprar ticket en blockchain
      this.logger.log(`Purchasing ticket ${ticket.blockchainTicketId} from listing`);
      const blockchainResult = await this.blockchainActions.buyTicket(buyerWalletAddress,BigInt(ticket.blockchainTicketId));
      
      this.logger.log(`Ticket purchased on blockchain: ${blockchainResult.hash}`);

      // Actualizar en DB (se sincronizará completamente cuando llegue el evento)
      return this.prisma.$transaction(async (tx) => {
        const updatedListing = await tx.marketplaceListing.update({
          where: { id: listing.id },
          data: {
            status: ListingStatus.SOLD,
            buyerId,
            soldAt: new Date(),
            blockchainTxHash: blockchainResult.hash,
          },
        });

        await tx.ticket.update({
          where: { id: ticket.id },
          data: {
            ownerId: buyerId,
          },
        });

        return this.serializeBigInt(updatedListing);
      });
    } catch (error) {
      this.logger.error(`Error purchasing listing:`, error);
      throw new BadRequestException(`Failed to purchase ticket on blockchain: ${error.message}`);
    }
  }

  async cancelListing(listingId: string, userId: string) {
    const listing = await this.findOne(listingId);

    if (listing.sellerId !== userId) {
      throw new ForbiddenException('You can only cancel your own listings');
    }

    if (listing.status !== 'ACTIVE') {
      throw new BadRequestException('Only active listings can be cancelled');
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: listing.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    const owner = await this.prisma.user.findUnique({
      where: { id: ticket.ownerId },
    });
    if(!owner){
      throw new NotFoundException('Owner not found');
    }

    if(!owner.walletAddress){
      throw new NotFoundException('Owner not found');
    }
    const sellerWallet = owner.walletAddress
    try {
      // Cancelar listing en blockchain
      this.logger.log(`Cancelling listing for ticket ${ticket.blockchainTicketId}`);
    await this.blockchainActions.cancelListing(sellerWallet,BigInt(ticket.blockchainTicketId));

      // Actualizar en DB
      const updatedListing = await this.prisma.marketplaceListing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.CANCELLED,
        },
      });
      return this.serializeBigInt(updatedListing);
    } catch (error) {
      this.logger.error(`Error cancelling listing:`, error);
      throw new BadRequestException(`Failed to cancel listing on blockchain: ${error.message}`);
    }
  }
}

