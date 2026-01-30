import { storage } from '../services/storage';

const TOKEN_KEY = 'auth.token';
const STAFF_ID_KEY = 'auth.staffId';
const STAFF_ROLE_KEY = 'auth.staffRole';
const EVENT_ID_KEY = 'auth.eventId';
const EVENT_SECRET_KEY = 'auth.eventSecret';

export async function setAuth(
  token: string,
  staffId: string,
  role?: string // 👈 opcional
) {
  await storage.secureSet(TOKEN_KEY, token);
  await storage.secureSet(STAFF_ID_KEY, staffId);

  if (role) {
    await storage.secureSet(STAFF_ROLE_KEY, role);
  }
}

export async function clearAuth() {
  await storage.secureDelete(TOKEN_KEY);
  await storage.secureDelete(STAFF_ID_KEY);
  await storage.secureDelete(STAFF_ROLE_KEY);
  await storage.secureDelete(EVENT_ID_KEY);
  await storage.secureDelete(EVENT_SECRET_KEY);
}

export async function getToken() {
  return storage.secureGet(TOKEN_KEY);
}

export async function getStaffId() {
  return storage.secureGet(STAFF_ID_KEY);
}

export async function getStaffRole() {
  return storage.secureGet(STAFF_ROLE_KEY);
}

export async function setSelectedEvent(eventId: string, secret: string) {
  await storage.secureSet(EVENT_ID_KEY, eventId);
  await storage.secureSet(EVENT_SECRET_KEY, secret);
}

export async function getSelectedEvent() {
  return storage.secureGet(EVENT_ID_KEY);
}

export async function getEventSecret() {
  return storage.secureGet(EVENT_SECRET_KEY);
}
