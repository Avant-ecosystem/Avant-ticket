#![no_std]
#![allow(static_mut_refs)]
use core::fmt::Debug;
use gstd::{ext, format, msg};
use sails_rs::{
    collections::HashMap,
    prelude::*,
};

const ZERO_ID: ActorId = ActorId::zero();
const BASIS_POINTS: u16 = 10000; // Para porcentajes con precisión (100% = 10000)

/// Estructura principal de almacenamiento del Marketplace
#[derive(Default, Clone)]
pub struct Storage {
    // Administración
    admin: ActorId,
    platform_fee_recipient: ActorId,
    
    // Contrato de Tickets (fuente de verdad)
    ticket_contract_id: ActorId,
    
    // Listados activos: ticket_id -> Listing
    listings: HashMap<U256, Listing>,
    
    // Reentrancy guard
    locked: bool,
}

/// Información de un listado activo
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct Listing {
    pub ticket_id: U256,
    pub seller: ActorId,
    pub price: U256,
    pub listed_at: u64,
    pub event_id: U256, // Para validaciones rápidas
}

/// Información del ticket desde el contrato de Tickets
/// (Estructura simplificada para consultas)
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct TicketInfo {
    pub ticket_id: U256,
    pub event_id: U256,
    pub current_owner: ActorId,
    pub used: bool,
}

/// Información del evento desde el contrato de Tickets
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_codec)]
pub struct EventInfo {
    pub event_id: U256,
    pub organizer: ActorId,
    pub resale_enabled: bool,
    pub max_price: Option<U256>,
    pub resale_start_time: Option<u64>,
    pub resale_end_time: Option<u64>,
    pub seller_percentage: u16,
    pub organizer_percentage: u16,
    pub platform_percentage: u16,
}

/// Eventos emitidos por el Marketplace
#[event]
#[derive(Debug, Clone, Encode, Decode, TypeInfo, PartialEq, Eq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum Event {
    /// Ticket listado para reventa
    TicketListed {
        ticket_id: U256,
        event_id: U256,
        seller: ActorId,
        price: U256,
    },
    /// Ticket vendido
    TicketSold {
        ticket_id: U256,
        event_id: U256,
        seller: ActorId,
        buyer: ActorId,
        price: U256,
        seller_share: U256,
        organizer_share: U256,
        platform_share: U256,
    },
    /// Listado cancelado
    ListingCancelled {
        ticket_id: U256,
        event_id: U256,
        seller: ActorId,
    },
}

/// Errores del Marketplace
#[derive(Debug)]
pub enum MarketplaceError {
    Unauthorized,
    TicketNotFound,
    TicketAlreadyListed,
    ListingNotFound,
    TicketNotOwned,
    TicketAlreadyUsed,
    ResaleDisabled,
    PriceExceedsMaximum,
    ResaleWindowClosed,
    InvalidPrice,
    InvalidInput,
    ReentrancyDetected,
    PurchaseFailed,
    TransferFailed,
}

static mut STORAGE: Option<Storage> = None;

struct MarketplaceService(());

impl MarketplaceService {
    pub fn new() -> Self {
        Self(())
    }
    
    pub fn init(admin: ActorId, ticket_contract: ActorId, platform_fee_recipient: ActorId) -> Self {
        let storage = Storage {
            admin,
            ticket_contract_id: ticket_contract,
            platform_fee_recipient,
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
            panic(MarketplaceError::ReentrancyDetected);
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
            panic(MarketplaceError::Unauthorized);
        }
    }
    
    /// Obtiene información del ticket desde el contrato de Tickets
    /// Nota: Esta función debe implementarse según la interfaz real del contrato de Tickets
    async fn get_ticket_info(&self, ticket_id: U256) -> Option<TicketInfo> {
        let storage = self.get();
        // Aquí se haría una llamada al contrato de Tickets para obtener la información
        // Por ahora retornamos None como placeholder
        // En producción: msg::send_for_reply al ticket_contract_id con get_ticket()
        None
    }
    
    /// Obtiene información del evento desde el contrato de Tickets
    /// Nota: Esta función debe implementarse según la interfaz real del contrato de Tickets
    async fn get_event_info(&self, event_id: U256) -> Option<EventInfo> {
        let storage = self.get();
        // Aquí se haría una llamada al contrato de Tickets para obtener la información
        // Por ahora retornamos None como placeholder
        // En producción: msg::send_for_reply al ticket_contract_id con get_event()
        None
    }
    
    /// Valida que el ticket puede ser listado
    async fn validate_ticket_for_listing(&self, ticket_id: U256, seller: ActorId) -> Result<EventInfo, MarketplaceError> {
        // Obtener información del ticket
        let ticket_info = self.get_ticket_info(ticket_id).await;
        if ticket_info.is_none() {
            return Err(MarketplaceError::TicketNotFound);
        }
        let ticket_info = ticket_info.unwrap();
        
        // Validar que no esté usado
        if ticket_info.used {
            return Err(MarketplaceError::TicketAlreadyUsed);
        }
        
        // Validar propiedad
        if ticket_info.current_owner != seller {
            return Err(MarketplaceError::TicketNotOwned);
        }
        
        // Obtener información del evento
        let event_info = self.get_event_info(ticket_info.event_id).await;
        if event_info.is_none() {
            return Err(MarketplaceError::TicketNotFound);
        }
        let event_info = event_info.unwrap();
        
        // Validar que la reventa esté habilitada
        if !event_info.resale_enabled {
            return Err(MarketplaceError::ResaleDisabled);
        }
        
        // Validar ventana de tiempo (si aplica)
        let current_time = self.current_timestamp();
        if let Some(start_time) = event_info.resale_start_time {
            if current_time < start_time {
                return Err(MarketplaceError::ResaleWindowClosed);
            }
        }
        if let Some(end_time) = event_info.resale_end_time {
            if current_time > end_time {
                return Err(MarketplaceError::ResaleWindowClosed);
            }
        }
        
        Ok(event_info)
    }
    
    /// Transfiere el ticket usando el contrato de Tickets
    /// Nota: Esta función debe implementarse según la interfaz real del contrato de Tickets
    async fn transfer_ticket(&self, ticket_id: U256, buyer: ActorId, price: U256) -> Result<(), MarketplaceError> {
        let storage = self.get();
        // Aquí se haría una llamada al contrato de Tickets para transferir
        // En producción: msg::send_for_reply al ticket_contract_id con resell_ticket()
        // O con una función especial tipo transfer_from_marketplace() si existe
        Ok(())
    }
    
    /// Obtiene timestamp actual
    fn current_timestamp(&self) -> u64 {
        // Placeholder - implementar con API real de Vara
        0
    }
}

#[service(events = Event)]
impl MarketplaceService {
    /// Listar un ticket para reventa
    #[export]
    pub async fn list_ticket(&mut self, ticket_id: U256, price: U256) {
        self.non_reentrant();
        
        if price == U256::zero() {
            self.unlock();
            panic(MarketplaceError::InvalidPrice);
        }
        
        let seller = msg::source();
        if seller == ZERO_ID {
            self.unlock();
            panic(MarketplaceError::InvalidInput);
        }
        
        let storage = self.get_mut();
        
        // Validar que no esté ya listado
        if storage.listings.contains_key(&ticket_id) {
            self.unlock();
            panic(MarketplaceError::TicketAlreadyListed);
        }
        
        // Validar ticket y obtener info del evento
        let event_info = match self.validate_ticket_for_listing(ticket_id, seller).await {
            Ok(info) => info,
            Err(e) => {
                self.unlock();
                panic(e);
            }
        };
        
        // Validar precio máximo
        if let Some(max_price) = event_info.max_price {
            if price > max_price {
                self.unlock();
                panic(MarketplaceError::PriceExceedsMaximum);
            }
        }
        
        // Obtener información del ticket para el event_id
        let ticket_info = self.get_ticket_info(ticket_id).await;
        if ticket_info.is_none() {
            self.unlock();
            panic(MarketplaceError::TicketNotFound);
        }
        let ticket_info = ticket_info.unwrap();
        
        // Crear listado
        let listing = Listing {
            ticket_id,
            seller,
            price,
            listed_at: self.current_timestamp(),
            event_id: ticket_info.event_id,
        };
        
        storage.listings.insert(ticket_id, listing.clone());
        
        self.emit_event(Event::TicketListed {
            ticket_id,
            event_id: ticket_info.event_id,
            seller,
            price,
        })
        .expect("Failed to emit TicketListed");
        
        self.unlock();
    }
    
    /// Comprar un ticket listado
    #[export]
    pub async fn buy_ticket(&mut self, ticket_id: U256) {
        self.non_reentrant();
        
        let buyer = msg::source();
        if buyer == ZERO_ID {
            self.unlock();
            panic(MarketplaceError::InvalidInput);
        }
        
        let storage = self.get_mut();
        
        // Obtener listado
        let listing = storage.listings.get(&ticket_id);
        if listing.is_none() {
            self.unlock();
            panic(MarketplaceError::ListingNotFound);
        }
        let listing = listing.unwrap().clone();
        
        // Validar que el comprador no sea el vendedor
        if buyer == listing.seller {
            self.unlock();
            panic(MarketplaceError::InvalidInput);
        }
        
        // Validar que el ticket todavía es válido para venta
        let event_info = match self.validate_ticket_for_listing(ticket_id, listing.seller).await {
            Ok(info) => info,
            Err(e) => {
                self.unlock();
                panic(e);
            }
        };
        
        // Validar precio del listado vs precio máximo actual
        if let Some(max_price) = event_info.max_price {
            if listing.price > max_price {
                self.unlock();
                panic(MarketplaceError::PriceExceedsMaximum);
            }
        }
        
        // Remover listado antes de procesar (previene doble compra)
        storage.listings.remove(&ticket_id);
        
        // Calcular comisiones
        let seller_share = (listing.price.as_u128() * event_info.seller_percentage as u128) 
            / BASIS_POINTS as u128;
        let organizer_share = (listing.price.as_u128() * event_info.organizer_percentage as u128) 
            / BASIS_POINTS as u128;
        let platform_share = (listing.price.as_u128() * event_info.platform_percentage as u128) 
            / BASIS_POINTS as u128;
        
        // Validar que la suma sea correcta
        let total_distributed = seller_share + organizer_share + platform_share;
        let price_u128 = listing.price.as_u128();
        if total_distributed > price_u128 {
            self.unlock();
            panic(MarketplaceError::InvalidPrice);
        }
        
        // Transferir pagos
        // Nota: En producción, esto se haría con msg::send o similar
        // Asumimos que el comprador envía el pago antes o mediante un sistema de escrow
        
        // Transferir el ticket al comprador
        match self.transfer_ticket(ticket_id, buyer, listing.price).await {
            Ok(_) => {},
            Err(e) => {
                // Revertir: volver a agregar el listado
                storage.listings.insert(ticket_id, listing.clone());
                self.unlock();
                panic(e);
            }
        }
        
        self.emit_event(Event::TicketSold {
            ticket_id,
            event_id: listing.event_id,
            seller: listing.seller,
            buyer,
            price: listing.price,
            seller_share: U256::from(seller_share),
            organizer_share: U256::from(organizer_share),
            platform_share: U256::from(platform_share),
        })
        .expect("Failed to emit TicketSold");
        
        self.unlock();
    }
    
    /// Cancelar un listado activo
    #[export]
    pub fn cancel_listing(&mut self, ticket_id: U256) {
        let seller = msg::source();
        
        let storage = self.get_mut();
        
        // Obtener listado
        let listing = storage.listings.get(&ticket_id);
        if listing.is_none() {
            panic(MarketplaceError::ListingNotFound);
        }
        let listing = listing.unwrap();
        
        // Validar propiedad del listado
        if listing.seller != seller {
            panic(MarketplaceError::TicketNotOwned);
        }
        
        // Remover listado
        let event_id = listing.event_id;
        storage.listings.remove(&ticket_id);
        
        self.emit_event(Event::ListingCancelled {
            ticket_id,
            event_id,
            seller,
        })
        .expect("Failed to emit ListingCancelled");
    }
    
    /// Obtener información de un listado
    #[export]
    pub fn get_listing(&self, ticket_id: U256) -> Option<Listing> {
        self.get().listings.get(&ticket_id).cloned()
    }
    
    /// Obtener todos los listados activos
    #[export]
    pub fn get_all_listings(&self) -> Vec<Listing> {
        self.get().listings.values().cloned().collect()
    }
    
    /// Obtener listados de un vendedor
    #[export]
    pub fn get_seller_listings(&self, seller: ActorId) -> Vec<Listing> {
        self.get()
            .listings
            .values()
            .filter(|listing| listing.seller == seller)
            .cloned()
            .collect()
    }
    
    /// Obtener estado del contrato
    #[export]
    pub fn get_storage(&self) -> State {
        self.get().clone().into()
    }
    
    /// Configurar admin (solo admin actual)
    #[export]
    pub fn set_admin(&mut self, new_admin: ActorId) {
        self.require_admin();
        
        if new_admin == ZERO_ID {
            panic(MarketplaceError::InvalidInput);
        }
        
        let storage = self.get_mut();
        storage.admin = new_admin;
    }
    
    /// Configurar contrato de Tickets (solo admin)
    #[export]
    pub fn set_ticket_contract(&mut self, ticket_contract: ActorId) {
        self.require_admin();
        
        if ticket_contract == ZERO_ID {
            panic(MarketplaceError::InvalidInput);
        }
        
        let storage = self.get_mut();
        storage.ticket_contract_id = ticket_contract;
    }
    
    /// Configurar destinatario de comisiones de plataforma (solo admin)
    #[export]
    pub fn set_platform_fee_recipient(&mut self, recipient: ActorId) {
        self.require_admin();
        
        if recipient == ZERO_ID {
            panic(MarketplaceError::InvalidInput);
        }
        
        let storage = self.get_mut();
        storage.platform_fee_recipient = recipient;
    }
}

pub struct MarketplaceProgram(());

#[sails_rs::program]
impl MarketplaceProgram {
    #[allow(clippy::new_without_default)]
    pub fn new(admin: ActorId, ticket_contract: ActorId, platform_fee_recipient: ActorId) -> Self {
        MarketplaceService::init(admin, ticket_contract, platform_fee_recipient);
        Self(())
    }
    
    pub fn marketplace(&self) -> MarketplaceService {
        MarketplaceService::new()
    }
}

pub fn panic(err: impl Debug) -> ! {
    ext::panic(format!("{err:?}"))
}

/// Estado público del contrato para consultas
#[derive(Debug, Default, PartialEq, Eq, Encode, Decode, TypeInfo)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct State {
    pub admin: ActorId,
    pub platform_fee_recipient: ActorId,
    pub ticket_contract_id: ActorId,
    pub listings: Vec<(U256, Listing)>,
}

impl From<Storage> for State {
    fn from(value: Storage) -> Self {
        State {
            admin: value.admin,
            platform_fee_recipient: value.platform_fee_recipient,
            ticket_contract_id: value.ticket_contract_id,
            listings: value.listings.into_iter().collect(),
        }
    }
}

