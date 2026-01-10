import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  blockchainTicketId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  originalBuyerId: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsDateString()
  mintedAt: string;
}

