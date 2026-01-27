import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

export interface QrPayload {
  ticketId: string;
  eventId:string;
  exp: number;
}

@Injectable()
export class QrService {
  private secretKey: Buffer;

  constructor(private configService: ConfigService) {
    const secret = this.configService.get<string>('QR_SECRET_KEY');

    if (!secret) {
      throw new Error('QR_SECRET_KEY is required');
    }

    // La clave puede ser texto normal, no base64
    this.secretKey = Buffer.from(secret, 'utf8');

    if (this.secretKey.length < 32) {
      throw new Error('QR_SECRET_KEY must be at least 32 characters');
    }
  }

  /**
   * Genera el payload firmado que va dentro del QR
   */
  generateQrData(ticketId: string,eventId:string): string {
    const payload: QrPayload = {
      ticketId,
      eventId,
      // expiración opcional (5 minutos)
      exp: Date.now() + 5 * 60 * 1000,
    };

    const payloadString = JSON.stringify(payload);

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payloadString)
      .digest('base64');

    return Buffer.from(
      JSON.stringify({
        payload,
        signature,
      }),
    ).toString('base64');
  }

  /**
   * Verifica un QR escaneado
   */
  verifyQr(qrData: string): QrPayload {
    let decoded: any;

    try {
      decoded = JSON.parse(
        Buffer.from(qrData, 'base64').toString('utf8'),
      );
    } catch {
      throw new Error('Invalid QR format');
    }

    const { payload, signature } = decoded;

    if (!payload || !signature) {
      throw new Error('Invalid QR structure');
    }

    // verificar expiración
    if (payload.exp < Date.now()) {
      throw new Error('QR expired');
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(JSON.stringify(payload))
      .digest('base64');

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    ) {
      throw new Error('Invalid QR signature');
    }

    return payload;
  }

  /**
   * Genera la imagen QR (base64 PNG)
   */
  async generateQrCode(ticketId: string,eventId:string): Promise<string> {
    const qrData = this.generateQrData(ticketId,eventId);
    return QRCode.toDataURL(qrData);
  }
}
