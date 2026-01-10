import {
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  IsString,
  Matches,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MintTicketsDto {
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1' })
  @Max(100, { message: 'Amount cannot exceed 100 tickets per transaction' })
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{64}$|^5[a-km-zA-HJ-NP-Z1-9]{47,48}$/, {
    message: 'buyerWalletAddress must be a valid Polkadot/Substrate address',
  })
  buyerWalletAddress?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100, { message: 'Cannot specify more than 100 zones' })
  @IsString({ each: true })
  @MaxLength(100, { each: true, message: 'Each zone name must not exceed 100 characters' })
  zones?: string[];
}

