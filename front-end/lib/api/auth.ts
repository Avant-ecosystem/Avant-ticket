import { apiClient } from './client';
import type { AuthResponse, User } from '../types';

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    dni: string;
    username?: string;
    pais: string;
    provincia: string;
    ciudad: string;
    calle: string;
    numero: string;
    codigoPostal: string;
    walletAddress?: string;
  }): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/register', data);
  },

  login: async (emailOrUsername: string, password: string): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', {
      emailOrUsername,
      password,
    });
  },

  getMe: async (): Promise<User> => {
    return apiClient.get<User>('/users/me');
  },
};

