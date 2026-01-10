/* eslint-disable */

import { GearApi, BaseGearProgram} from '@gear-js/api';
import { hexToString } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types';
import { TransactionBuilder, ActorId, QueryBuilder, getServiceNamePrefix, getFnNamePrefix, ZERO_ADDRESS } from 'sails-js';

export class SailsProgram {
  public readonly registry: TypeRegistry;
  public readonly ticket: Ticket;
  public readonly market: Market;
  private _program?: BaseGearProgram;

  constructor(public api: GearApi, programId?: `0x${string}`) {
    const types: Record<string, any> = {
      ResaleConfig: {"enabled":"bool","max_price":"Option<U256>","resale_start_time":"Option<u64>","resale_end_time":"Option<u64>"},
      CommissionConfig: {"seller_percentage":"u16","organizer_percentage":"u16","platform_percentage":"u16"},
      EventConfig: {"event_id":"U256","organizer":"[u8;32]","metadata_hash":"[u8; 32]","event_start_time":"u64","tickets_minted":"U256","tickets_total":"U256","resale_config":"ResaleConfig","commission_config":"CommissionConfig","active":"bool"},
      EventStats: {"event_id":"U256","tickets_total":"U256","tickets_minted":"U256","tickets_used":"u64","active":"bool"},
      State: {"admin":"[u8;32]","platform_fee_recipient":"[u8;32]","vmt_contract_id":"[u8;32]","event_id_counter":"U256","ticket_id_counter":"U256","events":"Vec<(U256, EventConfig)>","tickets":"Vec<(U256, Ticket)>","event_tickets":"Vec<(U256, Vec<U256>)>","organizers":"Vec<[u8;32]>","scanners":"Vec<[u8;32]>","listings":"Vec<(U256, Listing)>"},
      Ticket: {"ticket_id":"U256","event_id":"U256","zone":"Option<String>","original_buyer":"[u8;32]","current_owner":"[u8;32]","used":"bool","minted_at":"u64"},
      Listing: {"ticket_id":"U256","seller":"[u8;32]","price":"U256","listed_at":"u64","event_id":"U256"},
    }

    this.registry = new TypeRegistry();
    this.registry.setKnownTypes({ types });
    this.registry.register(types);
    if (programId) {
      this._program = new BaseGearProgram(programId, api);
    }

    this.ticket = new Ticket(this);
    this.market = new Market(this);
  }

  public get programId(): `0x${string}` {
    if (!this._program) throw new Error(`Program ID is not set`);
    return this._program.id;
  }

  newCtorFromCode(code: Uint8Array | Buffer | typeof hexToString, admin: ActorId, vmt_contract: ActorId, platform_fee_recipient: ActorId): TransactionBuilder<null> {
    const builder = new TransactionBuilder<null>(
      this.api,
      this.registry,
      'upload_program',
      null,
      'New',
      [admin, vmt_contract, platform_fee_recipient],
      '([u8;32], [u8;32], [u8;32])',
      'String',
      code,
      async (programId) =>  {
        this._program = await BaseGearProgram.new(programId, this.api);
      }
    );
    return builder;
  }

  newCtorFromCodeId(codeId: `0x${string}`, admin: ActorId, vmt_contract: ActorId, platform_fee_recipient: ActorId) {
    const builder = new TransactionBuilder<null>(
      this.api,
      this.registry,
      'create_program',
      null,
      'New',
      [admin, vmt_contract, platform_fee_recipient],
      '([u8;32], [u8;32], [u8;32])',
      'String',
      codeId,
      async (programId) =>  {
        this._program = await BaseGearProgram.new(programId, this.api);
      }
    );
    return builder;
  }
}

export class Ticket {
  constructor(private _program: SailsProgram) {}

  /**
   * Agregar organizador
   * Solo admin
  */
  public addOrganizer(organizer: ActorId): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'AddOrganizer',
      organizer,
      '[u8;32]',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Agregar escáner
   * Solo admin
  */
  public addScanner(scanner: ActorId): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'AddScanner',
      scanner,
      '[u8;32]',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Crear un nuevo evento
   * Solo admin u organizador autorizado
  */
  public createEvent(organizer: ActorId, metadata_hash: Array<number>, event_start_time: number | string | bigint, tickets_total: number | string | bigint, resale_config: ResaleConfig, commission_config: CommissionConfig): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'CreateEvent',
      [organizer, metadata_hash, event_start_time, tickets_total, resale_config, commission_config],
      '([u8;32], [u8; 32], u64, U256, ResaleConfig, CommissionConfig)',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Marcar un ticket como usado
   * Solo escáner autorizado o admin
  */
  public markTicketUsed(ticket_id: number | string | bigint): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'MarkTicketUsed',
      ticket_id,
      'U256',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Mintear tickets en venta primaria (batch minting)
   * Solo organizador del evento o admin
  */
  public mintTickets(event_id: number | string | bigint, buyer: ActorId, amount: number | string | bigint, zones: Array<string | null>): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'MintTickets',
      [event_id, buyer, amount, zones],
      '(U256, [u8;32], U256, Vec<Option<String>>)',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Remover organizador
   * Solo admin
  */
  public removeOrganizer(organizer: ActorId): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'RemoveOrganizer',
      organizer,
      '[u8;32]',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Remover escáner
   * Solo admin
  */
  public removeScanner(scanner: ActorId): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'RemoveScanner',
      scanner,
      '[u8;32]',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Revender un ticket
   * Solo el propietario actual puede revender
  */
  public resellTicket(ticket_id: number | string | bigint, buyer: ActorId, price: number | string | bigint): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'ResellTicket',
      [ticket_id, buyer, price],
      '(U256, [u8;32], U256)',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Desactivar/activar evento
   * Solo organizador del evento o admin
  */
  public setEventActive(event_id: number | string | bigint, active: boolean): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'SetEventActive',
      [event_id, active],
      '(U256, bool)',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Actualizar configuración de comisiones de un evento
   * Solo organizador del evento o admin
  */
  public updateCommissionConfig(event_id: number | string | bigint, commission_config: CommissionConfig): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'UpdateCommissionConfig',
      [event_id, commission_config],
      '(U256, CommissionConfig)',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Actualizar configuración de reventa de un evento
   * Solo organizador del evento o admin
  */
  public updateResaleConfig(event_id: number | string | bigint, resale_config: ResaleConfig): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Ticket',
      'UpdateResaleConfig',
      [event_id, resale_config],
      '(U256, ResaleConfig)',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Obtener configuración de un evento
  */
  public getEvent(event_id: number | string | bigint): QueryBuilder<EventConfig | null> {
    return new QueryBuilder<EventConfig | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Ticket',
      'GetEvent',
      event_id,
      'U256',
      'Option<EventConfig>',
    );
  }

  /**
   * Obtener estadísticas de un evento
  */
  public getEventStats(event_id: number | string | bigint): QueryBuilder<EventStats | null> {
    return new QueryBuilder<EventStats | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Ticket',
      'GetEventStats',
      event_id,
      'U256',
      'Option<EventStats>',
    );
  }

  /**
   * Obtener tickets de un evento
  */
  public getEventTickets(event_id: number | string | bigint): QueryBuilder<Array<number | string | bigint>> {
    return new QueryBuilder<Array<number | string | bigint>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Ticket',
      'GetEventTickets',
      event_id,
      'U256',
      'Vec<U256>',
    );
  }

  /**
   * Obtener estado completo del contrato
  */
  public getStorage(): QueryBuilder<State> {
    return new QueryBuilder<State>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Ticket',
      'GetStorage',
      null,
      null,
      'State',
    );
  }

  /**
   * Obtener información de un ticket
  */
  public getTicket(ticket_id: number | string | bigint): QueryBuilder<Ticket | null> {
    return new QueryBuilder<Ticket | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Ticket',
      'GetTicket',
      ticket_id,
      'U256',
      'Option<Ticket>',
    );
  }

  /**
   * Obtener tickets de un usuario
  */
  public getUserTickets(user: ActorId): QueryBuilder<Array<Ticket>> {
    return new QueryBuilder<Array<Ticket>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Ticket',
      'GetUserTickets',
      user,
      '[u8;32]',
      'Vec<Ticket>',
    );
  }

  /**
   * Verificar si una dirección es organizador
  */
  public isOrganizer(address: ActorId): QueryBuilder<boolean> {
    return new QueryBuilder<boolean>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Ticket',
      'IsOrganizer',
      address,
      '[u8;32]',
      'bool',
    );
  }

  /**
   * Verificar si una dirección es escáner
  */
  public isScanner(address: ActorId): QueryBuilder<boolean> {
    return new QueryBuilder<boolean>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Ticket',
      'IsScanner',
      address,
      '[u8;32]',
      'bool',
    );
  }

  /**
   * Evento creado
  */
  public subscribeToEventCreatedEvent(callback: (data: { event_id: number | string | bigint; organizer: ActorId; metadata_hash: Array<number>; event_start_time: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'EventCreated') {
        callback(this._program.registry.createType('(String, String, {"event_id":"U256","organizer":"[u8;32]","metadata_hash":"[u8; 32]","event_start_time":"u64"})', message.payload)[2].toJSON() as unknown as { event_id: number | string | bigint; organizer: ActorId; metadata_hash: Array<number>; event_start_time: number | string | bigint });
      }
    });
  }

  /**
   * Tickets minteados en venta primaria
  */
  public subscribeToTicketsMintedEvent(callback: (data: { event_id: number | string | bigint; ticket_ids: Array<number | string | bigint>; buyer: ActorId; amount: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'TicketsMinted') {
        callback(this._program.registry.createType('(String, String, {"event_id":"U256","ticket_ids":"Vec<U256>","buyer":"[u8;32]","amount":"U256"})', message.payload)[2].toJSON() as unknown as { event_id: number | string | bigint; ticket_ids: Array<number | string | bigint>; buyer: ActorId; amount: number | string | bigint });
      }
    });
  }

  /**
   * Ticket revendido
  */
  public subscribeToTicketResoldEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; buyer: ActorId; price: number | string | bigint; seller_share: number | string | bigint; organizer_share: number | string | bigint; platform_share: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'TicketResold') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","seller":"[u8;32]","buyer":"[u8;32]","price":"U256","seller_share":"U256","organizer_share":"U256","platform_share":"U256"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; buyer: ActorId; price: number | string | bigint; seller_share: number | string | bigint; organizer_share: number | string | bigint; platform_share: number | string | bigint });
      }
    });
  }

  /**
   * Ticket marcado como usado
  */
  public subscribeToTicketUsedEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; scanner: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'TicketUsed') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","scanner":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; scanner: ActorId });
      }
    });
  }

  /**
   * Organizador agregado
  */
  public subscribeToOrganizerAddedEvent(callback: (data: { organizer: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'OrganizerAdded') {
        callback(this._program.registry.createType('(String, String, {"organizer":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { organizer: ActorId });
      }
    });
  }

  /**
   * Organizador removido
  */
  public subscribeToOrganizerRemovedEvent(callback: (data: { organizer: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'OrganizerRemoved') {
        callback(this._program.registry.createType('(String, String, {"organizer":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { organizer: ActorId });
      }
    });
  }

  /**
   * Escáner agregado
  */
  public subscribeToScannerAddedEvent(callback: (data: { scanner: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'ScannerAdded') {
        callback(this._program.registry.createType('(String, String, {"scanner":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { scanner: ActorId });
      }
    });
  }

  /**
   * Escáner removido
  */
  public subscribeToScannerRemovedEvent(callback: (data: { scanner: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'ScannerRemoved') {
        callback(this._program.registry.createType('(String, String, {"scanner":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { scanner: ActorId });
      }
    });
  }

  /**
   * Configuración de evento actualizada
  */
  public subscribeToEventConfigUpdatedEvent(callback: (data: { event_id: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'EventConfigUpdated') {
        callback(this._program.registry.createType('(String, String, {"event_id":"U256"})', message.payload)[2].toJSON() as unknown as { event_id: number | string | bigint });
      }
    });
  }

  /**
   * Ticket listado en el Marketplace
  */
  public subscribeToTicketListedEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; price: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'TicketListed') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","seller":"[u8;32]","price":"U256"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; price: number | string | bigint });
      }
    });
  }

  /**
   * Ticket vendido desde el Marketplace
  */
  public subscribeToTicketSoldEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; buyer: ActorId; price: number | string | bigint; seller_share: number | string | bigint; organizer_share: number | string | bigint; platform_share: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'TicketSold') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","seller":"[u8;32]","buyer":"[u8;32]","price":"U256","seller_share":"U256","organizer_share":"U256","platform_share":"U256"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; buyer: ActorId; price: number | string | bigint; seller_share: number | string | bigint; organizer_share: number | string | bigint; platform_share: number | string | bigint });
      }
    });
  }

  /**
   * Listado cancelado
  */
  public subscribeToListingCancelledEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Ticket' && getFnNamePrefix(payload) === 'ListingCancelled') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","seller":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId });
      }
    });
  }
}

export class Market {
  constructor(private _program: SailsProgram) {}

  /**
   * Comprar un ticket listado en el Marketplace
  */
  public buyTicket(ticket_id: number | string | bigint): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Market',
      'BuyTicket',
      ticket_id,
      'U256',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Cancelar un listado activo
  */
  public cancelListing(ticket_id: number | string | bigint): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Market',
      'CancelListing',
      ticket_id,
      'U256',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Listar un ticket para reventa en el Marketplace
  */
  public listTicket(ticket_id: number | string | bigint, price: number | string | bigint): TransactionBuilder<null> {
    if (!this._program.programId) throw new Error('Program ID is not set');
    return new TransactionBuilder<null>(
      this._program.api,
      this._program.registry,
      'send_message',
      'Market',
      'ListTicket',
      [ticket_id, price],
      '(U256, U256)',
      'Null',
      this._program.programId,
    );
  }

  /**
   * Obtener todos los listados activos
  */
  public getAllListings(): QueryBuilder<Array<Listing>> {
    return new QueryBuilder<Array<Listing>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Market',
      'GetAllListings',
      null,
      null,
      'Vec<Listing>',
    );
  }

  /**
   * Obtener información de un listado
  */
  public getListing(ticket_id: number | string | bigint): QueryBuilder<Listing | null> {
    return new QueryBuilder<Listing | null>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Market',
      'GetListing',
      ticket_id,
      'U256',
      'Option<Listing>',
    );
  }

  /**
   * Obtener listados de un vendedor
  */
  public getSellerListings(seller: ActorId): QueryBuilder<Array<Listing>> {
    return new QueryBuilder<Array<Listing>>(
      this._program.api,
      this._program.registry,
      this._program.programId,
      'Market',
      'GetSellerListings',
      seller,
      '[u8;32]',
      'Vec<Listing>',
    );
  }

  /**
   * Evento creado
  */
  public subscribeToEventCreatedEvent(callback: (data: { event_id: number | string | bigint; organizer: ActorId; metadata_hash: Array<number>; event_start_time: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'EventCreated') {
        callback(this._program.registry.createType('(String, String, {"event_id":"U256","organizer":"[u8;32]","metadata_hash":"[u8; 32]","event_start_time":"u64"})', message.payload)[2].toJSON() as unknown as { event_id: number | string | bigint; organizer: ActorId; metadata_hash: Array<number>; event_start_time: number | string | bigint });
      }
    });
  }

  /**
   * Tickets minteados en venta primaria
  */
  public subscribeToTicketsMintedEvent(callback: (data: { event_id: number | string | bigint; ticket_ids: Array<number | string | bigint>; buyer: ActorId; amount: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'TicketsMinted') {
        callback(this._program.registry.createType('(String, String, {"event_id":"U256","ticket_ids":"Vec<U256>","buyer":"[u8;32]","amount":"U256"})', message.payload)[2].toJSON() as unknown as { event_id: number | string | bigint; ticket_ids: Array<number | string | bigint>; buyer: ActorId; amount: number | string | bigint });
      }
    });
  }

  /**
   * Ticket revendido
  */
  public subscribeToTicketResoldEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; buyer: ActorId; price: number | string | bigint; seller_share: number | string | bigint; organizer_share: number | string | bigint; platform_share: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'TicketResold') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","seller":"[u8;32]","buyer":"[u8;32]","price":"U256","seller_share":"U256","organizer_share":"U256","platform_share":"U256"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; buyer: ActorId; price: number | string | bigint; seller_share: number | string | bigint; organizer_share: number | string | bigint; platform_share: number | string | bigint });
      }
    });
  }

  /**
   * Ticket marcado como usado
  */
  public subscribeToTicketUsedEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; scanner: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'TicketUsed') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","scanner":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; scanner: ActorId });
      }
    });
  }

  /**
   * Organizador agregado
  */
  public subscribeToOrganizerAddedEvent(callback: (data: { organizer: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'OrganizerAdded') {
        callback(this._program.registry.createType('(String, String, {"organizer":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { organizer: ActorId });
      }
    });
  }

  /**
   * Organizador removido
  */
  public subscribeToOrganizerRemovedEvent(callback: (data: { organizer: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'OrganizerRemoved') {
        callback(this._program.registry.createType('(String, String, {"organizer":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { organizer: ActorId });
      }
    });
  }

  /**
   * Escáner agregado
  */
  public subscribeToScannerAddedEvent(callback: (data: { scanner: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'ScannerAdded') {
        callback(this._program.registry.createType('(String, String, {"scanner":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { scanner: ActorId });
      }
    });
  }

  /**
   * Escáner removido
  */
  public subscribeToScannerRemovedEvent(callback: (data: { scanner: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'ScannerRemoved') {
        callback(this._program.registry.createType('(String, String, {"scanner":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { scanner: ActorId });
      }
    });
  }

  /**
   * Configuración de evento actualizada
  */
  public subscribeToEventConfigUpdatedEvent(callback: (data: { event_id: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'EventConfigUpdated') {
        callback(this._program.registry.createType('(String, String, {"event_id":"U256"})', message.payload)[2].toJSON() as unknown as { event_id: number | string | bigint });
      }
    });
  }

  /**
   * Ticket listado en el Marketplace
  */
  public subscribeToTicketListedEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; price: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'TicketListed') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","seller":"[u8;32]","price":"U256"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; price: number | string | bigint });
      }
    });
  }

  /**
   * Ticket vendido desde el Marketplace
  */
  public subscribeToTicketSoldEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; buyer: ActorId; price: number | string | bigint; seller_share: number | string | bigint; organizer_share: number | string | bigint; platform_share: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'TicketSold') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","seller":"[u8;32]","buyer":"[u8;32]","price":"U256","seller_share":"U256","organizer_share":"U256","platform_share":"U256"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId; buyer: ActorId; price: number | string | bigint; seller_share: number | string | bigint; organizer_share: number | string | bigint; platform_share: number | string | bigint });
      }
    });
  }

  /**
   * Listado cancelado
  */
  public subscribeToListingCancelledEvent(callback: (data: { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {;
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();
      if (getServiceNamePrefix(payload) === 'Market' && getFnNamePrefix(payload) === 'ListingCancelled') {
        callback(this._program.registry.createType('(String, String, {"ticket_id":"U256","event_id":"U256","seller":"[u8;32]"})', message.payload)[2].toJSON() as unknown as { ticket_id: number | string | bigint; event_id: number | string | bigint; seller: ActorId });
      }
    });
  }
}