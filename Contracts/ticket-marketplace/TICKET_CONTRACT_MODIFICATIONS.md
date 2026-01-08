# Modificaciones Necesarias en el Contrato de Tickets

Para que el Marketplace funcione correctamente, el contrato de Tickets necesita algunas modificaciones o funciones adicionales:

## Problema 1: Llamar funciones de consulta desde otro contrato

Las funciones `get_ticket` y `get_event` son síncronas. Para llamarlas desde el Marketplace (otro contrato), necesitas:

### Opción A: Hacer las funciones async y usar mensajes

```rust
// En el contrato de Tickets
#[export]
pub async fn get_ticket_async(&self, ticket_id: U256) -> Option<Ticket> {
    self.get().tickets.get(&ticket_id).cloned()
}

#[export]
pub async fn get_event_async(&self, event_id: U256) -> Option<EventConfig> {
    self.get().events.get(&event_id).cloned()
}
```

### Opción B: Usar el sistema de mensajes de sails-rs

El Marketplace ya implementa llamadas usando `TicketContractMessage`. El contrato de Tickets debe manejar estos mensajes en su handler principal.

## Problema 2: Transferir tickets desde el Marketplace

La función `resell_ticket` valida que `msg::source() == ticket.current_owner`. Cuando el Marketplace llama, `msg::source()` es el Marketplace, no el vendedor.

### Solución: Función especial para Marketplace

Agregar al contrato de Tickets:

```rust
/// Transferir ticket desde el Marketplace
/// Solo el Marketplace autorizado puede llamar esta función
#[export]
pub async fn transfer_from_marketplace(
    &mut self,
    ticket_id: U256,
    buyer: ActorId,
    seller: ActorId, // El vendedor original
    price: U256,
) {
    self.non_reentrant();
    
    let storage = self.get_mut();
    
    // Validar que el Marketplace esté autorizado
    if !storage.authorized_marketplaces.contains(&msg::source()) {
        self.unlock();
        panic(TicketError::Unauthorized);
    }
    
    // Validar que el ticket existe
    let ticket = storage.tickets.get_mut(&ticket_id);
    if ticket.is_none() {
        self.unlock();
        panic(TicketError::TicketNotFound);
    }
    let ticket = ticket.unwrap();
    
    // Validar propiedad
    if ticket.current_owner != seller {
        self.unlock();
        panic(TicketError::TicketNotOwned);
    }
    
    // Validar que no esté usado
    if ticket.used {
        self.unlock();
        panic(TicketError::TicketAlreadyUsed);
    }
    
    // Validar evento
    let event_config = storage.events.get(&ticket.event_id);
    if event_config.is_none() {
        self.unlock();
        panic(TicketError::EventNotFound);
    }
    let event_config = event_config.unwrap();
    
    // Validar reventa habilitada
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
    
    // Transferir NFT usando VMT
    let transfer_request = vmt_io::TransferFrom::encode_call(
        seller,
        buyer,
        ticket_id,
        NFT_COUNT,
    );
    msg::send_bytes_for_reply(storage.vmt_contract_id, transfer_request, 0, 5_000_000_000)
        .expect("Error sending transfer request to VMT contract")
        .await
        .expect("Error transferring ticket NFT");
    
    // Actualizar propietario
    ticket.current_owner = buyer;
    
    // Calcular comisiones (para el evento)
    let seller_share = (price.as_u128() * event_config.commission_config.seller_percentage as u128) 
        / BASIS_POINTS as u128;
    let organizer_share = (price.as_u128() * event_config.commission_config.organizer_percentage as u128) 
        / BASIS_POINTS as u128;
    let platform_share = (price.as_u128() * event_config.commission_config.platform_percentage as u128) 
        / BASIS_POINTS as u128;
    
    self.emit_event(Event::TicketResold {
        ticket_id,
        event_id: ticket.event_id,
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

/// Autorizar un Marketplace para transferir tickets
#[export]
pub fn authorize_marketplace(&mut self, marketplace: ActorId) {
    self.require_admin();
    
    if marketplace == ZERO_ID {
        panic(TicketError::InvalidInput);
    }
    
    let storage = self.get_mut();
    storage.authorized_marketplaces.insert(marketplace);
}

/// Revocar autorización de un Marketplace
#[export]
pub fn revoke_marketplace(&mut self, marketplace: ActorId) {
    self.require_admin();
    
    let storage = self.get_mut();
    storage.authorized_marketplaces.remove(&marketplace);
}
```

Y agregar al Storage:

```rust
authorized_marketplaces: HashSet<ActorId>,
```

## Problema 3: Formato de mensajes

El Marketplace usa `TicketContractMessage` para comunicarse. El contrato de Tickets debe manejar estos mensajes. Si usas sails-rs, las funciones `#[export]` se pueden llamar directamente usando el cliente generado, pero desde otro contrato necesitas usar el formato de mensaje correcto.

### Solución: Handler de mensajes

En el contrato de Tickets, agregar un handler que procese los mensajes del Marketplace:

```rust
// En el handler principal del contrato de Tickets
#[no_mangle]
extern "C" fn handle() {
    // Intentar decodificar como mensaje del Marketplace
    if let Ok(msg) = TicketContractMessage::decode(&mut gstd::msg::load_bytes().as_slice()) {
        match msg {
            TicketContractMessage::GetTicket { ticket_id } => {
                let ticket_service = TicketService::new();
                let result = ticket_service.get_ticket(ticket_id);
                msg::reply(TicketContractReply::Ticket(result), 0).expect("Failed to reply");
            }
            TicketContractMessage::GetEvent { event_id } => {
                let ticket_service = TicketService::new();
                let result = ticket_service.get_event(event_id);
                msg::reply(TicketContractReply::Event(result), 0).expect("Failed to reply");
            }
            TicketContractMessage::ResellTicket { ticket_id, buyer, price } => {
                // Esto requiere que el Marketplace esté autorizado
                // Usar transfer_from_marketplace en su lugar
            }
        }
        return;
    }
    
    // Continuar con el handler normal de sails-rs
    // ...
}
```

## Resumen de Cambios Necesarios

1. **Agregar conjunto de marketplaces autorizados** al Storage del contrato de Tickets
2. **Agregar función `transfer_from_marketplace`** para permitir transferencias desde el Marketplace
3. **Agregar funciones para autorizar/revocar marketplaces**
4. **Opcionalmente**, hacer `get_ticket` y `get_event` async o agregar handler de mensajes
5. **Actualizar el Marketplace** para usar `transfer_from_marketplace` en lugar de `resell_ticket`

