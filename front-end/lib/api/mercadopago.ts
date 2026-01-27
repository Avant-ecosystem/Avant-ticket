import { apiClient } from './client';

/* ======================================================
   TYPES
====================================================== */

export interface MercadoPagoStatus {
  connected: boolean;
  accountId?: string;
  email?: string;
  tokenExpiresAt?: string;
}

export interface MercadoPagoAuthorizeResponse {
  url: string;
}

export interface MercadoPagoCheckoutResponse {
  preferenceId: string;
  init_point?: string;
  sandbox_init_point?: string;
}

export interface MercadoPagoItem {
  title: string;
  quantity: number;
  unitPrice: number;
  zoneId?: string;
}

/* ======================================================
   API
====================================================== */

export const mercadoPagoApi = {
  /* =========================
     OAUTH
  ========================== */

  /**
   * Paso 1: obtener URL de autorización
   * GET /mercado-pago/authorize?organizerId=UUID
   */
  authorize: async (): Promise<MercadoPagoAuthorizeResponse> => {
    const organizerId = localStorage.getItem('id');
    return apiClient.get<MercadoPagoAuthorizeResponse>(
      `/mercado-pago/authorize?organizerId=${organizerId}`,
    );
  },

  /**
   * Paso 2: conectar cuenta (callback)
   * El organizerId viaja en `state`
   *
   * GET /mercado-pago/connect?code=XXX
   */
  connect: async (code: string): Promise<void> => {
    return apiClient.get<void>(
      `/mercado-pago/connect?code=${code}`,
    );
  },

  status: async (): Promise<MercadoPagoStatus> => {
    const organizerId = localStorage.getItem('id');
    return apiClient.get<MercadoPagoStatus>(
      `/mercado-pago/status?organizerId=${organizerId}`,
    );
  },

  /* =========================
     PAYMENTS
  ========================== */

  checkout: async (data: {
    buyerId: string;
    organizerId: string;
    eventId: string;
    items: MercadoPagoItem[];
  }): Promise<MercadoPagoCheckoutResponse> => {
    return apiClient.post<MercadoPagoCheckoutResponse>(
      '/mercado-pago/checkout',
      data,
    );
  },
};
