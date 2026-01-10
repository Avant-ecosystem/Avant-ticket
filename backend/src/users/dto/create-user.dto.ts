import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  Matches,
  MaxLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'DNI is required' })
  dni: string;

  @IsOptional()
  @IsString()
  @MaxLength(64, { message: 'Username must not exceed 64 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-fA-F]{64}$|^5[a-km-zA-HJ-NP-Z1-9]{47,48}$/, {
    message: 'walletAddress must be a valid Polkadot/Substrate address',
  })
  walletAddress?: string;

  // Dirección
  @IsString()
  @IsNotEmpty({ message: 'Country (pais) is required' })
  pais: string;

  @IsString()
  @IsNotEmpty({ message: 'Province (provincia) is required' })
  provincia: string;

  @IsString()
  @IsNotEmpty({ message: 'City (ciudad) is required' })
  ciudad: string;

  @IsString()
  @IsNotEmpty({ message: 'Street (calle) is required' })
  calle: string;

  @IsString()
  @IsNotEmpty({ message: 'Number (numero) is required' })
  numero: string;

  @IsString()
  @IsNotEmpty({ message: 'Postal code (codigoPostal) is required' })
  codigoPostal: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'role must be one of: USER, ORGANIZER, ADMIN, SCANNER' })
  role?: UserRole;
}

