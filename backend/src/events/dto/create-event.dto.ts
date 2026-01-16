import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  Matches,
  MaxLength,
  MinDate,
  IsDate,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EventZoneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(1)
  @Max(1000000)
  @Type(() => Number)
  capacity: number;
}

export class CreateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  blockchainEventId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'metadataHash must be a valid 66-character hex string starting with 0x',
  })
  metadataHash: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;


  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100, { message: 'Cannot specify more than 100 zones' })
  @ValidateNested({ each: true })
  @Type(() => EventZoneDto)
  zones?: EventZoneDto[];

  @IsDate()
  @MinDate(new Date(Date.now() - 60 * 1000), { // Resta 1 minuto para margen
    message: 'eventStartTime must be in the future',
  })
  @Type(() => Date)
  eventStartTime: Date; // Cambia a Date en lugar de string
  
  @IsDate()
  @MinDate(new Date(Date.now() - 60 * 1000), { // Resta 1 minuto para margen
    message: 'eventEndTime must be in the future',
  })
  @Type(() => Date)
  eventEndTime: Date;


  @IsOptional()
  @IsBoolean()
  resaleEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxResalePrice?: number;

  @IsOptional()
  @IsDateString()
  resaleStartTime?: string;

  @IsOptional()
  @IsDateString()
  resaleEndTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  @Type(() => Number)
  sellerPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  @Type(() => Number)
  organizerPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  @Type(() => Number)
  platformPercentage?: number;
}

