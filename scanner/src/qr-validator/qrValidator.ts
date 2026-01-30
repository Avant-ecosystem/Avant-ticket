import CryptoJS from 'crypto-js';

export type QrPayload = {
  ticketId: string;
  eventId:string
  exp: number;
};

export type QrEnvelope = {
  payload: QrPayload;
  signature: string;
};

// 🔐 MISMA SECRET KEY QUE EL BACKEND
const QR_SECRET_KEY = process.env.EXPO_PUBLIC_QR_SECRET_KEY



export function parseQr(qrData: string): QrEnvelope | null {
  try {
    // Base64 → JSON (sin Buffer)
    const json = CryptoJS.enc.Base64.parse(qrData).toString(
      CryptoJS.enc.Utf8,
    );


    const obj = JSON.parse(json);

    if (!obj.payload || !obj.signature) return null;
    if (typeof obj.payload.ticketId !== 'string') return null;
    if (typeof obj.payload.exp !== 'number') return null;
    if (typeof obj.signature !== 'string') return null;

    return obj as QrEnvelope;
  } catch (err) {
    console.log('QR parse error:', err);
    return null;
  }
}

export function validateQr(envelope: QrEnvelope): boolean {
  try {
    const { payload, signature } = envelope;
console.log(QR_SECRET_KEY);
    // 1. Expiración
    if (payload.exp < Date.now()) {
      console.log('QR expired');
      return false;
    }

    // 2. Recalcular firma EXACTA
    const expectedSignature = CryptoJS.HmacSHA256(
      JSON.stringify(payload),
      QR_SECRET_KEY,
    ).toString(CryptoJS.enc.Base64);

    // 3. Comparación
    return signature === expectedSignature;
  } catch (e) {
    console.log('QR validation error:', e);
    return false;
  }
}
