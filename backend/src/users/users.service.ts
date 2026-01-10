import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        walletAddress: createUserDto.walletAddress || '',
      },
    });
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
      data: users,
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
    return user;
  }

  async findByWalletAddress(walletAddress: string) {
    return this.prisma.user.findUnique({
      where: { walletAddress },
    });
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailOrUsername(emailOrUsername: string) {
    if (!emailOrUsername) return null;
    // Intentar buscar por email primero
    const byEmail = await this.prisma.user.findUnique({
      where: { email: emailOrUsername },
    });
    if (byEmail) return byEmail;

    // Si no se encuentra por email, buscar por username
    return this.prisma.user.findUnique({
      where: { username: emailOrUsername },
    });
  }

  async findByDni(dni: string) {
    if (!dni) return null;
    return this.prisma.user.findUnique({
      where: { dni },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

