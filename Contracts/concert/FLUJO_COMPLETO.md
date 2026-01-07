# Flujo Completo del Sistema de Ticketing NFT

Este documento explica el flujo completo del sistema después de crear un evento, desde la venta primaria hasta el uso del ticket.

## 📋 Índice

1. [Crear Evento](#1-crear-evento)
2. [Venta Primaria - Mintear Tickets](#2-venta-primaria---mintear-tickets)
3. [Reventa de Tickets](#3-reventa-de-tickets)
4. [Uso del Ticket](#4-uso-del-ticket)
5. [Consultas y Verificaciones](#5-consultas-y-verificaciones)
6. [Flujo Visual Completo](#6-flujo-visual-completo)

---

## 1. Crear Evento

**Actor**: Organizador o Admin

**Función**: `create_event`

```rust
contract.create_event(
    organizer,           // Dirección del organizador
    metadata_hash,       // Hash SHA-256 de metadata off-chain
    event_start_time,    // Timestamp de inicio
    tickets_total,       // Total de tickets disponibles
    resale_config,       // Configuración de reventa
    commission_config,   // Configuración de comisiones
);
```

**Resultado**:
- ✅ Evento creado con `event_id` único
- ✅ Organizador agregado automáticamente a la lista de organizadores
- ✅ Evento emitido: `EventCreated`

**Próximo paso**: Mintear tickets en venta primaria

---

## 2. Venta Primaria - Mintear Tickets

**Actor**: Organizador del evento o Admin

**Función**: `mint_tickets` (async)

### 2.1 Mintear Tickets Individuales

```rust
// Mintear 1 ticket para un comprador
contract.mint_tickets(
    event_id,                    // ID del evento creado
    buyer_address,               // Dirección del comprador
    U256::from(1),               // Cantidad: 1 ticket
    vec![Some("VIP A1".to_string())], // Zona/asiento opcional
).await;
```

### 2.2 Mintear Múltiples Tickets (Batch Minting)

```rust
// Mintear 5 tickets para un comprador
let zones = vec![
    Some("VIP A1".to_string()),
    Some("VIP A2".to_string()),
    Some("VIP A3".to_string()),
    Some("VIP A4".to_string()),
    Some("VIP A5".to_string()),
];

contract.mint_tickets(
    event_id,
    buyer_address,
    U256::from(5),               // Cantidad: 5 tickets
    zones,                        // Zonas para cada ticket
).await;
```

### 2.3 Mintear Tickets sin Zona Específica

```rust
// Mintear 10 tickets sin especificar zona
contract.mint_tickets(
    event_id,
    buyer_address,
    U256::from(10),
    vec![],                       // Vector vacío = sin zonas
).await;
```

**Validaciones**:
- ✅ Evento existe y está activo
- ✅ Hay suficientes tickets disponibles
- ✅ Solo organizador o admin puede mintear
- ✅ Si se especifican zonas, deben coincidir con la cantidad

**Resultado**:
- ✅ NFTs creados en el contrato VMT
- ✅ Tickets registrados en el contrato
- ✅ Contador de tickets minteados actualizado
- ✅ Evento emitido: `TicketsMinted` con lista de `ticket_ids`

**Estado del Ticket**:
```rust
Ticket {
    ticket_id: 1,
    event_id: 1,
    zone: Some("VIP A1"),
    original_buyer: buyer_address,
    current_owner: buyer_address,  // Mismo que original_buyer
    used: false,
    minted_at: timestamp,
}
```

**Próximos pasos posibles**:
- El comprador puede revender el ticket (si está habilitado)
- El comprador puede usar el ticket en el evento
- Consultar información del ticket

---

## 3. Reventa de Tickets

**Actor**: Propietario actual del ticket

**Función**: `resell_ticket` (async)

### 3.1 Revender un Ticket

```rust
contract.resell_ticket(
    ticket_id,                    // ID del ticket a revender
    new_buyer_address,            // Dirección del nuevo comprador
    U256::from(500_000_000_000),  // Precio de reventa (500 tokens)
).await;
```

**Validaciones**:
- ✅ Ticket existe
- ✅ Ticket no está usado
- ✅ El caller es el propietario actual
- ✅ Reventa habilitada para el evento
- ✅ Precio dentro del máximo permitido (si aplica)
- ✅ Dentro de la ventana de tiempo (si aplica)
- ✅ El comprador no es el mismo que el vendedor

**Proceso Interno**:
1. Transfiere el NFT del vendedor al comprador (VMT)
2. Calcula comisiones:
   - Vendedor: 85% (ejemplo)
   - Organizador: 10%
   - Plataforma: 5%
3. Actualiza `current_owner` del ticket
4. Emite evento: `TicketResold`

**Estado del Ticket Después de Reventa**:
```rust
Ticket {
    ticket_id: 1,
    event_id: 1,
    zone: Some("VIP A1"),
    original_buyer: original_buyer_address,  // No cambia
    current_owner: new_buyer_address,       // Actualizado
    used: false,
    minted_at: timestamp,
}
```

**Nota sobre Pagos**:
El contrato actualmente no maneja pagos directamente. Las opciones son:
- Sistema de escrow externo
- Pago previo antes de llamar a `resell_ticket`
- Integración con token nativo de Vara

**Próximos pasos**:
- El nuevo propietario puede revender nuevamente (si está permitido)
- El nuevo propietario puede usar el ticket en el evento

---

## 4. Uso del Ticket

**Actor**: Escáner autorizado o Admin

**Función**: `mark_ticket_used`

### 4.1 Marcar Ticket como Usado

```rust
contract.mark_ticket_used(ticket_id);
```

**Validaciones**:
- ✅ Ticket existe
- ✅ Ticket no está usado previamente
- ✅ Solo escáner o admin puede marcar como usado

**Resultado**:
- ✅ Ticket marcado como `used: true`
- ✅ Ticket no puede revenderse ni transferirse
- ✅ Evento emitido: `TicketUsed`

**Estado del Ticket Después de Uso**:
```rust
Ticket {
    ticket_id: 1,
    event_id: 1,
    zone: Some("VIP A1"),
    original_buyer: original_buyer_address,
    current_owner: current_owner_address,
    used: true,                    // ✅ Marcado como usado
    minted_at: timestamp,
}
```

**Restricciones después de usar**:
- ❌ No se puede revender
- ❌ No se puede transferir
- ✅ Puede consultarse para auditoría

---

## 5. Consultas y Verificaciones

### 5.1 Consultar Información de un Ticket

```rust
let ticket = contract.get_ticket(ticket_id);

if let Some(ticket) = ticket {
    println!("Ticket ID: {}", ticket.ticket_id);
    println!("Evento ID: {}", ticket.event_id);
    println!("Zona: {:?}", ticket.zone);
    println!("Comprador original: {:?}", ticket.original_buyer);
    println!("Propietario actual: {:?}", ticket.current_owner);
    println!("Usado: {}", ticket.used);
}
```

### 5.2 Consultar Información de un Evento

```rust
let event = contract.get_event(event_id);

if let Some(event) = event {
    println!("Evento ID: {}", event.event_id);
    println!("Organizador: {:?}", event.organizer);
    println!("Tickets totales: {}", event.tickets_total);
    println!("Tickets minteados: {}", event.tickets_minted);
    println!("Reventa habilitada: {}", event.resale_config.enabled);
    println!("Activo: {}", event.active);
}
```

### 5.3 Obtener Tickets de un Usuario

```rust
let user_tickets = contract.get_user_tickets(user_address);

for ticket in user_tickets {
    println!("Ticket {} del evento {}", ticket.ticket_id, ticket.event_id);
    println!("Usado: {}", ticket.used);
}
```

### 5.4 Obtener Todos los Tickets de un Evento

```rust
let ticket_ids = contract.get_event_tickets(event_id);

println!("El evento {} tiene {} tickets", event_id, ticket_ids.len());
for ticket_id in ticket_ids {
    println!("  - Ticket ID: {}", ticket_id);
}
```

### 5.5 Obtener Estadísticas de un Evento

```rust
let stats = contract.get_event_stats(event_id);

if let Some(stats) = stats {
    println!("Evento ID: {}", stats.event_id);
    println!("Tickets totales: {}", stats.tickets_total);
    println!("Tickets minteados: {}", stats.tickets_minted);
    println!("Tickets usados: {}", stats.tickets_used);
    println!("Activo: {}", stats.active);
}
```

### 5.6 Verificar Roles

```rust
// Verificar si una dirección es organizador
let is_org = contract.is_organizer(address);
println!("Es organizador: {}", is_org);

// Verificar si una dirección es escáner
let is_scanner = contract.is_scanner(address);
println!("Es escáner: {}", is_scanner);
```

---

## 6. Flujo Visual Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────┘

1. CREAR EVENTO
   ┌─────────────────────┐
   │ Organizador/Admin   │
   │ create_event()      │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ Evento Creado       │
   │ event_id = 1        │
   │ tickets_total = 100 │
   └──────────┬──────────┘
              │
              ▼
2. VENTA PRIMARIA
   ┌─────────────────────┐
   │ Organizador/Admin   │
   │ mint_tickets()      │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ Tickets Minteados   │
   │ ticket_id: 1, 2, 3  │
   │ owner: buyer_1      │
   │ used: false         │
   └──────────┬──────────┘
              │
              ├─────────────────┐
              │                 │
              ▼                 ▼
   3a. REVENTA          3b. USO DIRECTO
   ┌─────────────┐      ┌─────────────┐
   │ Propietario │      │ Escáner     │
   │ resell_     │      │ mark_ticket │
   │ ticket()    │      │ _used()     │
   └──────┬──────┘      └──────┬──────┘
          │                    │
          ▼                    ▼
   ┌─────────────┐      ┌─────────────┐
   │ Nuevo Owner │      │ Ticket Usado│
   │ owner:      │      │ used: true  │
   │ buyer_2     │      │ ❌ Bloqueado│
   └──────┬──────┘      └─────────────┘
          │
          ▼
   3c. REVENTA MÚLTIPLE
   ┌─────────────┐
   │ buyer_2     │
   │ resell_     │
   │ ticket()    │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │ owner:      │
   │ buyer_3     │
   └─────────────┘
```

---

## 7. Ejemplos de Flujo Completo

### Ejemplo 1: Flujo Simple (Sin Reventa)

```rust
// 1. Crear evento
let event_id = contract.create_event(...);

// 2. Mintear tickets
contract.mint_tickets(event_id, buyer_1, U256::from(2), vec![]).await;

// 3. Usar tickets en el evento
contract.mark_ticket_used(ticket_id_1);
contract.mark_ticket_used(ticket_id_2);
```

### Ejemplo 2: Flujo con Reventa

```rust
// 1. Crear evento con reventa habilitada
let event_id = contract.create_event(
    organizer,
    metadata_hash,
    event_start_time,
    tickets_total,
    resale_config_enabled,  // Reventa habilitada
    commission_config,
);

// 2. Mintear tickets
contract.mint_tickets(event_id, buyer_1, U256::from(1), vec![]).await;

// 3. Reventa
contract.resell_ticket(
    ticket_id_1,
    buyer_2,
    U256::from(500_000_000_000),
).await;

// 4. Reventa nuevamente
contract.resell_ticket(
    ticket_id_1,
    buyer_3,
    U256::from(600_000_000_000),
).await;

// 5. Usar ticket
contract.mark_ticket_used(ticket_id_1);
```

### Ejemplo 3: Flujo con Múltiples Compradores

```rust
// 1. Crear evento
let event_id = contract.create_event(...);

// 2. Mintear para múltiples compradores
contract.mint_tickets(event_id, buyer_1, U256::from(5), vec![]).await;
contract.mint_tickets(event_id, buyer_2, U256::from(3), vec![]).await;
contract.mint_tickets(event_id, buyer_3, U256::from(2), vec![]).await;

// 3. Algunos revenden
contract.resell_ticket(ticket_id_1, buyer_4, price).await;
contract.resell_ticket(ticket_id_5, buyer_5, price).await;

// 4. Usar tickets en el evento
for ticket_id in all_ticket_ids {
    contract.mark_ticket_used(ticket_id);
}
```

---

## 8. Gestión de Roles (Opcional)

### 8.1 Agregar Organizador

```rust
// Solo admin puede hacer esto
contract.add_organizer(new_organizer_address);
```

### 8.2 Agregar Escáner

```rust
// Solo admin puede hacer esto
contract.add_scanner(scanner_address);
```

### 8.3 Actualizar Configuración de Evento

```rust
// Actualizar configuración de reventa
contract.update_resale_config(event_id, new_resale_config);

// Actualizar configuración de comisiones
contract.update_commission_config(event_id, new_commission_config);

// Activar/desactivar evento
contract.set_event_active(event_id, true);  // Activar
contract.set_event_active(event_id, false); // Desactivar
```

---

## 9. Casos de Uso Comunes

### Caso 1: Evento con Preventa y Venta General

```rust
// 1. Crear evento
let event_id = contract.create_event(...);

// 2. Preventa (solo para algunos usuarios)
contract.mint_tickets(event_id, vip_member_1, U256::from(2), vec![]).await;
contract.mint_tickets(event_id, vip_member_2, U256::from(2), vec![]).await;

// 3. Venta general
contract.mint_tickets(event_id, general_buyer_1, U256::from(1), vec![]).await;
// ... más ventas

// 4. Reventa (si está habilitada)
contract.resell_ticket(ticket_id, new_buyer, price).await;

// 5. Evento - marcar tickets como usados
contract.mark_ticket_used(ticket_id);
```

### Caso 2: Evento con Zonas/Asientos

```rust
// 1. Crear evento
let event_id = contract.create_event(...);

// 2. Mintear tickets con zonas específicas
let vip_zones = vec![
    Some("VIP A1".to_string()),
    Some("VIP A2".to_string()),
    Some("VIP A3".to_string()),
];
contract.mint_tickets(event_id, buyer, U256::from(3), vip_zones).await;

// 3. Consultar ticket para ver zona
let ticket = contract.get_ticket(ticket_id);
println!("Zona: {:?}", ticket.zone); // "VIP A1"
```

### Caso 3: Auditoría Post-Evento

```rust
// Después del evento, consultar estadísticas
let stats = contract.get_event_stats(event_id);

println!("Tickets totales: {}", stats.tickets_total);
println!("Tickets minteados: {}", stats.tickets_minted);
println!("Tickets usados: {}", stats.tickets_used);

// Verificar tickets no usados
let all_tickets = contract.get_event_tickets(event_id);
for ticket_id in all_tickets {
    let ticket = contract.get_ticket(ticket_id);
    if !ticket.used {
        println!("⚠️ Ticket {} no fue usado", ticket_id);
    }
}
```

---

## 10. Mejores Prácticas

1. **Validar antes de mintear**: Verifica disponibilidad antes de mintear tickets
2. **Manejar errores**: Siempre maneja los posibles errores de las funciones async
3. **Consultar estado**: Usa las funciones de consulta para verificar estado antes de operaciones
4. **Eventos on-chain**: Escucha los eventos emitidos para tracking en tiempo real
5. **Metadata off-chain**: Mantén la metadata off-chain accesible (IPFS, servidor, etc.)
6. **Timestamps**: Usa timestamps Unix consistentes en todo el sistema
7. **Comisiones**: Verifica que las comisiones sumen 10000 antes de crear eventos

---

## 11. Resumen de Funciones por Actor

### Organizador/Admin
- ✅ `create_event`
- ✅ `mint_tickets`
- ✅ `update_resale_config`
- ✅ `update_commission_config`
- ✅ `set_event_active`

### Propietario de Ticket
- ✅ `resell_ticket`
- ✅ `get_ticket`
- ✅ `get_user_tickets`

### Escáner/Admin
- ✅ `mark_ticket_used`

### Admin
- ✅ `add_organizer`
- ✅ `remove_organizer`
- ✅ `add_scanner`
- ✅ `remove_scanner`

### Cualquiera (Consultas)
- ✅ `get_event`
- ✅ `get_event_tickets`
- ✅ `get_event_stats`
- ✅ `is_organizer`
- ✅ `is_scanner`

---

¡Con este flujo completo puedes implementar un sistema de ticketing NFT completo en Vara Network! 🎫


