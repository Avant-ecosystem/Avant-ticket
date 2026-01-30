import { apiClient } from './client';

/* ======================================================
   TYPES
====================================================== */

export interface OxaPayCheckoutResponse {
  payLink: string;
  trackId: string;
}

export interface OxaPayItem {
  title: string;
  quantity: number;
  unitPrice: number;
  zoneId?: string;
}

export interface OxaPayCheckoutInput {
  buyerId: string;
  organizerId: string;
  eventId: string;
  items: OxaPayItem[];
}

/* ======================================================
   API
====================================================== */

export const oxapayApi = {
  /* =========================
     PAYMENTS
  ========================== */

  checkout: async (
    data: OxaPayCheckoutInput,
  ): Promise<OxaPayCheckoutResponse> => {
    return apiClient.post<OxaPayCheckoutResponse>(
      '/oxapay/checkout',
      data,
    );
  },
};
