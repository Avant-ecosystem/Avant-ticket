import { apiClient } from './client';
import type { Event, PaginatedResponse } from '../types';

export const eventsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Event>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    const queryString = query.toString();
    return apiClient.get<PaginatedResponse<Event>>(
      `/events${queryString ? `?${queryString}` : ''}`
    );
  },

  getById: async (id: string): Promise<Event> => {
    return apiClient.get<Event>(`/events/${id}`);
  },
  getStats: async (id: string): Promise<Event> => {
    return apiClient.get<Event>(`/events/${id}/stats`);
  },

  create: async (data: {
    nombre: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
    lugar: string;
    imagenUrl?: string;
    precio: number;
    stockTotal: number;
  }): Promise<Event> => {
    return apiClient.post<Event>('/events', data);
  },

  update: async (id: string, data: Partial<Event>): Promise<Event> => {
    return apiClient.put<Event>(`/events/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/events/${id}`);
  },
};

