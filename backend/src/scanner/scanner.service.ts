import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QrService } from '../common/services/qr.service';
import { TicketsService } from '../tickets/tickets.service';
import { BlockchainActionsService } from '../blockchain/blockchain-actions.service';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private prisma: PrismaService,
    private qrService: QrService,
    private ticketsService: TicketsService,
    private blockchainActions: BlockchainActionsService,
  ) {}

  async scanTicket(qrData: string, scannerId: string) {
    try {
      const decoded = this.qrService.verifyQr(qrData);
      const ticket = await this.ticketsService.findByBlockchainId(decoded.ticketId);

      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }

      if (ticket.status === 'USED') {
        throw new BadRequestException('Ticket has already been used');
      }

      if (ticket.status === 'CANCELLED') {
        throw new BadRequestException('Ticket has been cancelled');
      }

      // El markAsUsed ya llama a blockchain internamente
      const updatedTicket = await this.ticketsService.markAsUsed(ticket.id);

      return {
        success: true,
        ticket: updatedTicket,
        scannedAt: new Date(),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid QR code');
    }
  }

  async getTicketByQr(qrData: string) {
    try {
      const decoded = this.qrService.verifyQr(qrData);
      return this.ticketsService.findByBlockchainId(decoded.ticketId);
    } catch {
      throw new BadRequestException('Invalid QR code');
    }
  }
}

