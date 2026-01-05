#![allow(static_mut_refs)]

use gstd::exec;
use sails_rs::{
    calls::{Call, Query},
    gstd::msg,
    prelude::*,
};

use crate::{
    clients::extended_vnft_client::{traits::Vnft, TokenMetadata},
    states::ticket_state::{
        CommissionConfig, Event, ResaleConfig, Ticket, TicketState,
    },
};

/// Estado global del contrato de ticketing
static mut TICKET_STATE: Option<TicketState> = None;

/// Servicio del contrato de ticketing
pub struct TicketService<VnftClient> {
    pub vnft_client: VnftClient,
}

#[service]
impl<VnftClient> TicketService<VnftClient>
where
    VnftClient: Vnft,
{
    /// Inicializa el estado del contrato con un admin
    pub fn seed(admin: ActorId) {
        unsafe {
            TICKET_STATE = Some(TicketState::new(admin));
        };
    }

    /// Inicializa el estado del contrato con admin y contrato NFT
    pub fn seed_with_vnft(admin: ActorId, vnft_contract_id: ActorId) {
        unsafe {
            TICKET_STATE = Some(TicketState::new_with_vnft(admin, vnft_contract_id));
        };
    }

    /// Crea una nueva instancia del servicio
    pub fn new(vnft_client: VnftClient) -> Self {
        Self { vnft_client }
    }

    // ==================== ROLES Y PERMISOS ====================

    /// Agrega un nuevo admin de plataforma
    /// Solo los admins pueden agregar otros admins
    pub fn add_platform_admin(&mut self, new_admin: ActorId) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        if !state.is_platform_admin(&caller) {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        if state.platform_admins.contains(&new_admin) {
            return TicketEvents::Error(TicketErrors::AlreadyAdmin);
        }

        state.platform_admins.push(new_admin);
        TicketEvents::PlatformAdminAdded(new_admin)
    }

    /// Agrega un escáner autorizado
    /// Solo admins de plataforma pueden agregar escáneres
    pub fn add_authorized_scanner(&mut self, scanner: ActorId) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        if !state.is_platform_admin(&caller) {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        if state.authorized_scanners.contains(&scanner) {
            return TicketEvents::Error(TicketErrors::AlreadyAuthorized);
        }

        state.authorized_scanners.push(scanner);
        TicketEvents::AuthorizedScannerAdded(scanner)
    }

    /// Configura el contrato NFT
    /// Solo admins de plataforma pueden configurarlo
    pub fn set_vnft_contract(&mut self, vnft_contract_id: ActorId) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        if !state.is_platform_admin(&caller) {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        state.vnft_contract_id = Some(vnft_contract_id);
        TicketEvents::VnftContractSet(vnft_contract_id)
    }

    // ==================== GESTIÓN DE EVENTOS ====================

    /// Crea un nuevo evento
    /// Solo admins de plataforma o el organizador pueden crear eventos
    pub fn create_event(
        &mut self,
        organizer: ActorId,
        metadata_hash: [u8; 32],
        event_start: u64,
        resale_config: ResaleConfig,
        commission_config: CommissionConfig,
    ) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        // Solo admins o el mismo organizador pueden crear eventos
        if !state.is_platform_admin(&caller) && caller != organizer {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        // Validar configuración de comisiones
        if !commission_config.validate() {
            return TicketEvents::Error(TicketErrors::InvalidCommissionConfig);
        }

        let event_id = state.generate_event_id();
        let current_time = exec::block_timestamp();

        if event_start <= current_time {
            return TicketEvents::Error(TicketErrors::InvalidEventStart);
        }

        let event = Event {
            event_id,
            organizer,
            metadata_hash,
            event_start,
            resale_config,
            commission_config,
            active: true,
        };

        state.events.insert(event_id, event);

        TicketEvents::EventCreated(event_id)
    }

    /// Actualiza la configuración de reventa de un evento
    /// Solo el organizador o admins pueden actualizar
    pub fn update_resale_config(
        &mut self,
        event_id: u64,
        resale_config: ResaleConfig,
    ) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        let Some(event) = state.get_event_mut(event_id) else {
            return TicketEvents::Error(TicketErrors::EventNotFound);
        };

        if !state.is_platform_admin(&caller) && event.organizer != caller {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        event.resale_config = resale_config;
        TicketEvents::ResaleConfigUpdated(event_id)
    }

    /// Actualiza la configuración de comisiones de un evento
    /// Solo el organizador o admins pueden actualizar
    pub fn update_commission_config(
        &mut self,
        event_id: u64,
        commission_config: CommissionConfig,
    ) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        let Some(event) = state.get_event_mut(event_id) else {
            return TicketEvents::Error(TicketErrors::EventNotFound);
        };

        if !state.is_platform_admin(&caller) && event.organizer != caller {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        if !commission_config.validate() {
            return TicketEvents::Error(TicketErrors::InvalidCommissionConfig);
        }

        event.commission_config = commission_config;
        TicketEvents::CommissionConfigUpdated(event_id)
    }

    /// Desactiva un evento
    /// Solo el organizador o admins pueden desactivar
    pub fn deactivate_event(&mut self, event_id: u64) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        let Some(event) = state.get_event_mut(event_id) else {
            return TicketEvents::Error(TicketErrors::EventNotFound);
        };

        if !state.is_platform_admin(&caller) && event.organizer != caller {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        event.active = false;
        TicketEvents::EventDeactivated(event_id)
    }

    // ==================== VENTA PRIMARIA (MINTING) ====================

    /// Mintea un ticket individual
    /// Solo el organizador o admins pueden mintear
    pub async fn mint_ticket(
        &mut self,
        event_id: u64,
        to: ActorId,
        zone_seat: Option<String>,
        token_metadata: TokenMetadata,
    ) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        let Some(event) = state.get_event(event_id).cloned() else {
            return TicketEvents::Error(TicketErrors::EventNotFound);
        };

        if !event.active {
            return TicketEvents::Error(TicketErrors::EventInactive);
        }

        if !state.is_platform_admin(&caller) && event.organizer != caller {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        let Some(vnft_contract_id) = state.vnft_contract_id else {
            return TicketEvents::Error(TicketErrors::VnftContractNotSet);
        };

        let ticket_id = state.generate_ticket_id();
        let current_time = exec::block_timestamp();

        // Mintear el NFT
        let mint_result = self
            .vnft_client
            .mint(to, token_metadata)
            .send_recv(vnft_contract_id)
            .await;

        if let Err(error) = mint_result {
            return TicketEvents::Error(TicketErrors::MintFailed(error.to_string()));
        }

        // Crear el ticket en el estado
        let ticket = Ticket {
            ticket_id,
            event_id,
            zone_seat,
            original_buyer: to,
            used: false,
            minted_at: current_time,
        };

        state.tickets.insert(ticket_id, ticket);
        state.add_ticket_to_event(event_id, ticket_id);
        state.add_ticket_to_user(to, ticket_id);

        TicketEvents::TicketMinted {
            ticket_id,
            event_id,
            owner: to,
        }
    }

    /// Mintea múltiples tickets en batch
    /// Solo el organizador o admins pueden mintear
    pub async fn batch_mint_tickets(
        &mut self,
        event_id: u64,
        recipients: Vec<(ActorId, Option<String>, TokenMetadata)>,
    ) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        let Some(event) = state.get_event(event_id).cloned() else {
            return TicketEvents::Error(TicketErrors::EventNotFound);
        };

        if !event.active {
            return TicketEvents::Error(TicketErrors::EventInactive);
        }

        if !state.is_platform_admin(&caller) && event.organizer != caller {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        let Some(vnft_contract_id) = state.vnft_contract_id else {
            return TicketEvents::Error(TicketErrors::VnftContractNotSet);
        };

        let current_time = exec::block_timestamp();
        let mut minted_tickets = Vec::new();

        for (to, zone_seat, token_metadata) in recipients {
            let ticket_id = state.generate_ticket_id();

            // Mintear el NFT
            let mint_result = self
                .vnft_client
                .mint(to, token_metadata)
                .send_recv(vnft_contract_id)
                .await;

            if let Err(error) = mint_result {
                return TicketEvents::Error(TicketErrors::MintFailed(error.to_string()));
            }

            // Crear el ticket en el estado
            let ticket = Ticket {
                ticket_id,
                event_id,
                zone_seat,
                original_buyer: to,
                used: false,
                minted_at: current_time,
            };

            state.tickets.insert(ticket_id, ticket);
            state.add_ticket_to_event(event_id, ticket_id);
            state.add_ticket_to_user(to, ticket_id);

            minted_tickets.push((ticket_id, to));
        }

        TicketEvents::TicketsBatchMinted {
            event_id,
            count: minted_tickets.len() as u32,
            tickets: minted_tickets,
        }
    }

    // ==================== REVENTA CONTROLADA ====================

    /// Lista un ticket para reventa
    /// Solo el dueño actual puede listar su ticket
    pub fn list_ticket_for_resale(
        &mut self,
        ticket_id: U256,
        price: u128,
    ) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        let Some(ticket) = state.get_ticket(&ticket_id).cloned() else {
            return TicketEvents::Error(TicketErrors::TicketNotFound);
        };

        if ticket.used {
            return TicketEvents::Error(TicketErrors::TicketAlreadyUsed);
        }

        // Verificar que el caller es el dueño del NFT
        // Esto se verifica en la función de compra mediante approval

        let Some(event) = state.get_event(ticket.event_id) else {
            return TicketEvents::Error(TicketErrors::EventNotFound);
        };

        let current_time = exec::block_timestamp();

        if !event.resale_config.is_resale_allowed(current_time, price) {
            return TicketEvents::Error(TicketErrors::ResaleNotAllowed);
        }

        TicketEvents::TicketListedForResale {
            ticket_id,
            price,
            seller: caller,
        }
    }

    /// Compra un ticket en reventa
    /// El comprador debe enviar el pago junto con la transacción
    pub async fn buy_resale_ticket(
        &mut self,
        ticket_id: U256,
        price: u128,
    ) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();
        let value = msg::value();

        // Verificar que el pago es correcto
        if value < price {
            return TicketEvents::Error(TicketErrors::InsufficientPayment);
        }

        let Some(ticket) = state.get_ticket(&ticket_id).cloned() else {
            return TicketEvents::Error(TicketErrors::TicketNotFound);
        };

        if ticket.used {
            return TicketEvents::Error(TicketErrors::TicketAlreadyUsed);
        }

        let Some(event) = state.get_event(ticket.event_id).cloned() else {
            return TicketEvents::Error(TicketErrors::EventNotFound);
        };

        let current_time = exec::block_timestamp();

        if !event.resale_config.is_resale_allowed(current_time, price) {
            return TicketEvents::Error(TicketErrors::ResaleNotAllowed);
        }

        let Some(vnft_contract_id) = state.vnft_contract_id else {
            return TicketEvents::Error(TicketErrors::VnftContractNotSet);
        };

        // Verificar que el contrato tiene approval para transferir el NFT
        let approved = self
            .vnft_client
            .get_approved(ticket_id)
            .recv(vnft_contract_id)
            .await;

        let approved_address = match approved {
            Ok(addr) => addr,
            Err(_) => return TicketEvents::Error(TicketErrors::ContractNotApproved),
        };

        if approved_address != exec::program_id() {
            return TicketEvents::Error(TicketErrors::ContractNotApproved);
        }

        // Obtener el dueño actual del NFT
        let owner_result = self
            .vnft_client
            .owner_of(ticket_id)
            .recv(vnft_contract_id)
            .await;

        let seller = match owner_result {
            Ok(owner) => owner,
            Err(_) => return TicketEvents::Error(TicketErrors::FailedToGetOwner),
        };

        if seller == caller {
            return TicketEvents::Error(TicketErrors::CannotBuyOwnTicket);
        }

        // Transferir el NFT
        let transfer_result = self
            .vnft_client
            .transfer_from(seller, caller, ticket_id)
            .send_recv(vnft_contract_id)
            .await;

        if let Err(error) = transfer_result {
            return TicketEvents::Error(TicketErrors::TransferFailed(error.to_string()));
        }

        // Calcular comisiones
        let commission_config = &event.commission_config;
        let organizer_amount = (price as u128 * commission_config.organizer_percentage as u128)
            / 10000;
        let platform_amount = (price as u128 * commission_config.platform_percentage as u128)
            / 10000;
        let seller_amount = price - organizer_amount - platform_amount;

        // Distribuir pagos
        // En Vara Network, el valor recibido se queda en el contrato
        // Se debe distribuir usando msg::send a cada destinatario
        // NOTA: En producción, implementar la distribución real de tokens
        // msg::send(&event.organizer, b"", organizer_amount).expect("Failed to send to organizer");
        // msg::send(&seller, b"", seller_amount).expect("Failed to send to seller");
        // La plataforma puede retirar sus fondos con una función separada de admin

        // Actualizar estado del ticket
        state.remove_ticket_from_user(&seller, &ticket_id);
        state.add_ticket_to_user(caller, ticket_id);

        TicketEvents::TicketResold {
            ticket_id,
            seller,
            buyer: caller,
            price,
            organizer_amount,
            platform_amount,
            seller_amount,
        }
    }

    // ==================== USO DE TICKETS ====================

    /// Marca un ticket como usado
    /// Solo escáneres autorizados o admins pueden marcar tickets como usados
    pub fn mark_ticket_as_used(&mut self, ticket_id: U256) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        if !state.is_platform_admin(&caller) && !state.is_authorized_scanner(&caller) {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        let Some(ticket) = state.get_ticket_mut(&ticket_id) else {
            return TicketEvents::Error(TicketErrors::TicketNotFound);
        };

        if ticket.used {
            return TicketEvents::Error(TicketErrors::TicketAlreadyUsed);
        }

        ticket.used = true;
        TicketEvents::TicketMarkedAsUsed(ticket_id)
    }

    /// Marca múltiples tickets como usados (batch)
    pub fn batch_mark_tickets_as_used(&mut self, ticket_ids: Vec<U256>) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        if !state.is_platform_admin(&caller) && !state.is_authorized_scanner(&caller) {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        let mut marked = Vec::new();
        let mut errors = Vec::new();

        for ticket_id in ticket_ids {
            if let Some(ticket) = state.get_ticket_mut(&ticket_id) {
                if !ticket.used {
                    ticket.used = true;
                    marked.push(ticket_id);
                } else {
                    errors.push((ticket_id, "Already used".to_string()));
                }
            } else {
                errors.push((ticket_id, "Not found".to_string()));
            }
        }

        TicketEvents::TicketsBatchMarkedAsUsed { marked, errors }
    }

    // ==================== GESTIÓN DE FONDOS ====================

    /// Retira fondos acumulados de la plataforma
    /// Solo admins de plataforma pueden retirar
    /// NOTA: Esta función requiere implementación de gestión de balance del contrato
    pub fn withdraw_platform_funds(&mut self, amount: u128, to: ActorId) -> TicketEvents {
        let state = self.state_mut();
        let caller = msg::source();

        if !state.is_platform_admin(&caller) {
            return TicketEvents::Error(TicketErrors::Unauthorized);
        }

        // En producción, verificar balance del contrato y enviar fondos
        // let balance = exec::balance();
        // if balance < amount {
        //     return TicketEvents::Error(TicketErrors::InsufficientBalance);
        // }
        // msg::send(&to, b"", amount).expect("Failed to withdraw funds");

        TicketEvents::PlatformFundsWithdrawn { amount, to }
    }

    // ==================== QUERIES ====================

    /// Obtiene información de un evento
    pub fn get_event(&self, event_id: u64) -> TicketQueryEvents {
        let state = self.state_ref();

        match state.get_event(event_id) {
            Some(event) => TicketQueryEvents::Event(event.clone()),
            None => TicketQueryEvents::Error(TicketErrors::EventNotFound),
        }
    }

    /// Obtiene información de un ticket
    pub fn get_ticket(&self, ticket_id: U256) -> TicketQueryEvents {
        let state = self.state_ref();

        match state.get_ticket(&ticket_id) {
            Some(ticket) => TicketQueryEvents::Ticket(ticket.clone()),
            None => TicketQueryEvents::Error(TicketErrors::TicketNotFound),
        }
    }

    /// Obtiene todos los tickets de un evento
    pub fn get_event_tickets(&self, event_id: u64) -> TicketQueryEvents {
        let state = self.state_ref();

        if !state.events.contains_key(&event_id) {
            return TicketQueryEvents::Error(TicketErrors::EventNotFound);
        }

        let tickets: Vec<Ticket> = state
            .event_tickets
            .get(&event_id)
            .map(|ticket_ids| {
                ticket_ids
                    .iter()
                    .filter_map(|id| state.get_ticket(id).cloned())
                    .collect()
            })
            .unwrap_or_default();

        TicketQueryEvents::EventTickets(tickets)
    }

    /// Obtiene todos los tickets de un usuario
    pub fn get_user_tickets(&self, user: ActorId) -> TicketQueryEvents {
        let state = self.state_ref();

        let tickets: Vec<Ticket> = state
            .user_tickets
            .get(&user)
            .map(|ticket_ids| {
                ticket_ids
                    .iter()
                    .filter_map(|id| state.get_ticket(id).cloned())
                    .collect()
            })
            .unwrap_or_default();

        TicketQueryEvents::UserTickets(tickets)
    }

    /// Obtiene el dueño de un ticket (desde el contrato NFT)
    pub async fn get_ticket_owner(&self, ticket_id: U256) -> TicketQueryEvents {
        let state = self.state_ref();

        let Some(vnft_contract_id) = state.vnft_contract_id else {
            return TicketQueryEvents::Error(TicketErrors::VnftContractNotSet);
        };

        match self
            .vnft_client
            .owner_of(ticket_id)
            .recv(vnft_contract_id)
            .await
        {
            Ok(owner) => TicketQueryEvents::TicketOwner(owner),
            Err(error) => TicketQueryEvents::Error(TicketErrors::QueryFailed(
                error.to_string(),
            )),
        }
    }

    // ==================== HELPERS ====================

    fn state_mut(&self) -> &'static mut TicketState {
        let state = unsafe { TICKET_STATE.as_mut() };
        debug_assert!(state.is_none(), "state is not initialized!");
        unsafe { state.unwrap_unchecked() }
    }

    fn state_ref(&self) -> &'static TicketState {
        let state = unsafe { TICKET_STATE.as_ref() };
        debug_assert!(state.is_none(), "state is not initialized!");
        unsafe { state.unwrap_unchecked() }
    }
}

    // ==================== NOTAS DE SEGURIDAD ====================
    // 
    // PREVENCIÓN DE TRANSFERENCIAS DIRECTAS:
    // Los tickets son NFTs que pueden ser transferidos directamente si el usuario
    // no aprueba el contrato. Para prevenir esto:
    // 1. Los usuarios deben aprobar este contrato antes de listar tickets para reventa
    // 2. El contrato verifica approval antes de procesar reventas
    // 3. Los tickets usados no pueden ser transferidos (validación en estado)
    // 
    // RECOMENDACIÓN: Implementar un hook en el contrato NFT que notifique
    // a este contrato cuando ocurra una transferencia directa, para actualizar
    // el estado interno si es necesario.

    // ==================== EVENTOS ====================

/// Eventos emitidos por el contrato
#[derive(Encode, Decode, TypeInfo, Debug)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum TicketEvents {
    // Roles
    PlatformAdminAdded(ActorId),
    AuthorizedScannerAdded(ActorId),
    VnftContractSet(ActorId),

    // Eventos
    EventCreated(u64),
    ResaleConfigUpdated(u64),
    CommissionConfigUpdated(u64),
    EventDeactivated(u64),

    // Minting
    TicketMinted {
        ticket_id: U256,
        event_id: u64,
        owner: ActorId,
    },
    TicketsBatchMinted {
        event_id: u64,
        count: u32,
        tickets: Vec<(U256, ActorId)>,
    },

    // Reventa
    TicketListedForResale {
        ticket_id: U256,
        price: u128,
        seller: ActorId,
    },
    TicketResold {
        ticket_id: U256,
        seller: ActorId,
        buyer: ActorId,
        price: u128,
        organizer_amount: u128,
        platform_amount: u128,
        seller_amount: u128,
    },

    // Fondos
    PlatformFundsWithdrawn {
        amount: u128,
        to: ActorId,
    },

    // Uso
    TicketMarkedAsUsed(U256),
    TicketsBatchMarkedAsUsed {
        marked: Vec<U256>,
        errors: Vec<(U256, String)>,
    },

    // Errores
    Error(TicketErrors),
}

/// Eventos de query
#[derive(Encode, Decode, TypeInfo, Debug)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum TicketQueryEvents {
    Event(Event),
    Ticket(Ticket),
    EventTickets(Vec<Ticket>),
    UserTickets(Vec<Ticket>),
    TicketOwner(ActorId),
    Error(TicketErrors),
}

/// Errores del contrato
#[derive(Encode, Decode, TypeInfo, Debug, PartialEq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub enum TicketErrors {
    Unauthorized,
    AlreadyAdmin,
    AlreadyAuthorized,
    EventNotFound,
    EventInactive,
    TicketNotFound,
    TicketAlreadyUsed,
    InvalidEventStart,
    InvalidCommissionConfig,
    ResaleNotAllowed,
    InsufficientPayment,
    ContractNotApproved,
    CannotBuyOwnTicket,
    VnftContractNotSet,
    MintFailed(String),
    TransferFailed(String),
    FailedToGetOwner,
    QueryFailed(String),
    InsufficientBalance,
}

