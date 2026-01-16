import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  MinDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
  
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  @MinDate(new Date() as Date, {
    message: 'eventStartTime must be in the future',
  })
  eventStartTime?: string;
  
  @IsOptional()
  @IsDateString()
  @MinDate(new Date() as Date, {
    message: 'eventEndTime must be in the future',
  })
  eventEndTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000000)
  @Type(() => Number)
  ticketsTotal?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

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
}

