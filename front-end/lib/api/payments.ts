import { apiClient } from './client';

export interface PaymentStatusResponse {
  orderId: string;
  status: 
    | 'PENDING'
    | 'APPROVED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'REJECTED'
    | 'REFUNDED';
  paymentMethod?: string;
  currency: string;
  amount: number;
  lastUpdate: string;
}

export const paymentsApi = {
  // Detalle completo (success)
  getByOrderId: async (orderId: string) => {
    return apiClient.get(`/payments/${orderId}`);
  },

  // Status liviano (polling)
  getStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
    return apiClient.get<PaymentStatusResponse>(
      `/payments/status/${orderId}`,
    );
  },
};
