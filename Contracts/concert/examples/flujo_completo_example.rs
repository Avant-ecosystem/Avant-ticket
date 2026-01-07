//! Ejemplo completo del flujo del sistema de ticketing
//! 
//! Este archivo muestra el flujo completo desde crear un evento
//! hasta usar los tickets en el evento

use sails_rs::{ActorId, U256};

/// Ejemplo completo del flujo del sistema
pub async fn ejemplo_flujo_completo() {
    println!("🎫 Iniciando flujo completo del sistema de ticketing\n");
    
    // ============================================
    // PASO 1: CREAR EVENTO
    // ============================================
    println!("📅 PASO 1: Crear Evento");
    println!("─────────────────────────────────────");
    
    let organizer: ActorId = ActorId::from([1u8; 32]);
    let metadata_hash: [u8; 32] = [0x5a; 32]; // Hash de ejemplo
    
    // Timestamp: 25 de diciembre de 2024, 20:00 UTC
    let event_start_time: u64 = 1_735_000_000;
    let tickets_total = U256::from(100);
    
    // Configurar reventa
    let resale_config = ResaleConfig {
        enabled: true,
        max_price: Some(U256::from(1000_000_000_000)), // Precio máximo
        resale_start_time: Some(1_700_000_000),
        resale_end_time: Some(1_735_000_000),
    };
    
    // Configurar comisiones
    let commission_config = CommissionConfig {
        seller_percentage: 8500,
        organizer_percentage: 1000,
        platform_percentage: 500,
    };
    
    // Crear evento
    // contract.create_event(
    //     organizer,
    //     metadata_hash,
    //     event_start_time,
    //     tickets_total,
    //     resale_config,
    //     commission_config,
    // );
    
    let event_id = U256::from(1); // ID asignado por el contrato
    println!("✅ Evento creado con ID: {}\n", event_id);
    
    // ============================================
    // PASO 2: VENTA PRIMARIA - Mintear Tickets
    // ============================================
    println!("🎟️ PASO 2: Venta Primaria - Mintear Tickets");
    println!("─────────────────────────────────────");
    
    let buyer_1: ActorId = ActorId::from([10u8; 32]);
    let buyer_2: ActorId = ActorId::from([20u8; 32]);
    let buyer_3: ActorId = ActorId::from([30u8; 32]);
    
    // Mintear 3 tickets para buyer_1
    println!("Minteando 3 tickets para buyer_1...");
    // contract.mint_tickets(
    //     event_id,
    //     buyer_1,
    //     U256::from(3),
    //     vec![
    //         Some("VIP A1".to_string()),
    //         Some("VIP A2".to_string()),
    //         Some("VIP A3".to_string()),
    //     ],
    // ).await;
    
    let ticket_id_1 = U256::from(1);
    let ticket_id_2 = U256::from(2);
    let ticket_id_3 = U256::from(3);
    println!("✅ Tickets minteados: {}, {}, {}", ticket_id_1, ticket_id_2, ticket_id_3);
    
    // Mintear 2 tickets para buyer_2
    println!("Minteando 2 tickets para buyer_2...");
    // contract.mint_tickets(
    //     event_id,
    //     buyer_2,
    //     U256::from(2),
    //     vec![],
    // ).await;
    
    let ticket_id_4 = U256::from(4);
    let ticket_id_5 = U256::from(5);
    println!("✅ Tickets minteados: {}, {}\n", ticket_id_4, ticket_id_5);
    
    // ============================================
    // PASO 3: CONSULTAR ESTADO INICIAL
    // ============================================
    println!("📊 PASO 3: Consultar Estado Inicial");
    println!("─────────────────────────────────────");
    
    // Consultar evento
    // let event = contract.get_event(event_id);
    // if let Some(event) = event {
    //     println!("Evento ID: {}", event.event_id);
    //     println!("Tickets totales: {}", event.tickets_total);
    //     println!("Tickets minteados: {}", event.tickets_minted);
    // }
    
    // Consultar tickets de buyer_1
    // let user_tickets = contract.get_user_tickets(buyer_1);
    // println!("buyer_1 tiene {} tickets", user_tickets.len());
    
    println!("✅ Estado consultado\n");
    
    // ============================================
    // PASO 4: REVENTA DE TICKETS
    // ============================================
    println!("💰 PASO 4: Reventa de Tickets");
    println!("─────────────────────────────────────");
    
    let buyer_4: ActorId = ActorId::from([40u8; 32]);
    let price = U256::from(500_000_000_000); // 500 tokens
    
    // buyer_1 revende ticket_id_1 a buyer_4
    println!("buyer_1 revende ticket {} a buyer_4 por {} tokens", ticket_id_1, price);
    // contract.resell_ticket(
    //     ticket_id_1,
    //     buyer_4,
    //     price,
    // ).await;
    
    println!("✅ Ticket {} revendido exitosamente", ticket_id_1);
    
    // Verificar nuevo propietario
    // let ticket = contract.get_ticket(ticket_id_1);
    // if let Some(ticket) = ticket {
    //     println!("Nuevo propietario: {:?}", ticket.current_owner);
    //     println!("Comprador original: {:?}", ticket.original_buyer);
    // }
    
    println!();
    
    // buyer_4 revende el mismo ticket a buyer_5
    let buyer_5: ActorId = ActorId::from([50u8; 32]);
    let new_price = U256::from(600_000_000_000); // 600 tokens
    
    println!("buyer_4 revende ticket {} a buyer_5 por {} tokens", ticket_id_1, new_price);
    // contract.resell_ticket(
    //     ticket_id_1,
    //     buyer_5,
    //     new_price,
    // ).await;
    
    println!("✅ Ticket {} revendido nuevamente\n", ticket_id_1);
    
    // ============================================
    // PASO 5: USO DE TICKETS EN EL EVENTO
    // ============================================
    println!("🎪 PASO 5: Uso de Tickets en el Evento");
    println!("─────────────────────────────────────");
    
    // Marcar tickets como usados
    println!("Marcando tickets como usados...");
    
    // contract.mark_ticket_used(ticket_id_1);
    println!("✅ Ticket {} marcado como usado", ticket_id_1);
    
    // contract.mark_ticket_used(ticket_id_2);
    println!("✅ Ticket {} marcado como usado", ticket_id_2);
    
    // contract.mark_ticket_used(ticket_id_3);
    println!("✅ Ticket {} marcado como usado", ticket_id_3);
    
    // contract.mark_ticket_used(ticket_id_4);
    println!("✅ Ticket {} marcado como usado", ticket_id_4);
    
    // contract.mark_ticket_used(ticket_id_5);
    println!("✅ Ticket {} marcado como usado\n", ticket_id_5);
    
    // ============================================
    // PASO 6: AUDITORÍA POST-EVENTO
    // ============================================
    println!("📈 PASO 6: Auditoría Post-Evento");
    println!("─────────────────────────────────────");
    
    // Obtener estadísticas
    // let stats = contract.get_event_stats(event_id);
    // if let Some(stats) = stats {
    //     println!("Tickets totales: {}", stats.tickets_total);
    //     println!("Tickets minteados: {}", stats.tickets_minted);
    //     println!("Tickets usados: {}", stats.tickets_used);
    // }
    
    // Verificar todos los tickets
    // let all_tickets = contract.get_event_tickets(event_id);
    // for ticket_id in all_tickets {
    //     let ticket = contract.get_ticket(ticket_id);
    //     if let Some(ticket) = ticket {
    //         println!("Ticket {}: usado={}, owner={:?}", 
    //                  ticket.ticket_id, 
    //                  ticket.used,
    //                  ticket.current_owner);
    //     }
    // }
    
    println!("✅ Auditoría completada\n");
    
    println!("🎉 Flujo completo finalizado exitosamente!");
}

/// Ejemplo: Flujo con múltiples eventos
pub async fn ejemplo_multiple_eventos() {
    println!("🎫 Flujo con Múltiples Eventos\n");
    
    // Crear primer evento
    let event_id_1 = U256::from(1);
    println!("✅ Evento 1 creado");
    
    // Crear segundo evento
    let event_id_2 = U256::from(2);
    println!("✅ Evento 2 creado");
    
    // Mintear tickets para evento 1
    // contract.mint_tickets(event_id_1, buyer, U256::from(5), vec![]).await;
    println!("✅ Tickets minteados para evento 1");
    
    // Mintear tickets para evento 2
    // contract.mint_tickets(event_id_2, buyer, U256::from(3), vec![]).await;
    println!("✅ Tickets minteados para evento 2");
    
    // Consultar tickets de usuario (incluye tickets de ambos eventos)
    // let user_tickets = contract.get_user_tickets(buyer);
    // println!("Usuario tiene {} tickets en total", user_tickets.len());
}

/// Ejemplo: Flujo con reventa múltiple
pub async fn ejemplo_reventa_multiple() {
    println!("💰 Flujo con Reventa Múltiple\n");
    
    let event_id = U256::from(1);
    let ticket_id = U256::from(1);
    
    // Mintear ticket
    // contract.mint_tickets(event_id, buyer_1, U256::from(1), vec![]).await;
    println!("✅ Ticket minteado para buyer_1");
    
    // Primera reventa
    // contract.resell_ticket(ticket_id, buyer_2, U256::from(100)).await;
    println!("✅ Primera reventa: buyer_1 -> buyer_2");
    
    // Segunda reventa
    // contract.resell_ticket(ticket_id, buyer_3, U256::from(200)).await;
    println!("✅ Segunda reventa: buyer_2 -> buyer_3");
    
    // Tercera reventa
    // contract.resell_ticket(ticket_id, buyer_4, U256::from(300)).await;
    println!("✅ Tercera reventa: buyer_3 -> buyer_4");
    
    // Consultar historial (el original_buyer siempre se mantiene)
    // let ticket = contract.get_ticket(ticket_id);
    // if let Some(ticket) = ticket {
    //     println!("Comprador original: {:?}", ticket.original_buyer);
    //     println!("Propietario actual: {:?}", ticket.current_owner);
    // }
}

/// Ejemplo: Flujo con zonas/asientos
pub async fn ejemplo_con_zonas() {
    println!("🎯 Flujo con Zonas/Asientos\n");
    
    let event_id = U256::from(1);
    let buyer: ActorId = ActorId::from([10u8; 32]);
    
    // Mintear tickets con zonas específicas
    let zones = vec![
        Some("VIP A1".to_string()),
        Some("VIP A2".to_string()),
        Some("VIP A3".to_string()),
        Some("VIP A4".to_string()),
        Some("VIP A5".to_string()),
    ];
    
    // contract.mint_tickets(event_id, buyer, U256::from(5), zones).await;
    println!("✅ 5 tickets VIP minteados con zonas específicas");
    
    // Consultar cada ticket para ver su zona
    for i in 1..=5 {
        let ticket_id = U256::from(i);
        // let ticket = contract.get_ticket(ticket_id);
        // if let Some(ticket) = ticket {
        //     println!("Ticket {}: Zona {:?}", ticket.ticket_id, ticket.zone);
        // }
    }
}

/// Ejemplo: Manejo de errores
pub async fn ejemplo_manejo_errores() {
    println!("⚠️ Ejemplo de Manejo de Errores\n");
    
    let event_id = U256::from(1);
    let ticket_id = U256::from(999); // Ticket que no existe
    
    // Intentar revender un ticket que no existe
    // Esto debería fallar con TicketNotFound
    // match contract.resell_ticket(ticket_id, buyer, price).await {
    //     Ok(_) => println!("✅ Reventa exitosa"),
    //     Err(e) => println!("❌ Error: {:?}", e),
    // }
    
    // Intentar revender un ticket ya usado
    // Esto debería fallar con TicketAlreadyUsed
    // let used_ticket_id = U256::from(1);
    // match contract.resell_ticket(used_ticket_id, buyer, price).await {
    //     Ok(_) => println!("✅ Reventa exitosa"),
    //     Err(e) => println!("❌ Error: {:?}", e),
    // }
    
    // Intentar revender fuera de la ventana de tiempo
    // Esto debería fallar con ResaleWindowClosed
    // ...
}

// Tipos auxiliares (deben importarse del contrato en producción)
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


