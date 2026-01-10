import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores and hyphens',
  })
  username?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'role must be one of: USER, ORGANIZER, ADMIN, SCANNER' })
  role?: UserRole;
}

