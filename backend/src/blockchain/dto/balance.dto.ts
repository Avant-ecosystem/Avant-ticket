import { IsString, IsOptional, Matches } from 'class-validator';

export class GetBalanceDto {
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{64}$/, {
    message: 'Address must be a valid 64-character hex string',
  })
  address?: string;
}

