# Smart Contract de Ticketing NFT - Vara Network

## Descripción General

Este contrato inteligente implementa un sistema completo de ticketing NFT para eventos en Vara Network. Los tickets son NFTs no transferibles directamente (solo a través del contrato de reventa), con venta primaria, reventa controlada y comisiones automáticas.

**Importante**: La blockchain es la fuente de verdad para emisión, propiedad, reventa y auditoría. NO se usa para validar el ingreso al evento en tiempo real.

## Características Principales

### ✅ Eventos
- Creación de eventos con configuración completa
- Metadata off-chain mediante hash
- Control de fechas y ventanas de tiempo
- Configuración flexible de reventa y comisiones

### ✅ Tickets NFT
- Cada ticket es un NFT único
- Información de zona/asiento opcional
- Tracking del comprador original y propietario actual
- Estado de uso (usado/no usado)

### ✅ Venta Primaria
- Batch minting (múltiples tickets en una transacción)
- Solo organizador o admin puede mintear
- Eventos on-chain para auditoría

### ✅ Reventa Controlada
- Reventa solo a través del contrato
- Precio máximo configurable
- Ventana de tiempo opcional
- Activación/desactivación por evento

### ✅ Comisiones Automáticas
- División automática del pago en reventa:
  - Vendedor
  - Organizador
  - Plataforma
- Porcentajes configurables por evento
- Cálculo preciso con basis points (10000 = 100%)

### ✅ Sistema de Roles
- **Admin**: Control total del contrato
- **Organizador**: Crear y gestionar eventos propios
- **Escáner**: Marcar tickets como usados

### ✅ Seguridad
- Guard contra reentrancy
- Validación exhaustiva de inputs
- Control estricto de permisos
- Eventos on-chain para auditoría

## Estructura del Contrato

### Tipos de Datos Principales

#### `EventConfig`
Configuración completa de un evento:
```rust
pub struct EventConfig {
    pub event_id: U256,
    pub organizer: ActorId,
    pub metadata_hash: [u8; 32],
    pub event_start_time: u64,
    pub tickets_minted: U256,
    pub tickets_total: U256,
    pub resale_config: ResaleConfig,
    pub commission_config: CommissionConfig,
    pub active: bool,
}
```

#### `Ticket`
Información de un ticket NFT:
```rust
pub struct Ticket {
    pub ticket_id: U256,
    pub event_id: U256,
    pub zone: Option<String>,
    pub original_buyer: ActorId,
    pub current_owner: ActorId,
    pub used: bool,
    pub minted_at: u64,
}
```

#### `ResaleConfig`
Configuración de reventa:
```rust
pub struct ResaleConfig {
    pub enabled: bool,
    pub max_price: Option<U256>,
    pub resale_start_time: Option<u64>,
    pub resale_end_time: Option<u64>,
}
```

#### `CommissionConfig`
Configuración de comisiones (en basis points, 10000 = 100%):
```rust
pub struct CommissionConfig {
    pub seller_percentage: u16,
    pub organizer_percentage: u16,
    pub platform_percentage: u16,
}
```

## Funciones Públicas

### Inicialización
```rust
pub fn new(admin: ActorId, vmt_contract: ActorId, platform_fee_recipient: ActorId) -> Self
```
Inicializa el contrato con:
- `admin`: Dirección del administrador
- `vmt_contract`: Dirección del contrato VMT para NFTs
- `platform_fee_recipient`: Dirección que recibe comisiones de plataforma

### Gestión de Eventos

#### `create_event`
Crea un nuevo evento.
- **Permisos**: Organizador o Admin
- **Parámetros**:
  - `organizer`: Dirección del organizador
  - `metadata_hash`: Hash de metadata off-chain (32 bytes)
  - `event_start_time`: Timestamp de inicio del evento
  - `tickets_total`: Número total de tickets disponibles
  - `resale_config`: Configuración de reventa
  - `commission_config`: Configuración de comisiones

#### `update_resale_config`
Actualiza la configuración de reventa de un evento.
- **Permisos**: Organizador del evento o Admin

#### `update_commission_config`
Actualiza la configuración de comisiones de un evento.
- **Permisos**: Organizador del evento o Admin
- **Validación**: La suma de porcentajes debe ser 10000 (100%)

#### `set_event_active`
Activa o desactiva un evento.
- **Permisos**: Organizador del evento o Admin

### Venta Primaria

#### `mint_tickets`
Mintea tickets en venta primaria (batch minting).
- **Permisos**: Organizador del evento o Admin
- **Parámetros**:
  - `event_id`: ID del evento
  - `buyer`: Dirección del comprador
  - `amount`: Cantidad de tickets a mintear
  - `zones`: Vector opcional de zonas/asientos
- **Características**:
  - Soporta batch minting (múltiples tickets en una transacción)
  - Valida disponibilidad de tickets
  - Crea NFTs en el contrato VMT
  - Emite evento `TicketsMinted`

### Reventa

#### `resell_ticket`
Revende un ticket a través del contrato.
- **Permisos**: Propietario actual del ticket
- **Parámetros**:
  - `ticket_id`: ID del ticket
  - `buyer`: Dirección del comprador
  - `price`: Precio de reventa
- **Validaciones**:
  - Ticket no usado
  - Reventa habilitada para el evento
  - Precio dentro del máximo permitido
  - Dentro de la ventana de tiempo (si aplica)
- **Proceso**:
  1. Transfiere el NFT del vendedor al comprador
  2. Calcula y distribuye comisiones
  3. Actualiza propietario del ticket
  4. Emite evento `TicketResold`

### Uso de Tickets

#### `mark_ticket_used`
Marca un ticket como usado.
- **Permisos**: Escáner autorizado o Admin
- **Efectos**:
  - Ticket marcado como usado
  - Ticket no puede revenderse ni transferirse
  - Emite evento `TicketUsed`

### Gestión de Roles

#### `add_organizer` / `remove_organizer`
Gestiona organizadores autorizados.
- **Permisos**: Admin

#### `add_scanner` / `remove_scanner`
Gestiona escáneres autorizados.
- **Permisos**: Admin

### Consultas

#### `get_ticket(ticket_id: U256) -> Option<Ticket>`
Obtiene información de un ticket específico.

#### `get_event(event_id: U256) -> Option<EventConfig>`
Obtiene configuración de un evento.

#### `get_event_tickets(event_id: U256) -> Vec<U256>`
Obtiene lista de IDs de tickets de un evento.

#### `get_user_tickets(user: ActorId) -> Vec<Ticket>`
Obtiene todos los tickets de un usuario.

#### `get_event_stats(event_id: U256) -> Option<EventStats>`
Obtiene estadísticas de un evento (total, minteados, usados).

#### `is_organizer(address: ActorId) -> bool`
Verifica si una dirección es organizador.

#### `is_scanner(address: ActorId) -> bool`
Verifica si una dirección es escáner.

#### `get_storage() -> State`
Obtiene el estado completo del contrato.

## Eventos Emitidos

### `EventCreated`
Emitido cuando se crea un nuevo evento.
```rust
EventCreated {
    event_id: U256,
    organizer: ActorId,
    metadata_hash: [u8; 32],
    event_start_time: u64,
}
```

### `TicketsMinted`
Emitido cuando se mintean tickets en venta primaria.
```rust
TicketsMinted {
    event_id: U256,
    ticket_ids: Vec<U256>,
    buyer: ActorId,
    amount: U256,
}
```

### `TicketResold`
Emitido cuando se revende un ticket.
```rust
TicketResold {
    ticket_id: U256,
    event_id: U256,
    seller: ActorId,
    buyer: ActorId,
    price: U256,
    seller_share: U256,
    organizer_share: U256,
    platform_share: U256,
}
```

### `TicketUsed`
Emitido cuando se marca un ticket como usado.
```rust
TicketUsed {
    ticket_id: U256,
    event_id: U256,
    scanner: ActorId,
}
```

### `OrganizerAdded` / `OrganizerRemoved`
Emitidos cuando se agrega o remueve un organizador.

### `ScannerAdded` / `ScannerRemoved`
Emitidos cuando se agrega o remueve un escáner.

### `EventConfigUpdated`
Emitido cuando se actualiza la configuración de un evento.

## Errores

El contrato define los siguientes errores:
- `Unauthorized`: Operación no autorizada
- `EventNotFound`: Evento no encontrado
- `TicketNotFound`: Ticket no encontrado
- `TicketAlreadyUsed`: Ticket ya fue usado
- `TicketNotOwned`: El usuario no es propietario del ticket
- `InvalidResaleConfig`: Configuración de reventa inválida
- `InvalidCommissionConfig`: Configuración de comisiones inválida
- `ResaleDisabled`: Reventa deshabilitada para este evento
- `ResaleWindowClosed`: Fuera de la ventana de tiempo de reventa
- `PriceExceedsMaximum`: Precio excede el máximo permitido
- `InvalidAmount`: Cantidad inválida
- `ReentrancyDetected`: Intento de reentrancy detectado
- `InvalidInput`: Input inválido
- `NotEnoughTickets`: No hay suficientes tickets disponibles
- `EventNotActive`: Evento no está activo
- `TransferBlocked`: Transferencia bloqueada

## Seguridad

### Protecciones Implementadas

1. **Reentrancy Guard**: Todas las funciones críticas están protegidas contra reentrancy
2. **Validación de Inputs**: Validación exhaustiva de todos los parámetros
3. **Control de Permisos**: Verificación estricta de roles antes de operaciones sensibles
4. **Validación de Estado**: Verificación de estado antes de operaciones (ticket usado, evento activo, etc.)
5. **Eventos On-Chain**: Todos los cambios críticos se registran en eventos para auditoría

### Bloqueo de Transferencias Directas

**Importante**: Los tickets NFT NO pueden transferirse directamente usando las funciones estándar de transferencia del contrato VMT. Solo pueden transferirse a través de la función `resell_ticket` del contrato de ticketing.

Para implementar esto completamente, se requiere:
1. Que el contrato VMT tenga un sistema de permisos/roles
2. Que solo este contrato tenga permisos de transferencia para los tokens de tickets
3. O implementar un hook en el contrato VMT que valide transferencias

## Integración con VMT

El contrato utiliza el contrato VMT (Variable Multi Token) para los NFTs de tickets. Se requiere:

1. **Permisos de Minter**: El contrato debe tener permisos para mintear tokens
2. **Permisos de Transfer**: El contrato debe poder transferir tokens en nombre de los usuarios
3. **Token IDs**: Cada ticket usa su `ticket_id` como `token_id` en VMT

### Flujo de Minting

1. El contrato crea la estructura `Ticket` internamente
2. Llama a `MintBatch` en el contrato VMT con los `ticket_id` como `token_id`
3. Los NFTs se mintean al `buyer` especificado

### Flujo de Reventa

1. El contrato valida todas las condiciones de reventa
2. Llama a `TransferFrom` en el contrato VMT para transferir el NFT
3. Actualiza el propietario en la estructura `Ticket`
4. Emite evento con información de comisiones

## Notas de Implementación

### Timestamp

La función `current_timestamp()` actualmente retorna un placeholder. En producción, debe implementarse usando la API real de Vara Network para obtener el timestamp del bloque actual.

### Pagos en Reventa

El contrato actualmente no maneja pagos directamente. Las opciones son:

1. **Sistema de Escrow**: Implementar un contrato de escrow que maneje los pagos
2. **Pago Previo**: El comprador envía el pago antes de llamar a `resell_ticket`
3. **Integración con Token**: Si se usa un token nativo de Vara, integrar el pago en la función de reventa

### Metadata Off-Chain

El contrato almacena solo el hash de la metadata. La metadata completa (nombre del evento, descripción, imagen, etc.) debe almacenarse off-chain (IPFS, servidor centralizado, etc.) y el hash se usa para verificar integridad.

## Ejemplo de Uso

### 1. Crear un Evento

```rust
let resale_config = ResaleConfig {
    enabled: true,
    max_price: Some(U256::from(1000)), // Precio máximo 1000 unidades
    resale_start_time: Some(1000000), // Inicio de reventa
    resale_end_time: Some(2000000),   // Fin de reventa
};

let commission_config = CommissionConfig {
    seller_percentage: 8500,    // 85% para el vendedor
    organizer_percentage: 1000,  // 10% para el organizador
    platform_percentage: 500,   // 5% para la plataforma
};

contract.create_event(
    organizer_address,
    metadata_hash,
    event_start_timestamp,
    U256::from(1000), // 1000 tickets
    resale_config,
    commission_config,
);
```

### 2. Mintear Tickets

```rust
let zones = vec![
    Some("VIP A1".to_string()),
    Some("VIP A2".to_string()),
];

contract.mint_tickets(
    event_id,
    buyer_address,
    U256::from(2), // 2 tickets
    zones,
).await;
```

### 3. Revender un Ticket

```rust
contract.resell_ticket(
    ticket_id,
    new_buyer_address,
    U256::from(500), // Precio 500 unidades
).await;
```

### 4. Marcar Ticket como Usado

```rust
contract.mark_ticket_used(ticket_id);
```

## Consideraciones para Producción

1. **Auditoría de Seguridad**: Realizar auditoría completa antes de desplegar
2. **Tests Exhaustivos**: Cubrir todos los casos edge y escenarios de ataque
3. **Upgradeability**: Considerar patrón de proxy para actualizaciones
4. **Gas Optimization**: Optimizar funciones críticas para reducir costos
5. **Frontend Integration**: Integrar con frontend para UX fluida
6. **Monitoring**: Implementar monitoreo de eventos y métricas
7. **Documentación de API**: Documentar todas las funciones para desarrolladores

## Licencia

Este contrato está diseñado para producción. Asegúrese de revisar y auditar antes de desplegar en mainnet.

