import { apiClient } from './client';
import type { Ticket, PaginatedResponse, QRCode } from '../types';

export const ticketsApi = {
  getMyTickets: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Ticket>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    return apiClient.get<PaginatedResponse<Ticket>>(
      `/tickets/my-tickets${queryString ? `?${queryString}` : ''}`
    );
  },

  getById: async (id: string): Promise<Ticket> => {
    return apiClient.get<Ticket>(`/tickets/${id}`);
  },

  purchase: async (eventId: string, amount: number, zones: string[] , buyerWalletAddress  : string): Promise<Ticket[]> => {
    return apiClient.post<Ticket[]>(`/events/${eventId}/mint-tickets`, {
      amount,
      buyerWalletAddress,
      zones,
    });
  },

  getQR: async (ticketId: string): Promise<QRCode> => {
    return apiClient.get<QRCode>(`/tickets/${ticketId}/qr`);
  },
};

