export interface SyncEventDto {
  eventId: string;
  organizer: string;
  name: string;
  imageUrl: string;
  metadataHash: string;
  location: string;
  eventStartTime: number;
  eventEndTime: number;
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

