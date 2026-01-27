import { apiClient } from './client';
import type { MarketplaceListing, MarketplaceConfig, PaginatedResponse } from '../types';

export const marketplaceApi = {
  getListings: async (params?: {
    page?: number;
    limit?: number;
    eventoId?: string;
  }): Promise<PaginatedResponse<MarketplaceListing>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.eventoId) query.append('eventoId', params.eventoId);
    
    const queryString = query.toString();
    return apiClient.get<PaginatedResponse<MarketplaceListing>>(
      `/marketplace${queryString ? `?${queryString}` : ''}`
    );
  },
  getListing: async (id: string): Promise<MarketplaceListing> => {
    return apiClient.get<MarketplaceListing>(`/marketplace/${id}`);
  },

  listTicket: async (ticketId: string, price: number): Promise<MarketplaceListing> => {
    return apiClient.post<MarketplaceListing>('/marketplace/listings', {
      ticketId,
      price,
    });
  },

  purchase: async (listingId: string): Promise<MarketplaceListing> => {
    return apiClient.post<MarketplaceListing>(`/marketplace/purchase`, {
      listingId,
    });
  },

  cancelListing: async (listingId: string): Promise<void> => {
    return apiClient.delete<void>(`/marketplace/${listingId}`);
  },

  getConfig: async (eventoId: string): Promise<MarketplaceConfig> => {
    return apiClient.get<MarketplaceConfig>(`/marketplace/config/${eventoId}`);
  },

  updateConfig: async (eventoId: string, data: {
    reventaHabilitada?: boolean;
    precioMaximo?: number;
    comisionOrganizador?: number;
    comisionPlataforma?: number;
  }): Promise<MarketplaceConfig> => {
    return apiClient.put<MarketplaceConfig>(`/marketplace/config/${eventoId}`, data);
  },
};

