import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private serializeUser(user: any): any {
    if (!user) return user;
    
    // Usar una función recursiva
    const convertBigInts = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj;
      }
      if (typeof obj === 'bigint') {
        return obj.toString();
      }
      if (Array.isArray(obj)) {
        return obj.map(item => convertBigInts(item));
      }
      if (typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, convertBigInts(value)]));
      }
      return obj;
    };
    return convertBigInts(user);
  }

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        walletAddress: createUserDto.walletAddress || '',
      },
    });
  }

  async findByUsername(username: string) {
    if (!username) return null;
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return this.serializeUser(user);
  }

  async findAll(pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          dni: true,
          walletAddress: true,
          role: true,
          pais: true,
          provincia: true,
          ciudad: true,
          calle: true,
          numero: true,
          codigoPostal: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    
    return {
      data: users.map(user => this.serializeUser(user)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organizedEvents: true,
        ownedTickets: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.serializeUser(user);
  }

  async findByWalletAddress(walletAddress: string) {
    if (!walletAddress) return null;
    const user = await this.prisma.user.findUnique({
      where: { walletAddress },
    });
    return this.serializeUser(user);
  }

  async findByEmail(email: string) {
    if (!email) return null;
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return this.serializeUser(user);
  }

  async findByEmailOrUsername(emailOrUsername: string) {
    if (!emailOrUsername) return null;
    // Intentar buscar por email primero
    const byEmail = await this.prisma.user.findUnique({
      where: { email: emailOrUsername },
    });
    if (byEmail) return this.serializeUser(byEmail);

    // Si no se encuentra por email, buscar por username
    const byUsername = await this.prisma.user.findUnique({
      where: { username: emailOrUsername },
    });
    if (byUsername) return this.serializeUser(byUsername);
    return null;
  }

  async findByDni(dni: string) {
    if (!dni) return null;
    const user = await this.prisma.user.findUnique({
      where: { dni },
    });
    return this.serializeUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
      const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.serializeUser(user);
  }

  async remove(id: string) {
      const user = await this.prisma.user.delete({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.serializeUser(user);
  }
}

