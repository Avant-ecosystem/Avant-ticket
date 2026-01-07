# Ejemplo: Crear un Evento

Este documento muestra cómo crear un evento completo con toda su configuración.

## Estructura de Datos Necesarios

Para crear un evento necesitas:

1. **Organizador**: Dirección del organizador del evento
2. **Metadata Hash**: Hash SHA-256 de la metadata off-chain (32 bytes)
3. **Event Start Time**: Timestamp de inicio del evento (en segundos)
4. **Tickets Total**: Número total de tickets disponibles
5. **Resale Config**: Configuración de reventa
6. **Commission Config**: Configuración de comisiones

## Ejemplo Completo

### 1. Preparar la Metadata Off-Chain

Primero, crea un archivo JSON con la información del evento:

```json
{
  "name": "Concierto de Rock en Vara",
  "description": "El mejor concierto de rock del año con artistas internacionales",
  "location": "Estadio Vara, Ciudad Blockchain",
  "date": "2024-12-25",
  "time": "20:00",
  "image": "ipfs://QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
  "organizer": "Rock Events Vara",
  "category": "Música",
  "capacity": 10000
}
```

### 2. Calcular el Hash de la Metadata

```rust
use sha2::{Sha256, Digest};

// Leer el JSON de metadata
let metadata_json = r#"
{
  "name": "Concierto de Rock en Vara",
  "description": "El mejor concierto de rock del año",
  "location": "Estadio Vara, Ciudad Blockchain",
  "date": "2024-12-25",
  "time": "20:00"
}
"#;

// Calcular hash SHA-256
let mut hasher = Sha256::new();
hasher.update(metadata_json.as_bytes());
let hash_result = hasher.finalize();

// Convertir a [u8; 32]
let mut metadata_hash = [0u8; 32];
metadata_hash.copy_from_slice(&hash_result[..]);
```

### 3. Configurar la Reventa

```rust
use sails_rs::U256;

// Opción 1: Reventa habilitada con precio máximo y ventana de tiempo
let resale_config = ResaleConfig {
    enabled: true,
    max_price: Some(U256::from(1000_000_000_000)), // 1000 tokens (ajustar según tu token)
    resale_start_time: Some(1_700_000_000), // Timestamp de inicio de reventa
    resale_end_time: Some(1_735_000_000),   // Timestamp de fin de reventa
};

// Opción 2: Reventa habilitada sin límites
let resale_config_unlimited = ResaleConfig {
    enabled: true,
    max_price: None,              // Sin límite de precio
    resale_start_time: None,      // Inmediato
    resale_end_time: None,        // Sin límite de tiempo
};

// Opción 3: Reventa deshabilitada
let resale_config_disabled = ResaleConfig {
    enabled: false,
    max_price: None,
    resale_start_time: None,
    resale_end_time: None,
};
```

### 4. Configurar las Comisiones

Las comisiones se configuran en **basis points** (10000 = 100%).

```rust
// Ejemplo: 85% vendedor, 10% organizador, 5% plataforma
let commission_config = CommissionConfig {
    seller_percentage: 8500,    // 85%
    organizer_percentage: 1000,  // 10%
    platform_percentage: 500,    // 5%
    // Total: 10000 (100%) ✓
};

// Ejemplo: 90% vendedor, 7% organizador, 3% plataforma
let commission_config_2 = CommissionConfig {
    seller_percentage: 9000,    // 90%
    organizer_percentage: 700,   // 7%
    platform_percentage: 300,   // 3%
    // Total: 10000 (100%) ✓
};

// Ejemplo: 80% vendedor, 15% organizador, 5% plataforma
let commission_config_3 = CommissionConfig {
    seller_percentage: 8000,    // 80%
    organizer_percentage: 1500,  // 15%
    platform_percentage: 500,   // 5%
    // Total: 10000 (100%) ✓
};
```

### 5. Llamar a create_event

```rust
use sails_rs::{ActorId, U256};

// Dirección del organizador (ejemplo)
let organizer: ActorId = ActorId::from([1u8; 32]); // Reemplazar con dirección real

// Hash de metadata (calculado anteriormente)
let metadata_hash: [u8; 32] = metadata_hash; // Del paso 2

// Timestamp de inicio del evento (25 de diciembre de 2024, 20:00 UTC)
let event_start_time: u64 = 1_735_000_000; // Ajustar según fecha real

// Número total de tickets
let tickets_total = U256::from(10000);

// Llamar a la función
contract.create_event(
    organizer,
    metadata_hash,
    event_start_time,
    tickets_total,
    resale_config,
    commission_config,
);
```

## Ejemplo Completo en un Solo Bloque

```rust
use sails_rs::{ActorId, U256};
use sha2::{Sha256, Digest};

fn create_rock_concert_event(contract: &mut TicketService, organizer: ActorId) {
    // 1. Metadata del evento
    let metadata_json = r#"
    {
        "name": "Concierto de Rock en Vara",
        "description": "El mejor concierto de rock del año con artistas internacionales",
        "location": "Estadio Vara, Ciudad Blockchain",
        "date": "2024-12-25",
        "time": "20:00",
        "image": "ipfs://QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx",
        "organizer": "Rock Events Vara",
        "category": "Música",
        "capacity": 10000
    }
    "#;
    
    // 2. Calcular hash de metadata
    let mut hasher = Sha256::new();
    hasher.update(metadata_json.as_bytes());
    let hash_result = hasher.finalize();
    let mut metadata_hash = [0u8; 32];
    metadata_hash.copy_from_slice(&hash_result[..]);
    
    // 3. Configurar reventa
    let resale_config = ResaleConfig {
        enabled: true,
        max_price: Some(U256::from(1000_000_000_000)), // 1000 tokens
        resale_start_time: Some(1_700_000_000),        // Inicio: 2023-11-15
        resale_end_time: Some(1_735_000_000),          // Fin: 2024-12-24 (día antes del evento)
    };
    
    // 4. Configurar comisiones
    let commission_config = CommissionConfig {
        seller_percentage: 8500,    // 85% para el vendedor
        organizer_percentage: 1000,  // 10% para el organizador
        platform_percentage: 500,    // 5% para la plataforma
    };
    
    // 5. Parámetros del evento
    let event_start_time: u64 = 1_735_000_000; // 2024-12-25 20:00 UTC
    let tickets_total = U256::from(10000);
    
    // 6. Crear el evento
    contract.create_event(
        organizer,
        metadata_hash,
        event_start_time,
        tickets_total,
        resale_config,
        commission_config,
    );
    
    println!("Evento creado exitosamente!");
}
```

## Ejemplo con Diferentes Escenarios

### Escenario 1: Evento Pequeño sin Reventa

```rust
let resale_config = ResaleConfig {
    enabled: false,
    max_price: None,
    resale_start_time: None,
    resale_end_time: None,
};

let commission_config = CommissionConfig {
    seller_percentage: 0,        // No aplica (reventa deshabilitada)
    organizer_percentage: 0,      // No aplica
    platform_percentage: 0,      // No aplica
};

contract.create_event(
    organizer,
    metadata_hash,
    event_start_time,
    U256::from(100), // Solo 100 tickets
    resale_config,
    commission_config,
);
```

### Escenario 2: Evento VIP con Reventa Premium

```rust
let resale_config = ResaleConfig {
    enabled: true,
    max_price: Some(U256::from(5000_000_000_000)), // Precio máximo alto: 5000 tokens
    resale_start_time: Some(1_700_000_000),
    resale_end_time: Some(1_735_000_000),
};

let commission_config = CommissionConfig {
    seller_percentage: 7000,    // 70% vendedor
    organizer_percentage: 2500,  // 25% organizador (mayor comisión)
    platform_percentage: 500,   // 5% plataforma
};

contract.create_event(
    organizer,
    metadata_hash,
    event_start_time,
    U256::from(50), // Solo 50 tickets VIP
    resale_config,
    commission_config,
);
```

### Escenario 3: Evento Masivo con Reventa Libre

```rust
let resale_config = ResaleConfig {
    enabled: true,
    max_price: None,              // Sin límite de precio
    resale_start_time: None,      // Reventa inmediata
    resale_end_time: None,        // Sin límite de tiempo
};

let commission_config = CommissionConfig {
    seller_percentage: 9000,    // 90% vendedor (incentiva reventa)
    organizer_percentage: 700,   // 7% organizador
    platform_percentage: 300,   // 3% plataforma
};

contract.create_event(
    organizer,
    metadata_hash,
    event_start_time,
    U256::from(50000), // 50,000 tickets
    resale_config,
    commission_config,
);
```

## Notas Importantes

1. **Metadata Hash**: Debe ser el hash SHA-256 del JSON de metadata. Este hash se almacena on-chain para verificar la integridad de la metadata off-chain.

2. **Basis Points**: Las comisiones deben sumar exactamente 10000 (100%). Si no, la transacción fallará.

3. **Timestamps**: Usa timestamps Unix en segundos. Puedes convertir fechas usando herramientas online o librerías de Rust.

4. **Permisos**: Solo un organizador autorizado o el admin puede crear eventos.

5. **Event ID**: Se genera automáticamente por el contrato. El primer evento será ID 1, el segundo ID 2, etc.

## Conversión de Fechas a Timestamps

```rust
// Ejemplo: 25 de diciembre de 2024, 20:00 UTC
// Puedes usar una librería como chrono o calcular manualmente
// Timestamp aproximado: 1_735_000_000

// Para calcular en Rust con chrono:
use chrono::{DateTime, Utc, NaiveDateTime};

let date_str = "2024-12-25 20:00:00";
let naive_dt = NaiveDateTime::parse_from_str(date_str, "%Y-%m-%d %H:%M:%S")
    .expect("Fecha inválida");
let dt = DateTime::<Utc>::from_utc(naive_dt, Utc);
let timestamp = dt.timestamp() as u64;
```

## Verificar el Evento Creado

Después de crear el evento, puedes consultarlo:

```rust
// Obtener información del evento
let event_id = U256::from(1); // ID del evento creado
let event_info = contract.get_event(event_id);

if let Some(event) = event_info {
    println!("Evento ID: {}", event.event_id);
    println!("Organizador: {:?}", event.organizer);
    println!("Tickets totales: {}", event.tickets_total);
    println!("Tickets minteados: {}", event.tickets_minted);
    println!("Activo: {}", event.active);
}
```


