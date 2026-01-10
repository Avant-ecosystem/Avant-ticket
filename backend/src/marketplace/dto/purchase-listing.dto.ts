import { IsString, IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';

export class PurchaseListingDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'listingId must be a valid UUID' })
  listingId: string;

  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]+$/, {
    message: 'blockchainTxHash must be a valid hex string starting with 0x',
  })
  blockchainTxHash?: string;
}

