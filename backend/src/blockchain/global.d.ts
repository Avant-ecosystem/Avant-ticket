import { ActorId } from 'sails-js';

declare global {
  /**
   * Configuración de reventa
  */
  export interface ResaleConfig {
    enabled: boolean;
    max_price: number | string | bigint | null;
    resale_start_time: number | string | bigint | null;
    resale_end_time: number | string | bigint | null;
  }

  /**
   * Configuración de comisiones
  */
  export interface CommissionConfig {
    seller_percentage: number;
    organizer_percentage: number;
    platform_percentage: number;
  }

  /**
   * Configuración de un evento
  */
  export interface EventConfig {
    event_id: number | string | bigint;
    organizer: ActorId;
    metadata_hash: Array<number>;
    event_start_time: number | string | bigint;
    tickets_minted: number | string | bigint;
    tickets_total: number | string | bigint;
    resale_config: ResaleConfig;
    commission_config: CommissionConfig;
    active: boolean;
  }

  /**
   * Estadísticas de un evento
  */
  export interface EventStats {
    event_id: number | string | bigint;
    tickets_total: number | string | bigint;
    tickets_minted: number | string | bigint;
    tickets_used: number | string | bigint;
    active: boolean;
  }

  /**
   * Estado público del contrato para consultas
  */
  export interface State {
    admin: ActorId;
    platform_fee_recipient: ActorId;
    vmt_contract_id: ActorId;
    event_id_counter: number | string | bigint;
    ticket_id_counter: number | string | bigint;
    events: Array<[number | string | bigint, EventConfig]>;
    tickets: Array<[number | string | bigint, Ticket]>;
    event_tickets: Array<[number | string | bigint, Array<number | string | bigint>]>;
    organizers: Array<ActorId>;
    scanners: Array<ActorId>;
    listings: Array<[number | string | bigint, Listing]>;
  }

  /**
   * Estructura de un ticket NFT
  */
  export interface Ticket {
    ticket_id: number | string | bigint;
    event_id: number | string | bigint;
    zone: string | null;
    original_buyer: ActorId;
    current_owner: ActorId;
    used: boolean;
    minted_at: number | string | bigint;
  }

  /**
   * Información de un listado activo en el Marketplace
  */
  export interface Listing {
    ticket_id: number | string | bigint;
    seller: ActorId;
    price: number | string | bigint;
    listed_at: number | string | bigint;
    event_id: number | string | bigint;
  }
};