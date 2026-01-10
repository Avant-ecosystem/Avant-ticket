import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ScanTicketDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'QR data must be at least 10 characters' })
  @MaxLength(5000, { message: 'QR data must not exceed 5000 characters' })
  qrData: string;
}

