import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

export interface QrPayload {
  ticketId: string;
  timestamp: number;
  nonce: string;
}

@Injectable()
export class QrService {
  private secretKey: Buffer;

  constructor(private configService: ConfigService) {
    const secretKey = process.env.QR_SECRET_KEY;
    if (!secretKey) {
      throw new Error('QR_SECRET_KEY is required');
    }
    this.secretKey = Buffer.from(secretKey, 'base64');
    if (this.secretKey.length !== 32) {
      throw new Error('QR_SECRET_KEY must be 32 bytes (base64 encoded)');
    }
  }

  generateQrData(ticketId: string): string {
    const payload: QrPayload = {
      ticketId,
      timestamp: Date.now(),
      nonce: this.generateNonce(),
    };

    const message = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(message);
    const signature = hmac.digest('base64');

    const signedData = {
      payload,
      signature,
    };

    return Buffer.from(JSON.stringify(signedData)).toString('base64');
  }

  verifyQr(qrData: string): QrPayload {
    try {
      const decoded = JSON.parse(Buffer.from(qrData, 'base64').toString('utf-8'));
      const { payload, signature } = decoded;

      const message = JSON.stringify(payload);
      const hmac = crypto.createHmac('sha256', this.secretKey);
      hmac.update(message);
      const expectedSignature = hmac.digest('base64');

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      if (Date.now() - payload.timestamp > maxAge) {
        throw new Error('QR code expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid QR code');
    }
  }

  async generateQrCode(ticketId: string): Promise<string> {
    const qrData = this.generateQrData(ticketId);
    return QRCode.toDataURL(qrData);
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}

