import {
  IsUUID,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOxaPayItemDto {
  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(1)
  unitPrice: number;

  @IsOptional()
  @IsUUID()
  zoneId?: string;
}

export class CreateOxaPayPaymentDto {
  @IsUUID()
  buyerId: string;

  @IsUUID()
  organizerId: string;

  @IsUUID()
  eventId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOxaPayItemDto)
  items: CreateOxaPayItemDto[];
}
