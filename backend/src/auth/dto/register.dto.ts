import {
  IsString,
  IsOptional,
  IsEmail,
  Matches,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(64, { message: 'Password must not exceed 64 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message:
      'Password must contain at least one uppercase letter, one number, and one special character',
  })
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
  @IsString()
  @Matches(/^[0-9a-fA-F]{64}$|^5[a-km-zA-HJ-NP-Z1-9]{47,48}$/, {
    message: 'walletAddress must be a valid Polkadot/Substrate address',
  })
  walletAddress?: string;
}

