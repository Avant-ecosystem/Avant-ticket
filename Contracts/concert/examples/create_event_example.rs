//! Ejemplo práctico de cómo crear un evento
//! 
//! Este archivo muestra cómo usar la función create_event del contrato

use sails_rs::{ActorId, U256};

// Importar los tipos del contrato (ajustar según tu estructura)
// use concert_app::{TicketService, ResaleConfig, CommissionConfig};

/// Ejemplo 1: Crear un evento de concierto con reventa controlada
pub fn example_rock_concert() {
    // Datos del evento
    let organizer: ActorId = ActorId::from([1u8; 32]); // Reemplazar con dirección real
    
    // Hash de metadata (debe calcularse desde el JSON off-chain)
    // Para este ejemplo, usamos un hash de ejemplo
    let metadata_hash: [u8; 32] = [
        0x5a, 0x8b, 0x2f, 0x3c, 0x9d, 0x1e, 0x4a, 0x7f,
        0x6b, 0x3c, 0x8d, 0x2e, 0x9f, 0x1a, 0x5b, 0x7c,
        0x4d, 0x8e, 0x2f, 0x3a, 0x9b, 0x1c, 0x6d, 0x5e,
        0x7f, 0x2a, 0x8c, 0x3d, 0x9e, 0x1b, 0x4c, 0x6f,
    ];
    
    // Timestamp: 25 de diciembre de 2024, 20:00 UTC
    // Puedes obtenerlo de: https://www.epochconverter.com/
    let event_start_time: u64 = 1_735_000_000;
    
    // 10,000 tickets disponibles
    let tickets_total = U256::from(10000);
    
    // Configuración de reventa
    let resale_config = ResaleConfig {
        enabled: true,
        max_price: Some(U256::from(1000_000_000_000)), // Precio máximo: 1000 tokens
        resale_start_time: Some(1_700_000_000),        // Inicio: 15 de noviembre 2023
        resale_end_time: Some(1_735_000_000),          // Fin: 24 de diciembre 2024
    };
    
    // Configuración de comisiones (en basis points: 10000 = 100%)
    let commission_config = CommissionConfig {
        seller_percentage: 8500,    // 85% para el vendedor
        organizer_percentage: 1000,  // 10% para el organizador
        platform_percentage: 500,    // 5% para la plataforma
    };
    
    // Llamar a create_event
    // contract.create_event(
    //     organizer,
    //     metadata_hash,
    //     event_start_time,
    //     tickets_total,
    //     resale_config,
    //     commission_config,
    // );
    
    println!("✅ Evento de concierto configurado correctamente");
}

/// Ejemplo 2: Crear un evento pequeño sin reventa
pub fn example_small_event_no_resale() {
    let organizer: ActorId = ActorId::from([2u8; 32]);
    let metadata_hash: [u8; 32] = [0u8; 32]; // Hash de ejemplo
    
    let event_start_time: u64 = 1_735_000_000;
    let tickets_total = U256::from(100); // Solo 100 tickets
    
    // Reventa deshabilitada
    let resale_config = ResaleConfig {
        enabled: false,
        max_price: None,
        resale_start_time: None,
        resale_end_time: None,
    };
    
    // Comisiones no aplican si no hay reventa, pero deben sumar 10000
    let commission_config = CommissionConfig {
        seller_percentage: 0,
        organizer_percentage: 0,
        platform_percentage: 0,
    };
    
    // contract.create_event(
    //     organizer,
    //     metadata_hash,
    //     event_start_time,
    //     tickets_total,
    //     resale_config,
    //     commission_config,
    // );
    
    println!("✅ Evento pequeño sin reventa configurado");
}

/// Ejemplo 3: Crear un evento VIP con reventa premium
pub fn example_vip_event() {
    let organizer: ActorId = ActorId::from([3u8; 32]);
    let metadata_hash: [u8; 32] = [0u8; 32];
    
    let event_start_time: u64 = 1_735_000_000;
    let tickets_total = U256::from(50); // Solo 50 tickets VIP
    
    // Reventa con precio máximo alto
    let resale_config = ResaleConfig {
        enabled: true,
        max_price: Some(U256::from(5000_000_000_000)), // Precio máximo: 5000 tokens
        resale_start_time: Some(1_700_000_000),
        resale_end_time: Some(1_735_000_000),
    };
    
    // Comisiones más favorables para el organizador en eventos premium
    let commission_config = CommissionConfig {
        seller_percentage: 7000,    // 70% vendedor
        organizer_percentage: 2500,  // 25% organizador
        platform_percentage: 500,    // 5% plataforma
    };
    
    // contract.create_event(
    //     organizer,
    //     metadata_hash,
    //     event_start_time,
    //     tickets_total,
    //     resale_config,
    //     commission_config,
    // );
    
    println!("✅ Evento VIP configurado");
}

/// Ejemplo 4: Crear un evento masivo con reventa libre
pub fn example_massive_event() {
    let organizer: ActorId = ActorId::from([4u8; 32]);
    let metadata_hash: [u8; 32] = [0u8; 32];
    
    let event_start_time: u64 = 1_735_000_000;
    let tickets_total = U256::from(50000); // 50,000 tickets
    
    // Reventa sin restricciones
    let resale_config = ResaleConfig {
        enabled: true,
        max_price: None,              // Sin límite de precio
        resale_start_time: None,      // Reventa inmediata
        resale_end_time: None,        // Sin límite de tiempo
    };
    
    // Comisiones que incentivan la reventa
    let commission_config = CommissionConfig {
        seller_percentage: 9000,    // 90% vendedor
        organizer_percentage: 700,   // 7% organizador
        platform_percentage: 300,   // 3% plataforma
    };
    
    // contract.create_event(
    //     organizer,
    //     metadata_hash,
    //     event_start_time,
    //     tickets_total,
    //     resale_config,
    //     commission_config,
    // );
    
    println!("✅ Evento masivo configurado");
}

/// Función helper para calcular hash de metadata
/// 
/// # Ejemplo
/// ```
/// let metadata_json = r#"{"name": "Concierto", "date": "2024-12-25"}"#;
/// let hash = calculate_metadata_hash(metadata_json);
/// ```
pub fn calculate_metadata_hash(metadata_json: &str) -> [u8; 32] {
    use sha2::{Sha256, Digest};
    
    let mut hasher = Sha256::new();
    hasher.update(metadata_json.as_bytes());
    let hash_result = hasher.finalize();
    
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&hash_result[..]);
    hash
}

/// Ejemplo completo con cálculo de hash
pub fn example_with_hash_calculation() {
    // 1. Crear metadata JSON
    let metadata_json = r#"
    {
        "name": "Concierto de Rock en Vara",
        "description": "El mejor concierto de rock del año",
        "location": "Estadio Vara, Ciudad Blockchain",
        "date": "2024-12-25",
        "time": "20:00",
        "organizer": "Rock Events Vara",
        "category": "Música"
    }
    "#;
    
    // 2. Calcular hash
    let metadata_hash = calculate_metadata_hash(metadata_json);
    
    // 3. Configurar evento
    let organizer: ActorId = ActorId::from([1u8; 32]);
    let event_start_time: u64 = 1_735_000_000;
    let tickets_total = U256::from(10000);
    
    let resale_config = ResaleConfig {
        enabled: true,
        max_price: Some(U256::from(1000_000_000_000)),
        resale_start_time: Some(1_700_000_000),
        resale_end_time: Some(1_735_000_000),
    };
    
    let commission_config = CommissionConfig {
        seller_percentage: 8500,
        organizer_percentage: 1000,
        platform_percentage: 500,
    };
    
    // 4. Crear evento
    // contract.create_event(
    //     organizer,
    //     metadata_hash,
    //     event_start_time,
    //     tickets_total,
    //     resale_config,
    //     commission_config,
    // );
    
    println!("✅ Evento creado con hash calculado correctamente");
    println!("Hash: {:?}", metadata_hash);
}

// Nota: Estos tipos deben importarse del contrato
// Por ahora los definimos aquí para el ejemplo
#[derive(Debug, Clone)]
pub struct ResaleConfig {
    pub enabled: bool,
    pub max_price: Option<U256>,
    pub resale_start_time: Option<u64>,
    pub resale_end_time: Option<u64>,
}

#[derive(Debug, Clone)]
pub struct CommissionConfig {
    pub seller_percentage: u16,
    pub organizer_percentage: u16,
    pub platform_percentage: u16,
}


