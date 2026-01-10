export interface SyncEventDto {
  eventId: string;
  organizer: string;
  metadataHash: string;
  eventStartTime: number;
  ticketsTotal: string;
  resaleConfig: {
    enabled: boolean;
    maxPrice?: string;
    resaleStartTime?: number;
    resaleEndTime?: number;
  };
  commissionConfig: {
    sellerPercentage: number;
    organizerPercentage: number;
    platformPercentage: number;
  };
}

