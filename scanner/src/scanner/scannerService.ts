import { ticketRepository } from '../offline-db/ticketRepository';
import { parseQr, validateQr } from '../qr-validator/qrValidator';

export type ScanResult =
  | { ok: true; code: 'OK'; ticketId: string; eventId: string }
  | {
      ok: false;
      code:
        | 'INVALID_QR'
        | 'INVALID_SIGNATURE'
        | 'ALREADY_USED'
        | 'NOT_FOUND'
        | 'EXPIRED'
        | 'WRONG_EVENT';
    };

export async function handleScan(qrData: string): Promise<ScanResult> {
  // 1. Parse QR
  const envelope = parseQr(qrData);
  if (!envelope) {
    return { ok: false, code: 'INVALID_QR' };
  }

  // 2. Validar firma + expiración
  const valid = await validateQr(envelope);
  if (!valid) {
    return { ok: false, code: 'INVALID_SIGNATURE' };
  }

  const { ticketId, eventId } = envelope.payload;

  // 3. Buscar ticket local
  const ticket = ticketRepository.get(ticketId);
  if (!ticket) {
    return { ok: false, code: 'NOT_FOUND' };
  }

 
  // 5. Ya usado
  if (ticket.status === 'used') {
    return { ok: false, code: 'ALREADY_USED' };
  }

  // 6. Marcar como usado
  ticketRepository.markUsed(ticketId, eventId);

  return {
    ok: true,
    code: 'OK',
    ticketId,
    eventId,
  };
}
