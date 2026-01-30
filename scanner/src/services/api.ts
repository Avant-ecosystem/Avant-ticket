import { getToken } from '../auth/authStore';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function apiRequest<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: any
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `API ${method} ${path} failed ${res.status}: ${text}`
    );
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return (await res.json()) as T;
}

/* =========================
   API CONTRACT
========================= */

export type LoginResponse = {
  access_token: string;
  user: {
    id: string;
    role: 'USER' | 'ORGANIZER' | 'ADMIN' | 'SCANNER';
    email: string;
  };
};

export const Api = {
  // 🔐 AUTH
  login: (emailOrUsername: string, password: string) =>
    apiRequest<LoginResponse>(
      '/auth/login',
      'POST',
      { emailOrUsername, password }
    ),

  // 🎫 EVENTS (staff only)
  listEvents: () =>
    apiRequest<
      Array<{
        id: string;
        name: string;
        secret: string;
        endsAt: string;
      }>
    >('/events/staff/me', 'GET'),

  // 🎟️ TICKETS
  downloadTickets: (eventId: string) =>
    apiRequest<
      Array<{
        ticketId: string;
        eventId: string;
        signature: string;
        status: 'unused' | 'used';
      }>
    >(`/events/${eventId}/tickets`, 'GET'),

  pushUsedTickets: (eventId: string, usedTicketIds: string[]) =>
    apiRequest<{ accepted: string[]; rejected: string[] }>(
      `/tickets/${eventId}/mark-used`,
      'POST',
      { ticketIds: usedTicketIds }
    ),

  clearLocalForEvent: (eventId: string) =>
    apiRequest<void>(
      `/events/${eventId}/tickets/clear`,
      'POST'
    ),
};
