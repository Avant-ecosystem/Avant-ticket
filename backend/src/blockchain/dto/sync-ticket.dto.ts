// sync-ticket.dto.ts
export class SyncTicketDto {
  ticketId: string;
  eventId: string;
  currentOwner: string;
  originalBuyer: string;
  mintedAt: number; // timestamp en segundos
  used: boolean;
  zone?: string; // Nombre de la zona
  zonePrice?: string; // Precio de la zona (opcional)
  zoneCapacity?: string; // Capacidad de la zona (opcional)
}