// tickets/dto/create-ticket.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsDate, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

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
  zoneId?: string;

  @IsDate()
  @Type(() => Date)
  mintedAt: Date;
}