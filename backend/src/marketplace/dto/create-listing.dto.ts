import { IsString, IsNotEmpty, IsNumber, Min, IsUUID, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'ticketId must be a valid UUID' })
  ticketId: string;

  @IsNumber()
  @Min(1, { message: 'Price must be greater than 0' })
  @Max(Number.MAX_SAFE_INTEGER)
  @Type(() => Number)
  price: number;
}

