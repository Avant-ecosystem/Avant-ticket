# Ticket Marketplace

Servicio de Marketplace para reventa controlada de tickets NFT.

## Descripción

Este contrato maneja exclusivamente la reventa de tickets NFT. El contrato de Tickets es la fuente de verdad para:
- Propiedad de tickets
- Estado "used" de tickets
- Restricciones de transferencia
- Reglas del evento

## Funcionalidades

### Listado de Tickets
- Listar tickets para reventa
- Validar precio máximo del evento
- Validar ventana de tiempo de reventa
- Bloquear tickets mientras están listados

### Compra de Tickets
- Comprar tickets listados
- Distribución automática de pagos:
  - Vendedor
  - Organizador
  - Plataforma

### Cancelación
- Cancelar listados activos
- Desbloquear tickets

## Funciones Principales

- `list_ticket(ticket_id, price)` - Listar un ticket para reventa
- `buy_ticket(ticket_id)` - Comprar un ticket listado
- `cancel_listing(ticket_id)` - Cancelar un listado
- `get_listing(ticket_id)` - Consultar un listado
- `get_all_listings()` - Obtener todos los listados
- `get_seller_listings(seller)` - Obtener listados de un vendedor

## Integración

Este Marketplace interactúa con el contrato de Tickets para:
- Verificar propiedad actual
- Verificar que el ticket no esté usado
- Validar reglas del evento (reventa habilitada, precio máximo, ventana de tiempo)
- Transferir propiedad del ticket

Ver `INTEGRATION_GUIDE.md` para detalles de implementación de la integración.

## Eventos

- `TicketListed` - Ticket listado para reventa
- `TicketSold` - Ticket vendido (con detalles de comisiones)
- `ListingCancelled` - Listado cancelado

## Compilación

```bash
cargo build --release -p "ticket-marketplace"
```

## Notas

- Las funciones de interacción con el contrato de Tickets deben implementarse según la interfaz real
- El manejo de pagos debe implementarse según las necesidades del proyecto (escrow, pago previo, etc.)
- Ver `INTEGRATION_GUIDE.md` para detalles de implementación

