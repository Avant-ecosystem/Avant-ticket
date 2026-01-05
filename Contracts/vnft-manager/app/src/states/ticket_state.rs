use sails_rs::prelude::*;

/// Configuración de comisiones para un evento
#[derive(Clone, Encode, Decode, TypeInfo, Debug, PartialEq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct CommissionConfig {
    /// Porcentaje para el organizador (en basis points, 100 = 1%)
    pub organizer_percentage: u16,
    /// Porcentaje para la plataforma (en basis points, 100 = 1%)
    pub platform_percentage: u16,
    /// Porcentaje para el vendedor (en basis points, 100 = 1%)
    /// Se calcula como: 10000 - organizer_percentage - platform_percentage
    pub seller_percentage: u16,
}

impl CommissionConfig {
    pub fn new(organizer_percentage: u16, platform_percentage: u16) -> Result<Self, String> {
        if organizer_percentage + platform_percentage > 10000 {
            return Err("La suma de porcentajes no puede exceder 100%".to_string());
        }
        let seller_percentage = 10000 - organizer_percentage - platform_percentage;
        Ok(Self {
            organizer_percentage,
            platform_percentage,
            seller_percentage,
        })
    }

    pub fn validate(&self) -> bool {
        self.organizer_percentage + self.platform_percentage + self.seller_percentage == 10000
    }
}

/// Configuración de reventa para un evento
#[derive(Clone, Encode, Decode, TypeInfo, Debug, PartialEq)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct ResaleConfig {
    /// Si la reventa está habilitada
    pub enabled: bool,
    /// Precio máximo permitido para reventa (None = sin límite)
    pub max_price: Option<u128>,
    /// Timestamp de inicio de ventana de reventa (None = sin restricción)
    pub resale_start: Option<u64>,
    /// Timestamp de fin de ventana de reventa (None = sin restricción)
    pub resale_end: Option<u64>,
}

impl ResaleConfig {
    pub fn new(
        enabled: bool,
        max_price: Option<u128>,
        resale_start: Option<u64>,
        resale_end: Option<u64>,
    ) -> Result<Self, String> {
        if let (Some(start), Some(end)) = (resale_start, resale_end) {
            if start >= end {
                return Err("La fecha de inicio debe ser anterior a la fecha de fin".to_string());
            }
        }
        Ok(Self {
            enabled,
            max_price,
            resale_start,
            resale_end,
        })
    }

    pub fn is_resale_allowed(&self, current_time: u64, price: u128) -> bool {
        if !self.enabled {
            return false;
        }

        // Verificar ventana de tiempo
        if let Some(start) = self.resale_start {
            if current_time < start {
                return false;
            }
        }
        if let Some(end) = self.resale_end {
            if current_time > end {
                return false;
            }
        }

        // Verificar precio máximo
        if let Some(max) = self.max_price {
            if price > max {
                return false;
            }
        }

        true
    }
}

/// Información de un evento
#[derive(Clone, Encode, Decode, TypeInfo, Debug)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct Event {
    /// ID único del evento
    pub event_id: u64,
    /// Dirección del organizador del evento
    pub organizer: ActorId,
    /// Hash de metadata off-chain (IPFS, Arweave, etc.)
    pub metadata_hash: [u8; 32],
    /// Timestamp de inicio del evento
    pub event_start: u64,
    /// Configuración de reventa
    pub resale_config: ResaleConfig,
    /// Configuración de comisiones
    pub commission_config: CommissionConfig,
    /// Si el evento está activo
    pub active: bool,
}

/// Información de un ticket NFT
#[derive(Clone, Encode, Decode, TypeInfo, Debug)]
#[codec(crate = sails_rs::scale_codec)]
#[scale_info(crate = sails_rs::scale_info)]
pub struct Ticket {
    /// ID único del ticket (token_id del NFT)
    pub ticket_id: U256,
    /// ID del evento al que pertenece
    pub event_id: u64,
    /// Zona o asiento (opcional)
    pub zone_seat: Option<String>,
    /// Comprador original del ticket
    pub original_buyer: ActorId,
    /// Si el ticket ha sido usado
    pub used: bool,
    /// Timestamp de cuando fue minteado
    pub minted_at: u64,
}

/// Estado del contrato de ticketing
#[derive(Default)]
pub struct TicketState {
    /// Lista de administradores de la plataforma
    pub platform_admins: Vec<ActorId>,
    /// Mapeo de event_id -> Event
    pub events: BTreeMap<u64, Event>,
    /// Mapeo de ticket_id -> Ticket
    pub tickets: BTreeMap<U256, Ticket>,
    /// Mapeo de event_id -> lista de ticket_ids
    pub event_tickets: BTreeMap<u64, Vec<U256>>,
    /// Mapeo de usuario -> lista de ticket_ids que posee
    pub user_tickets: BTreeMap<ActorId, Vec<U256>>,
    /// Contador para generar event_ids únicos
    pub next_event_id: u64,
    /// Contador para generar ticket_ids únicos
    pub next_ticket_id: U256,
    /// Escáneres autorizados (pueden marcar tickets como usados)
    pub authorized_scanners: Vec<ActorId>,
    /// Dirección del contrato NFT (VNFT)
    pub vnft_contract_id: Option<ActorId>,
}

impl TicketState {
    /// Crea un nuevo estado con un admin inicial
    pub fn new(admin: ActorId) -> Self {
        let mut state = Self::default();
        state.platform_admins.push(admin);
        state.next_event_id = 1;
        state.next_ticket_id = U256::from(1);
        state
    }

    /// Crea un nuevo estado con admin y contrato NFT
    pub fn new_with_vnft(admin: ActorId, vnft_contract_id: ActorId) -> Self {
        let mut state = Self::new(admin);
        state.vnft_contract_id = Some(vnft_contract_id);
        state
    }

    /// Verifica si una dirección es admin de plataforma
    pub fn is_platform_admin(&self, address: &ActorId) -> bool {
        self.platform_admins.contains(address)
    }

    /// Verifica si una dirección es organizador de un evento
    pub fn is_event_organizer(&self, event_id: u64, address: &ActorId) -> bool {
        self.events
            .get(&event_id)
            .map(|event| event.organizer == *address)
            .unwrap_or(false)
    }

    /// Verifica si una dirección es escáner autorizado
    pub fn is_authorized_scanner(&self, address: &ActorId) -> bool {
        self.authorized_scanners.contains(address)
    }

    /// Obtiene un evento
    pub fn get_event(&self, event_id: u64) -> Option<&Event> {
        self.events.get(&event_id)
    }

    /// Obtiene un evento mutable
    pub fn get_event_mut(&mut self, event_id: u64) -> Option<&mut Event> {
        self.events.get_mut(&event_id)
    }

    /// Obtiene un ticket
    pub fn get_ticket(&self, ticket_id: &U256) -> Option<&Ticket> {
        self.tickets.get(ticket_id)
    }

    /// Obtiene un ticket mutable
    pub fn get_ticket_mut(&mut self, ticket_id: &U256) -> Option<&mut Ticket> {
        self.tickets.get_mut(ticket_id)
    }

    /// Agrega un ticket a la lista de tickets de un evento
    pub fn add_ticket_to_event(&mut self, event_id: u64, ticket_id: U256) {
        self.event_tickets
            .entry(event_id)
            .or_insert_with(Vec::new)
            .push(ticket_id);
    }

    /// Agrega un ticket a la lista de tickets de un usuario
    pub fn add_ticket_to_user(&mut self, user: ActorId, ticket_id: U256) {
        self.user_tickets
            .entry(user)
            .or_insert_with(Vec::new)
            .push(ticket_id);
    }

    /// Remueve un ticket de la lista de tickets de un usuario
    pub fn remove_ticket_from_user(&mut self, user: &ActorId, ticket_id: &U256) {
        if let Some(tickets) = self.user_tickets.get_mut(user) {
            tickets.retain(|id| id != ticket_id);
            if tickets.is_empty() {
                self.user_tickets.remove(user);
            }
        }
    }

    /// Genera un nuevo event_id
    pub fn generate_event_id(&mut self) -> u64 {
        let id = self.next_event_id;
        self.next_event_id += 1;
        id
    }

    /// Genera un nuevo ticket_id
    pub fn generate_ticket_id(&mut self) -> U256 {
        let id = self.next_ticket_id;
        self.next_ticket_id += U256::from(1);
        id
    }
}

