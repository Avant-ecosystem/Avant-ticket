# Guía de Integración: Marketplace con Contrato de Tickets

## Notas de Implementación

Este Marketplace requiere implementar las funciones de interacción con el contrato de Tickets. Las siguientes funciones son placeholders que deben implementarse según la interfaz real del contrato de Tickets:

### 1. `get_ticket_info()` - Obtener información del ticket

```rust
async fn get_ticket_info(&self, ticket_id: U256) -> Option<TicketInfo> {
    let storage = self.get();
    
    // Llamar al contrato de Tickets
    // Ejemplo de implementación:
    let request = TicketContractMessage::GetTicket { ticket_id };
    let reply = msg::send_for_reply::<_, TicketContractReply>(
        storage.ticket_contract_id,
        request.encode(),
        0,
        0
    )
    .expect("Error calling ticket contract")
    .await
    .expect("Error getting reply from ticket contract");
    
    match reply {
        TicketContractReply::TicketInfo(ticket) => Some(TicketInfo {
            ticket_id: ticket.ticket_id,
            event_id: ticket.event_id,
            current_owner: ticket.current_owner,
            used: ticket.used,
        }),
        _ => None,
    }
}
```

### 2. `get_event_info()` - Obtener información del evento

```rust
async fn get_event_info(&self, event_id: U256) -> Option<EventInfo> {
    let storage = self.get();
    
    // Llamar al contrato de Tickets
    let request = TicketContractMessage::GetEvent { event_id };
    let reply = msg::send_for_reply::<_, TicketContractReply>(
        storage.ticket_contract_id,
        request.encode(),
        0,
        0
    )
    .expect("Error calling ticket contract")
    .await
    .expect("Error getting reply from ticket contract");
    
    match reply {
        TicketContractReply::EventInfo(event) => Some(EventInfo {
            event_id: event.event_id,
            organizer: event.organizer,
            resale_enabled: event.resale_config.enabled,
            max_price: event.resale_config.max_price,
            resale_start_time: event.resale_config.resale_start_time,
            resale_end_time: event.resale_config.resale_end_time,
            seller_percentage: event.commission_config.seller_percentage,
            organizer_percentage: event.commission_config.organizer_percentage,
            platform_percentage: event.commission_config.platform_percentage,
        }),
        _ => None,
    }
}
```

### 3. `transfer_ticket()` - Transferir el ticket

**Opción A: Usar función `resell_ticket` del contrato de Tickets**

El contrato de Tickets tiene una función `resell_ticket` que puede ser llamada por el Marketplace si:
- El Marketplace es autorizado como intermediario, O
- El vendedor aprueba la transferencia al Marketplace primero

```rust
async fn transfer_ticket(&self, ticket_id: U256, buyer: ActorId, price: U256) -> Result<(), MarketplaceError> {
    let storage = self.get();
    
    // Obtener información del ticket para el seller
    let ticket_info = self.get_ticket_info(ticket_id).await;
    if ticket_info.is_none() {
        return Err(MarketplaceError::TicketNotFound);
    }
    let ticket_info = ticket_info.unwrap();
    
    // Llamar a resell_ticket del contrato de Tickets
    // Nota: Esto requiere que el Marketplace pueda llamar en nombre del seller
    // O que el seller haya aprobado la transferencia previamente
    let request = TicketContractMessage::ResellTicket {
        ticket_id,
        buyer,
        price,
    };
    
    msg::send_for_reply::<_, TicketContractReply>(
        storage.ticket_contract_id,
        request.encode(),
        0,
        0
    )
    .expect("Error calling ticket contract")
    .await
    .map_err(|_| MarketplaceError::TransferFailed)?;
    
    Ok(())
}
```

**Opción B: Agregar función especial en el contrato de Tickets**

Si el contrato de Tickets tiene una función especial para el Marketplace:

```rust
async fn transfer_ticket(&self, ticket_id: U256, buyer: ActorId, price: U256) -> Result<(), MarketplaceError> {
    let storage = self.get();
    
    let request = TicketContractMessage::TransferFromMarketplace {
        ticket_id,
        buyer,
        marketplace_id: msg::source(), // ID del marketplace
    };
    
    msg::send_for_reply::<_, TicketContractReply>(
        storage.ticket_contract_id,
        request.encode(),
        0,
        0
    )
    .expect("Error calling ticket contract")
    .await
    .map_err(|_| MarketplaceError::TransferFailed)?;
    
    Ok(())
}
```

## Flujo de Pago

El Marketplace actualmente no maneja pagos directamente. Las opciones son:

### Opción 1: Sistema de Escrow

El comprador envía el pago a un contrato de escrow antes de llamar a `buy_ticket()`. El Marketplace luego:
1. Valida el pago en el escrow
2. Distribuye los fondos según comisiones
3. Transfiere el ticket

### Opción 2: Pago Previo

El comprador envía el pago directamente al Marketplace antes de llamar a `buy_ticket()`. El Marketplace verifica el saldo y procesa.

### Opción 3: Integración con Token Nativo

Si se usa el token nativo de Vara, el Marketplace puede recibir el pago en la misma transacción y distribuir inmediatamente.

## Bloqueo de Transferencias Externas

Cuando un ticket está listado:
- El Marketplace marca el ticket como "listado" en su storage
- El contrato de Tickets NO bloquea transferencias directamente
- El Marketplace debe validar que el ticket no esté listado antes de permitir otras operaciones

**Solución Recomendada**: Agregar una función en el contrato de Tickets que:
- Marque tickets como "bloqueados para transferencia externa"
- Solo permita transferencias desde el Marketplace
- El Marketplace puede bloquear/desbloquear tickets

## Mensajes del Contrato de Tickets

Define los mensajes según la interfaz real del contrato de Tickets:

```rust
#[derive(Encode, Decode, TypeInfo)]
pub enum TicketContractMessage {
    GetTicket { ticket_id: U256 },
    GetEvent { event_id: U256 },
    ResellTicket { ticket_id: U256, buyer: ActorId, price: U256 },
    // O
    TransferFromMarketplace { ticket_id: U256, buyer: ActorId, marketplace_id: ActorId },
}

#[derive(Encode, Decode, TypeInfo)]
pub enum TicketContractReply {
    TicketInfo(Ticket),  // Estructura Ticket del contrato de Tickets
    EventInfo(EventConfig),  // Estructura EventConfig del contrato de Tickets
    Success,
    Error(String),
}
```

