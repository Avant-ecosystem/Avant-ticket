export interface SyncTicketDto {
  ticketId: string;
  eventId: string;
  originalBuyer: string;
  currentOwner: string;
  zone?: string;
  used: boolean;
  mintedAt: number;
}

