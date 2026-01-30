import { Api } from '../services/api';
import { setAuth, setSelectedEvent } from './authStore';


type AuthState = {
  token: string;
  userId: string;
  role: 'USER' | 'ORGANIZER' | 'ADMIN' | 'SCANNER';
};


export async function loginStaff(
  emailOrUsername: string,
  password: string
) {
  const res = await Api.login(emailOrUsername, password);

  await setAuth(
    res.access_token, // ✅ token  real
    res.user.id,      // ✅ id real del staff
    res.user.role     // (opcional pero MUY útil)
  );

  return res.user;
}

export async function selectEvent(eventId: string, secret: string) {
  await setSelectedEvent(eventId, secret);
}
