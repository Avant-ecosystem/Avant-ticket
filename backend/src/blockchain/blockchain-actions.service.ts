// src/blockchain/blockchain-actions.service.ts
import { Injectable } from '@nestjs/common';
import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { BlockchainConnectionService } from './blockchain-connection.service';

// Define las interfaces que faltan en lib.ts
interface ResaleConfig {
  enabled: boolean;
  max_price: bigint | null;
  resale_start_time: bigint | null;
  resale_end_time: bigint | null;
}

interface CommissionConfig {
  seller_percentage: number;
  organizer_percentage: number;
  platform_percentage: number;
}

@Injectable()
export class BlockchainActionsService {
  constructor(
    private readonly connectionService: BlockchainConnectionService
  ) {}

  // ========== MÉTODOS DE EJECUCIÓN ==========

  private async executeTransaction(builder: any) {
    try {
      const sailsProgram = this.connectionService.getSailsProgram();
      
      // Verificar que el programId esté configurado
      try {
        sailsProgram.programId;
      } catch (error) {
        throw new Error('Program ID not set. Make sure CONTRACT_ADDRESS is configured in environment variables.');
      }
  
      const account = this.connectionService.getAccount();
      const txWithAccount = builder.withAccount(account);
      
      // Calcular gas automáticamente
      await txWithAccount.calculateGas();
      
      // Enviar transacción
      const { msgId, blockHash, txHash, response, isFinalized  } = await txWithAccount.signAndSend();
      
      // Log detallado
      console.log('=== Transaction Details ===');
      console.log('Transaction Hash (txHash):', txHash);
      console.log('Message ID (msgId):', msgId);
      console.log('Block Hash:', blockHash);
      console.log('Response function:', await response());
      console.log('Is Finalized promise:', typeof isFinalized);
      
      // Obtener la respuesta llamando a la función
      let responseData;
      try {
        responseData = await response();
        console.log('Response data:', responseData);
        
        // Si responseData es un objeto, mostrar sus propiedades
        if (responseData && typeof responseData === 'object') {
          console.log('Response properties:');
          for (const key in responseData) {
            if (Object.prototype.hasOwnProperty.call(responseData, key)) {
              const value = responseData[key];
              console.log(`  ${key}:`, value, `(type: ${typeof value})`);
              
              // Si el valor es un objeto complejo, mostrar más detalles
              if (value && typeof value === 'object') {
                try {
                  console.log(`  ${key} details:`, JSON.stringify(value, (k, v) => 
                    typeof v === 'bigint' ? v.toString() : v, 2));
                } catch (e) {
                  console.log(`  ${key} (could not stringify):`, value);
                }
              }
            }
          }
        }
      } catch (responseError) {
        console.error('Error getting response:', responseError);
        responseData = responseError;
      }
      
      // Esperar finalización (opcional, ya que response() podría ya estar finalizado)
      try {
        const finalized = await isFinalized;
        console.log('Transaction finalized:', finalized);
      } catch (finalizeError) {
        console.log('Finalization check error:', finalizeError);
      }
      
      return {
        hash: msgId,
        blockHash: blockHash,
        transactionHash: txHash,
        response: responseData
      };
      
    } catch (error) {
      console.error('Transaction execution error:', error);
      
      // Mostrar más detalles del error
      if (error.message) {
        console.error('Error message:', error.message);
      }
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  }

  // ========== ACCESO A SERVICIOS ==========

  get ticketService() {
    return this.connectionService.getSailsProgram().ticket;
  }

  get marketService() {
    return this.connectionService.getSailsProgram().market;
  }

  // ========== MÉTODOS DE TICKETS ==========

  async createEvent(
    organizer: string,
    metadataHash: `0x${string}`,
    eventStartTime: bigint,
    ticketsTotal: bigint,
    resaleConfig: ResaleConfig,
    commissionConfig: CommissionConfig
  ) {
    const organizerId = decodeAddress(organizer);
    const metadataArray = Array.from(Buffer.from(metadataHash.slice(2), 'hex'));
    
    const builder = this.ticketService.createEvent(
      organizerId,
      metadataArray,
      eventStartTime,
      ticketsTotal,
      resaleConfig,
      commissionConfig
    );
    
    return await this.executeTransaction(builder);
  }

  async mintTickets(
    eventId: bigint,
    buyer: string,
    amount: bigint,
    zones?: Array<string | null>
  ) {
    const buyerId = decodeAddress(buyer);
    const builder = this.ticketService.mintTickets(
      eventId,
      buyerId,
      amount,
      zones || []
    );
    
    return await this.executeTransaction(builder);
  }

  async markTicketUsed(ticketId: bigint) {
    const builder = this.ticketService.markTicketUsed(ticketId);
    return await this.executeTransaction(builder);
  }

  async setEventActive(eventId: bigint, active: boolean) {
    const builder = this.ticketService.setEventActive(eventId, active);
    return await this.executeTransaction(builder);
  }

  // ========== MÉTODOS DE MARKETPLACE ==========

  async listTicket(ticketId: bigint, price: bigint) {
    const builder = this.marketService.listTicket(ticketId, price);
    return await this.executeTransaction(builder);
  }

  async buyTicket(ticketId: bigint) {
    const builder = this.marketService.buyTicket(ticketId);
    return await this.executeTransaction(builder);
  }

  async cancelListing(ticketId: bigint) {
    const builder = this.marketService.cancelListing(ticketId);
    return await this.executeTransaction(builder);
  }

  // ========== MÉTODOS DE CONSULTA ==========

  async getEvent(eventId: bigint) {
    const query = this.ticketService.getEvent(eventId);
    return await query;
  }

  async getTicket(ticketId: bigint) {
    const query = this.ticketService.getTicket(ticketId);
    return await query;
  }

  async getUserTickets(userAddress: string) {
    const userId = decodeAddress(userAddress);
    const query = this.ticketService.getUserTickets(userId);
    return await query;
  }

  async getAllListings() {
    const query = this.marketService.getAllListings();
    return await query;
  }

  async getListing(ticketId: bigint) {
    const query = this.marketService.getListing(ticketId);
    return await query;
  }

  async isOrganizer(address: string): Promise<boolean> {
    const actorId = decodeAddress(address);
    const query = this.ticketService.isOrganizer(actorId);
    return await query;
  }

  async isScanner(address: string): Promise<boolean> {
    const actorId = decodeAddress(address);
    const query = this.ticketService.isScanner(actorId);
    return await query;
  }

  // ========== SUSCRIPCIONES ==========

  subscribeToTicketsMinted(callback: (data: any) => void) {
    return this.ticketService.subscribeToTicketsMintedEvent(callback);
  }

  subscribeToTicketUsed(callback: (data: any) => void) {
    return this.ticketService.subscribeToTicketUsedEvent(callback);
  }

  subscribeToTicketListed(callback: (data: any) => void) {
    return this.ticketService.subscribeToTicketListedEvent(callback);
  }

  subscribeToTicketSold(callback: (data: any) => void) {
    return this.ticketService.subscribeToTicketSoldEvent(callback);
  }

  // ========== UTILIDADES ==========

  hexToActorId(hexAddress: string): Uint8Array {
    return decodeAddress(hexAddress);
  }

  actorIdToHex(actorId: Uint8Array): string {
    return u8aToHex(actorId);
  }

  async getBalance(address?: string): Promise<string> {
    return await this.connectionService.getBalance(address);
  }

  getCurrentAccount() {
    const account = this.connectionService.getAccount();
    return {
      address: account.address,
      publicKey: u8aToHex(account.publicKey),
    };
  }
}