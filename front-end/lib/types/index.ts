export type UserRole = 'USER' | 'ORGANIZER' | 'ADMIN' | 'SCANNER';

export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  walletAddress?: string;
  dni?: string;
  pais?: string;
  provincia?: string;
  ciudad?: string;
  calle?: string;
  numero?: string;
  codigoPostal?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: string;
  user: User;
}

export interface Zone {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  available: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id: string;
  name: string;
  blockchainEventId:string,
  description: string;
  eventStartTime: string;
  eventEndTime: string;
  location: string;
  imageUrl?: string;
  price: number;
  zones?: string[];
  ticketsTotal: number;
  ticketsRemaining: number;
  organizadorId: string;
  organizador?: User;
  resaleEnabled: boolean;
  resaleStartTime: string;
  resaleEndTime: string;
  maxResalePrice: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  walletAddress: string;
}

export interface Zone {
  id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  available: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  id: string;
  tokenId?: string;
  eventId: string;
  blockchainTicketId: string;
  event?: Event;
  compradorId: string;
  buyer: User;
  ownerId: string;
  comprador?: User;
  price: number;
  zone: Zone;
  status: string;
  revended: boolean;
  usedAt?: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListing {
  id: string;
  ticketId: string;
  ticket?: Ticket;
  sellerId: string;
  seller?: User;
  salePrice: number;
  active: boolean;
  listedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceConfig {
  id: string;
  eventId: string;
  event?: Event;
  resaleEnabled: boolean;
  maxResalePrice?: number;
  organizerPercentage: number;
  resaleStartTime: string;
  resaleEndTime: string;
  sellerPercentage: number;
  platformPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface QRCode {
  qrData: string;
qrImage:string  
  expiresAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

