#![no_std]
#![allow(static_mut_refs)]
use core::fmt::Debug;
use extended_vmt_client::vmt::io as vmt_io;
use gstd::{ext, format, msg};
use sails_rs::{
    collections::{HashMap, HashSet},
    prelude::*,
};

const ZERO_ID: ActorId = ActorId::zero();
const NFT_COUNT: U256 = U256::one();
const BASIS_POINTS: u16 = 10000; // Para porcentajes con precisión (100% = 10000)

/// Estructura principal de almacenamiento del contrato
#[derive(Default, Clone)]
pub struct Storage {
    // Administración
    admin: ActorId,
    platform_fee_recipient: ActorId, // Dirección que recibe comisiones de plataforma
    
    // Contrato VMT para NFTs
    vmt_contract_id: ActorId,
    
    // Contadores
    event_id_counter: U256,
    ticket_id_counter: U256,
    
    // Mapeos principales
    events: HashMap<U256, EventConfig>, // event_id -> EventConfig
    tickets: HashMap<U256, Ticket>, // ticket_id -> Ticket
    event_tickets: HashMap<U256, Vec<U256>>, // event_id -> [ticket_id]
    
    // Roles
    organizers: HashSet<ActorId>, // Organizadores autorizados
    scanners: HashSet<ActorId>, // Escáneres autorizados para marcar tickets como usados
    
    // Reentrancy guard
    locked: bool,
}

/// Configuración de un evento
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct EventConfig {
    pub event_id: U256,
    pub organizer: ActorId,
    pub metadata_hash: [u8; 32], // Hash de metadata off-chain
    pub event_start_time: u64, // Timestamp de inicio del evento
    pub tickets_minted: U256,
    pub tickets_total: U256,
    pub resale_config: ResaleConfig,
    pub commission_config: CommissionConfig,
    pub active: bool, // Si el evento está activo
}

/// Configuración de reventa
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct ResaleConfig {
    pub enabled: bool, // Si la reventa está habilitada
    pub max_price: Option<U256>, // Precio máximo permitido (None = sin límite)
    pub resale_start_time: Option<u64>, // Inicio de ventana de reventa (None = inmediato)
    pub resale_end_time: Option<u64>, // Fin de ventana de reventa (None = sin límite)
}

/// Configuración de comisiones
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct CommissionConfig {
    pub seller_percentage: u16, // Porcentaje para el vendedor (en basis points)
    pub organizer_percentage: u16, // Porcentaje para el organizador
    pub platform_percentage: u16, // Porcentaje para la plataforma
    // La suma debe ser 10000 (100%)
}

/// Estructura de un ticket NFT
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct Ticket {
    pub ticket_id: U256,
    pub event_id: U256,
    pub zone: Option<String>, // Zona/asiento opcional
    pub original_buyer: ActorId, // Comprador original
    pub current_owner: ActorId, // Propietario actual
    pub used: bool, // Si el ticket ha sido usado
    pub minted_at: u64, // Timestamp de creación
}

/// Eventos emitidos por el contrato
#[event]
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum Event {
    /// Evento creado
    EventCreated {
        event_id: U256,
        organizer: ActorId,
        metadata_hash: [u8; 32],
        event_start_time: u64,
    },
    /// Tickets minteados en venta primaria
    TicketsMinted {
        event_id: U256,
        ticket_ids: Vec<U256>,
        buyer: ActorId,
        amount: U256,
    },
    /// Ticket revendido
    TicketResold {
        ticket_id: U256,
        event_id: U256,
        seller: ActorId,
        buyer: ActorId,
        price: U256,
        seller_share: U256,
        organizer_share: U256,
        platform_share: U256,
    },
    /// Ticket marcado como usado
    TicketUsed {
        ticket_id: U256,
        event_id: U256,
        scanner: ActorId,
    },
    /// Organizador agregado
    OrganizerAdded {
        organizer: ActorId,
    },
    /// Organizador removido
    OrganizerRemoved {
        organizer: ActorId,
    },
    /// Escáner agregado
    ScannerAdded {
        scanner: ActorId,
    },
    /// Escáner removido
    ScannerRemoved {
        scanner: ActorId,
    },
    /// Configuración de evento actualizada
    EventConfigUpdated {
        event_id: U256,
    },
}

/// Errores del contrato
#[derive(Debug)]
pub enum TicketError {
    Unauthorized,
    EventNotFound,
    TicketNotFound,
    TicketAlreadyUsed,
    TicketNotOwned,
    InvalidResaleConfig,
    InvalidCommissionConfig,
    ResaleDisabled,
    ResaleWindowClosed,
    PriceExceedsMaximum,
    InvalidAmount,
    ReentrancyDetected,
    InvalidInput,
    NotEnoughTickets,
    EventNotActive,
    TransferBlocked,
}

static mut STORAGE: Option<Storage> = None;

struct TicketService(());

impl TicketService {
    pub fn new() -> Self {
        Self(())
    }
    
    pub fn init(admin: ActorId, vmt_contract: ActorId, platform_fee_recipient: ActorId) -> Self {
        let storage = Storage {
            admin,
            platform_fee_recipient,
            vmt_contract_id: vmt_contract,
            ..Default::default()
        };
        unsafe { STORAGE = Some(storage) };
        Self(())
    }
    
    pub fn get_mut(&mut self) -> &'static mut Storage {
        unsafe { STORAGE.as_mut().expect("Storage is not initialized") }
    }
    
    pub fn get(&self) -> &'static Storage {
        unsafe { STORAGE.as_ref().expect("Storage is not initialized") }
    }
    
    /// Guard contra reentrancy
    fn non_reentrant(&mut self) {
        let storage = self.get_mut();
        if storage.locked {
            panic(TicketError::ReentrancyDetected);
        }
        storage.locked = true;
    }
    
    fn unlock(&mut self) {
        let storage = self.get_mut();
        storage.locked = false;
    }
    
    /// Valida que el caller sea admin
    fn require_admin(&self) {
        let storage = self.get();
        if msg::source() != storage.admin {
            panic(TicketError::Unauthorized);
        }
    }
    
    /// Valida que el caller sea organizador o admin
    fn require_organizer(&self) {
        let storage = self.get();
        let caller = msg::source();
        if caller != storage.admin && !storage.organizers.contains(&caller) {
            panic(TicketError::Unauthorized);
        }
    }
    
    /// Valida que el caller sea escáner o admin
    fn require_scanner(&self) {
        let storage = self.get();
        let caller = msg::source();
        if caller != storage.admin && !storage.scanners.contains(&caller) {
            panic(TicketError::Unauthorized);
        }
    }
    
    /// Valida configuración de comisiones
    fn validate_commission_config(config: &CommissionConfig) {
        let total = config.seller_percentage 
            + config.organizer_percentage 
            + config.platform_percentage;
        if total != BASIS_POINTS {
            panic(TicketError::InvalidCommissionConfig);
        }
    }
    
    /// Valida configuración de reventa
    fn validate_resale_config(config: &ResaleConfig) {
        if let (Some(start), Some(end)) = (config.resale_start_time, config.resale_end_time) {
            if start >= end {
                panic(TicketError::InvalidResaleConfig);
            }
        }
    }
    
    /// Obtiene timestamp actual
    fn current_timestamp(&self) -> u64 {
        // En Vara Network, usar el bloque timestamp
        // Nota: Ajustar según la API real de Vara Network cuando esté disponible
        // Por ahora usamos un valor basado en el bloque actual
        // En producción, usar: exec::block_timestamp() o la API equivalente de Vara
        0 // Placeholder - debe implementarse con la API real de Vara
    }
}

#[service(events = Event)]
impl TicketService {
    /// Crear un nuevo evento
    /// Solo admin u organizador autorizado
    #[export]
    pub fn create_event(
        &mut self,
        organizer: ActorId,
        metadata_hash: [u8; 32],
        event_start_time: u64,
        tickets_total: U256,
        resale_config: ResaleConfig,
        commission_config: CommissionConfig,
    ) {
        self.require_organizer();
        
        if organizer == ZERO_ID {
            panic(TicketError::InvalidInput);
        }
        
        if tickets_total == U256::zero() {
            panic(TicketError::InvalidAmount);
        }
        
        TicketService::validate_resale_config(&resale_config);
        TicketService::validate_commission_config(&commission_config);
        
        let storage = self.get_mut();
        storage.event_id_counter += U256::one();
        let event_id = storage.event_id_counter;
        
        let event_config = EventConfig {
            event_id,
            organizer,
            metadata_hash,
            event_start_time,
            tickets_minted: U256::zero(),
            tickets_total,
            resale_config,
            commission_config,
            active: true,
        };
        
        storage.events.insert(event_id, event_config.clone());
        storage.event_tickets.insert(event_id, Vec::new());
        
        // Si el organizador no está en la lista, agregarlo
        storage.organizers.insert(organizer);
        
        self.emit_event(Event::EventCreated {
            event_id,
            organizer,
            metadata_hash,
            event_start_time,
        })
        .expect("Failed to emit EventCreated");
    }
    
    /// Mintear tickets en venta primaria (batch minting)
    /// Solo organizador del evento o admin
    #[export]
    pub async fn mint_tickets(
        &mut self,
        event_id: U256,
        buyer: ActorId,
        amount: U256,
        zones: Vec<Option<String>>, // Zonas opcionales para cada ticket
    ) {
        self.non_reentrant();
        
        if buyer == ZERO_ID {
            self.unlock();
            panic(TicketError::InvalidInput);
        }
        
        if amount == U256::zero() {
            self.unlock();
            panic(TicketError::InvalidAmount);
        }
        
        let storage = self.get_mut();
        
        let event_config = storage.events.get_mut(&event_id);
        if event_config.is_none() {
            self.unlock();
            panic(TicketError::EventNotFound);
        }
        let event_config = event_config.unwrap();
        
        // Validar permisos
        let caller = msg::source();
        if caller != storage.admin && caller != event_config.organizer {
            self.unlock();
            panic(TicketError::Unauthorized);
        }
        
        if !event_config.active {
            self.unlock();
            panic(TicketError::EventNotActive);
        }
        
        // Validar disponibilidad
        let available = event_config.tickets_total - event_config.tickets_minted;
        if amount > available {
            self.unlock();
            panic(TicketError::NotEnoughTickets);
        }
        
        // Validar que las zonas coincidan con la cantidad
        if !zones.is_empty() && U256::from(zones.len()) != amount {
            self.unlock();
            panic(TicketError::InvalidInput);
        }
        
        // Crear tickets
        let mut ticket_ids = Vec::new();
        let mut zones_iter = zones.into_iter();
        
        for _ in 0..amount.as_u64() {
            storage.ticket_id_counter += U256::one();
            let ticket_id = storage.ticket_id_counter;
            
            let zone = zones_iter.next().flatten();
            let current_time = self.current_timestamp();
            
            let ticket = Ticket {
                ticket_id,
                event_id,
                zone,
                original_buyer: buyer,
                current_owner: buyer,
                used: false,
                minted_at: current_time,
            };
            
            storage.tickets.insert(ticket_id, ticket);
            ticket_ids.push(ticket_id);
            
            // Agregar a la lista de tickets del evento
            storage.event_tickets
                .get_mut(&event_id)
                .unwrap()
                .push(ticket_id);
        }
        
        // Actualizar contador de tickets minteados
        event_config.tickets_minted += amount;
        
        // Mintear NFTs usando VMT
        // Crear metadata para cada ticket
        let mut token_ids = Vec::new();
        let mut amounts = Vec::new();
        let mut metadata_vec = Vec::new();
        
        for ticket_id in &ticket_ids {
            token_ids.push(*ticket_id);
            amounts.push(NFT_COUNT);
            
            // Crear metadata básica para el ticket
            // En producción, esto puede incluir más información
            metadata_vec.push(None::<extended_vmt_client::TokenMetadata>);
        }
        
        // Llamar al contrato VMT para mintear los NFTs
        let mint_request = vmt_io::MintBatch::encode_call(buyer, token_ids, amounts, metadata_vec);
        msg::send_bytes_for_reply(storage.vmt_contract_id, mint_request, 0, 5_000_000_000)
            .expect("Error sending mint request to VMT contract")
            .await
            .expect("Error minting tickets from VMT contract");
        
        self.emit_event(Event::TicketsMinted {
            event_id,
            ticket_ids: ticket_ids.clone(),
            buyer,
            amount,
        })
        .expect("Failed to emit TicketsMinted");
        
        self.unlock();
    }
    
    /// Revender un ticket
    /// Solo el propietario actual puede revender
    #[export]
    pub async fn resell_ticket(
        &mut self,
        ticket_id: U256,
        buyer: ActorId,
        price: U256,
    ) {
        self.non_reentrant();
        
        if buyer == ZERO_ID {
            self.unlock();
            panic(TicketError::InvalidInput);
        }
        
        if price == U256::zero() {
            self.unlock();
            panic(TicketError::InvalidAmount);
        }
        
        let storage = self.get_mut();
        
        let ticket = storage.tickets.get_mut(&ticket_id);
        if ticket.is_none() {
            self.unlock();
            panic(TicketError::TicketNotFound);
        }
        let ticket = ticket.unwrap();
        
        // Validar que el ticket no esté usado
        if ticket.used {
            self.unlock();
            panic(TicketError::TicketAlreadyUsed);
        }
        
        // Validar propiedad
        if ticket.current_owner != msg::source() {
            self.unlock();
            panic(TicketError::TicketNotOwned);
        }
        
        // Validar que no se transfiera a sí mismo
        if buyer == ticket.current_owner {
            self.unlock();
            panic(TicketError::InvalidInput);
        }
        
        let event_config = storage.events.get(&ticket.event_id);
        if event_config.is_none() {
            self.unlock();
            panic(TicketError::EventNotFound);
        }
        let event_config = event_config.unwrap();
        
        // Validar que la reventa esté habilitada
        if !event_config.resale_config.enabled {
            self.unlock();
            panic(TicketError::ResaleDisabled);
        }
        
        // Validar precio máximo
        if let Some(max_price) = event_config.resale_config.max_price {
            if price > max_price {
                self.unlock();
                panic(TicketError::PriceExceedsMaximum);
            }
        }
        
        // Validar ventana de tiempo
        let current_time = self.current_timestamp();
        if let Some(start_time) = event_config.resale_config.resale_start_time {
            if current_time < start_time {
                self.unlock();
                panic(TicketError::ResaleWindowClosed);
            }
        }
        if let Some(end_time) = event_config.resale_config.resale_end_time {
            if current_time > end_time {
                self.unlock();
                panic(TicketError::ResaleWindowClosed);
            }
        }
        
        // Calcular comisiones
        let seller_share = (price.as_u128() * event_config.commission_config.seller_percentage as u128) 
            / BASIS_POINTS as u128;
        let organizer_share = (price.as_u128() * event_config.commission_config.organizer_percentage as u128) 
            / BASIS_POINTS as u128;
        let platform_share = (price.as_u128() * event_config.commission_config.platform_percentage as u128) 
            / BASIS_POINTS as u128;
        
        // Validar que la suma sea correcta (puede haber diferencias por redondeo)
        let total_distributed = seller_share + organizer_share + platform_share;
        let price_u128 = price.as_u128();
        if total_distributed > price_u128 {
            self.unlock();
            panic(TicketError::InvalidCommissionConfig);
        }
        
        // Transferir el NFT del vendedor al comprador usando VMT
        let transfer_request = vmt_io::TransferFrom::encode_call(
            ticket.current_owner,
            buyer,
            ticket_id,
            NFT_COUNT,
        );
        msg::send_bytes_for_reply(storage.vmt_contract_id, transfer_request, 0, 5_000_000_000)
            .expect("Error sending transfer request to VMT contract")
            .await
            .expect("Error transferring ticket NFT");
        
        // Transferir pagos
        // Nota: En Vara Network, el pago se maneja fuera del contrato o mediante un sistema de tokens
        // El comprador debe enviar el pago antes de llamar a esta función, o usar un sistema de escrow
        // Por ahora, asumimos que el pago se maneja externamente
        
        // Actualizar propietario del ticket
        let seller = ticket.current_owner;
        let event_id = ticket.event_id;
        ticket.current_owner = buyer;
        
        self.emit_event(Event::TicketResold {
            ticket_id,
            event_id,
            seller,
            buyer,
            price,
            seller_share: U256::from(seller_share),
            organizer_share: U256::from(organizer_share),
            platform_share: U256::from(platform_share),
        })
        .expect("Failed to emit TicketResold");
        
        self.unlock();
    }
    
    /// Marcar un ticket como usado
    /// Solo escáner autorizado o admin
    #[export]
    pub fn mark_ticket_used(&mut self, ticket_id: U256) {
        self.require_scanner();
        
        let storage = self.get_mut();
        
        let ticket = storage.tickets.get_mut(&ticket_id);
        if ticket.is_none() {
            panic(TicketError::TicketNotFound);
        }
        let ticket = ticket.unwrap();
        
        if ticket.used {
            panic(TicketError::TicketAlreadyUsed);
        }
        
        ticket.used = true;
        
        self.emit_event(Event::TicketUsed {
            ticket_id,
            event_id: ticket.event_id,
            scanner: msg::source(),
        })
        .expect("Failed to emit TicketUsed");
    }
    
    /// Agregar organizador
    /// Solo admin
    #[export]
    pub fn add_organizer(&mut self, organizer: ActorId) {
        self.require_admin();
        
        if organizer == ZERO_ID {
            panic(TicketError::InvalidInput);
        }
        
        let storage = self.get_mut();
        storage.organizers.insert(organizer);
        
        self.emit_event(Event::OrganizerAdded { organizer })
            .expect("Failed to emit OrganizerAdded");
    }
    
    /// Remover organizador
    /// Solo admin
    #[export]
    pub fn remove_organizer(&mut self, organizer: ActorId) {
        self.require_admin();
        
        let storage = self.get_mut();
        storage.organizers.remove(&organizer);
        
        self.emit_event(Event::OrganizerRemoved { organizer })
            .expect("Failed to emit OrganizerRemoved");
    }
    
    /// Agregar escáner
    /// Solo admin
    #[export]
    pub fn add_scanner(&mut self, scanner: ActorId) {
        self.require_admin();
        
        if scanner == ZERO_ID {
            panic(TicketError::InvalidInput);
        }
        
        let storage = self.get_mut();
        storage.scanners.insert(scanner);
        
        self.emit_event(Event::ScannerAdded { scanner })
            .expect("Failed to emit ScannerAdded");
    }
    
    /// Remover escáner
    /// Solo admin
    #[export]
    pub fn remove_scanner(&mut self, scanner: ActorId) {
        self.require_admin();
        
        let storage = self.get_mut();
        storage.scanners.remove(&scanner);
        
        self.emit_event(Event::ScannerRemoved { scanner })
            .expect("Failed to emit ScannerRemoved");
    }
    
    /// Actualizar configuración de reventa de un evento
    /// Solo organizador del evento o admin
    #[export]
    pub fn update_resale_config(
        &mut self,
        event_id: U256,
        resale_config: ResaleConfig,
    ) {
        self.require_organizer();
        
        TicketService::validate_resale_config(&resale_config);
        
        let storage = self.get_mut();
        
        let event_config = storage.events.get_mut(&event_id);
        if event_config.is_none() {
            panic(TicketError::EventNotFound);
        }
        let event_config = event_config.unwrap();
        
        // Validar permisos
        let caller = msg::source();
        if caller != storage.admin && caller != event_config.organizer {
            panic(TicketError::Unauthorized);
        }
        
        event_config.resale_config = resale_config;
        
        self.emit_event(Event::EventConfigUpdated { event_id })
            .expect("Failed to emit EventConfigUpdated");
    }
    
    /// Actualizar configuración de comisiones de un evento
    /// Solo organizador del evento o admin
    #[export]
    pub fn update_commission_config(
        &mut self,
        event_id: U256,
        commission_config: CommissionConfig,
    ) {
        self.require_organizer();
        
        TicketService::validate_commission_config(&commission_config);
        
        let storage = self.get_mut();
        
        let event_config = storage.events.get_mut(&event_id);
        if event_config.is_none() {
            panic(TicketError::EventNotFound);
        }
        let event_config = event_config.unwrap();
        
        // Validar permisos
        let caller = msg::source();
        if caller != storage.admin && caller != event_config.organizer {
            panic(TicketError::Unauthorized);
        }
        
        event_config.commission_config = commission_config;
        
        self.emit_event(Event::EventConfigUpdated { event_id })
            .expect("Failed to emit EventConfigUpdated");
    }
    
    /// Desactivar/activar evento
    /// Solo organizador del evento o admin
    #[export]
    pub fn set_event_active(&mut self, event_id: U256, active: bool) {
        self.require_organizer();
        
        let storage = self.get_mut();
        
        let event_config = storage.events.get_mut(&event_id);
        if event_config.is_none() {
            panic(TicketError::EventNotFound);
        }
        let event_config = event_config.unwrap();
        
        // Validar permisos
        let caller = msg::source();
        if caller != storage.admin && caller != event_config.organizer {
            panic(TicketError::Unauthorized);
        }
        
        event_config.active = active;
        
        self.emit_event(Event::EventConfigUpdated { event_id })
            .expect("Failed to emit EventConfigUpdated");
    }
    
    /// Obtener información de un ticket
    #[export]
    pub fn get_ticket(&self, ticket_id: U256) -> Option<Ticket> {
        self.get().tickets.get(&ticket_id).cloned()
    }
    
    /// Obtener configuración de un evento
    #[export]
    pub fn get_event(&self, event_id: U256) -> Option<EventConfig> {
        self.get().events.get(&event_id).cloned()
    }
    
    /// Obtener tickets de un evento
    #[export]
    pub fn get_event_tickets(&self, event_id: U256) -> Vec<U256> {
        self.get()
            .event_tickets
            .get(&event_id)
            .cloned()
            .unwrap_or_default()
    }
    
    /// Obtener tickets de un usuario
    #[export]
    pub fn get_user_tickets(&self, user: ActorId) -> Vec<Ticket> {
        self.get()
            .tickets
            .iter()
            .filter(|(_, ticket)| ticket.current_owner == user)
            .map(|(_, ticket)| ticket.clone())
            .collect()
    }
    
    /// Verificar si una dirección es organizador
    #[export]
    pub fn is_organizer(&self, address: ActorId) -> bool {
        let storage = self.get();
        storage.organizers.contains(&address) || address == storage.admin
    }
    
    /// Verificar si una dirección es escáner
    #[export]
    pub fn is_scanner(&self, address: ActorId) -> bool {
        let storage = self.get();
        storage.scanners.contains(&address) || address == storage.admin
    }
    
    /// Obtener estadísticas de un evento
    #[export]
    pub fn get_event_stats(&self, event_id: U256) -> Option<EventStats> {
        let storage = self.get();
        let event_config = storage.events.get(&event_id)?;
        let tickets = storage.event_tickets.get(&event_id)?;
        
        let used_tickets = tickets.iter()
            .filter_map(|tid| storage.tickets.get(tid))
            .filter(|t| t.used)
            .count();
        
        Some(EventStats {
            event_id,
            tickets_total: event_config.tickets_total,
            tickets_minted: event_config.tickets_minted,
            tickets_used: used_tickets as u64,
            active: event_config.active,
        })
    }
    
    /// Obtener estado completo del contrato
    #[export]
    pub fn get_storage(&self) -> State {
        self.get().clone().into()
    }
}

pub struct TicketProgram(());

#[sails_rs::program]
impl TicketProgram {
    #[allow(clippy::new_without_default)]
    pub fn new(admin: ActorId, vmt_contract: ActorId, platform_fee_recipient: ActorId) -> Self {
        TicketService::init(admin, vmt_contract, platform_fee_recipient);
        Self(())
    }
    
    pub fn ticket(&self) -> TicketService {
        TicketService::new()
    }
}

pub fn panic(err: impl Debug) -> ! {
    ext::panic(format!("{err:?}"))
}

/// Estadísticas de un evento
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct EventStats {
    pub event_id: U256,
    pub tickets_total: U256,
    pub tickets_minted: U256,
    pub tickets_used: u64,
    pub active: bool,
}

/// Estado público del contrato para consultas
#[derive(Debug, Default, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct State {
    pub admin: ActorId,
    pub platform_fee_recipient: ActorId,
    pub vmt_contract_id: ActorId,
    pub event_id_counter: U256,
    pub ticket_id_counter: U256,
    pub events: Vec<(U256, EventConfig)>,
    pub tickets: Vec<(U256, Ticket)>,
    pub event_tickets: Vec<(U256, Vec<U256>)>,
    pub organizers: Vec<ActorId>,
    pub scanners: Vec<ActorId>,
}

impl From<Storage> for State {
    fn from(value: Storage) -> Self {
        State {
            admin: value.admin,
            platform_fee_recipient: value.platform_fee_recipient,
            vmt_contract_id: value.vmt_contract_id,
            event_id_counter: value.event_id_counter,
            ticket_id_counter: value.ticket_id_counter,
            events: value.events.into_iter().collect(),
            tickets: value.tickets.into_iter().collect(),
            event_tickets: value.event_tickets.into_iter().collect(),
            organizers: value.organizers.into_iter().collect(),
            scanners: value.scanners.into_iter().collect(),
        }
    }
}
