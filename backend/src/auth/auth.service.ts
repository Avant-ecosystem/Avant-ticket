import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { decodeAddress } from '@polkadot/util-crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async validateWallet(walletAddress: string, signature: string, message?: string): Promise<boolean> {
    try {
      // Validar formato de dirección
      try {
        decodeAddress(walletAddress);
      } catch {
        this.logger.warn(`Invalid wallet address format: ${walletAddress}`);
        return false;
      }

      // Validar formato de firma
      if (!signature || signature.length < 64) {
        this.logger.warn(`Invalid signature format: ${signature}`);
        return false;
      }

      // TODO: Implementar verificación de firma real con Polkadot/Substrate
      // Por ahora, para desarrollo, validamos solo el formato
      // En producción, deberías:
      // 1. Verificar que la firma corresponde a la walletAddress
      // 2. Verificar que el mensaje firmado es correcto
      // 3. Verificar nonce/timestamp para prevenir replay attacks

      const skipSignatureValidation = this.configService.get<string>('SKIP_SIGNATURE_VALIDATION') === 'true';
      
      if (skipSignatureValidation) {
        this.logger.warn('WARNING: Signature validation is disabled. This should only be used in development.');
        return true;
      }

      // Placeholder para validación real
      // const isValid = await verifySignature(walletAddress, signature, message);
      return true;
    } catch (error) {
      this.logger.error(`Error validating wallet signature:`, error);
      return false;
    }
  }

  async login(loginDto: LoginDto) {
    // Buscar usuario por email o username
    const user = await this.usersService.findByEmailOrUsername(loginDto.emailOrUsername);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar contraseña
    const isPasswordValid = await this.comparePassword(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Excluir password del objeto user en la respuesta
    const { password, ...userResponse } = user;

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '7d',
      user: {
        id: userResponse.id,
        email: userResponse.email,
        username: userResponse.username,
        role: userResponse.role,
        walletAddress: userResponse.walletAddress,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Validar email único
    const existingEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new BadRequestException('User with this email already exists');
    }

    // Validar DNI único
    const existingDni = await this.usersService.findByDni(registerDto.dni);
    if (existingDni) {
      throw new BadRequestException('User with this DNI already exists');
    }

    // Validar username único si se proporciona
    if (registerDto.username) {
      const existingUsername = await this.usersService.findByEmailOrUsername(registerDto.username);
      if (existingUsername && existingUsername.username === registerDto.username) {
        throw new BadRequestException('User with this username already exists');
      }
    }

    // Validar walletAddress si se proporciona
    if (registerDto.walletAddress) {
      try {
        decodeAddress(registerDto.walletAddress);
        const existingWallet = await this.usersService.findByWalletAddress(registerDto.walletAddress);
        if (existingWallet) {
          throw new BadRequestException('User with this wallet address already exists');
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Invalid wallet address format');
      }
    }

    // Hashear contraseña
    const hashedPassword = await this.hashPassword(registerDto.password);

    // Crear usuario
    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      dni: registerDto.dni,
      username: registerDto.username,
      pais: registerDto.pais,
      provincia: registerDto.provincia,
      ciudad: registerDto.ciudad,
      calle: registerDto.calle,
      numero: registerDto.numero,
      codigoPostal: registerDto.codigoPostal,
      walletAddress: registerDto.walletAddress,
      role: 'USER',
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`New user registered: ${registerDto.email}`);

    // Excluir password del objeto user en la respuesta
    const { password, ...userResponse } = user;

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '7d',
      user: {
        id: userResponse.id,
        email: userResponse.email,
        username: userResponse.username,
        role: userResponse.role,
        walletAddress: userResponse.walletAddress,
      },
    };
  }
}

