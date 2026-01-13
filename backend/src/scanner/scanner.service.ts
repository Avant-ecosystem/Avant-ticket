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

  private serializeTicket(ticket: any): any {
    if (!ticket) return ticket;
  
    
    // Usar una función recursiva
    const convertBigInts = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj;
      }
  
      // Si es un BigInt, convertirlo a string
      if (typeof obj === 'bigint') {
        console.log(`Converting BigInt: ${obj} to string`);
        return obj.toString();
      }
  
      // Si es un array, procesar cada elemento
      if (Array.isArray(obj)) {
        console.log('Processing array...');
        return obj.map(item => convertBigInts(item));
      }
  
      // Si es un objeto (pero no Date ni otros tipos especiales)
      if (typeof obj === 'object' && !(obj instanceof Date)) {
        console.log('Processing object...');
        const result: any = {};
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            console.log(`Checking key: ${key}`);
            result[key] = convertBigInts(obj[key]);
          }
        }
        return result;
      }
  
      // Para cualquier otro tipo, retornar tal cual
      return obj;
    };
  
    const serialized = convertBigInts(ticket);
    console.log('Serialization complete');
    return serialized;
  }

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

      
      const ticket = await this.ticketsService.findByBlockchainId(decoded.ticketId);

      
      // Verificar específicamente los valores BigInt
      if (ticket) {
        Object.keys(ticket).forEach(key => {
          console.log(`${key}: ${ticket[key]}, type: ${typeof ticket[key]}`);
        });

      }
      
      const serialized = this.serializeTicket(ticket);

      return serialized;
    } catch (error) {
      console.error('Error in getTicketByQr:', error);
      throw new BadRequestException('Invalid QR code');
    }
  }
}

