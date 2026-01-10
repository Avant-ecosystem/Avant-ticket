import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { BlockchainConnectionService } from './blockchain-connection.service';
import { BlockchainActionsService } from './blockchain-actions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GetBalanceDto } from './dto/balance.dto';
import { u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

@Controller('blockchain')
@UseGuards(JwtAuthGuard)
export class BlockchainController {
  constructor(
    private readonly connectionService: BlockchainConnectionService,
    private readonly actionsService: BlockchainActionsService,
  ) {}

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  async getBalance(@CurrentUser() user: any) {
    try {
      if (!user?.walletAddress) {
        throw new BadRequestException('Wallet address not found in token');
      }

      const balance = await this.connectionService.getBalance(user.walletAddress);
      
      return {
        address: user.walletAddress,
        balance,
        balanceFormatted: (BigInt(balance) / BigInt(10 ** 12)).toString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get balance: ${error.message}`);
    }
  }

  @Get('balance/:address')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async getBalanceByAddress(@Param('address') address: string) {
    try {
      // Validar formato de dirección
      try {
        decodeAddress(address);
      } catch {
        throw new BadRequestException('Invalid wallet address format');
      }

      const balance = await this.connectionService.getBalance(address);
      
      return {
        address,
        balance,
        balanceFormatted: (BigInt(balance) / BigInt(10 ** 12)).toString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get balance: ${error.message}`);
    }
  }

  @Get('account')
  @HttpCode(HttpStatus.OK)
  async getCurrentAccount(@CurrentUser() user: any) {
    try {
      const account = this.actionsService.getCurrentAccount();
      return {
        ...account,
        userWalletAddress: user?.walletAddress,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get current account: ${error.message}`);
    }
  }

  @Get('connection-status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  getConnectionStatus() {
    return {
      connected: this.connectionService.isConnected(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('event/:eventId')
  @HttpCode(HttpStatus.OK)
  async getEventOnChain(@Param('eventId') eventId: string) {
    try {
      const eventIdBigInt = BigInt(eventId);
      return await this.actionsService.getEvent(eventIdBigInt);
    } catch (error) {
      throw new BadRequestException(`Failed to get event from blockchain: ${error.message}`);
    }
  }

  @Get('ticket/:ticketId')
  @HttpCode(HttpStatus.OK)
  async getTicketOnChain(@Param('ticketId') ticketId: string) {
    try {
      const ticketIdBigInt = BigInt(ticketId);
      return await this.actionsService.getTicket(ticketIdBigInt);
    } catch (error) {
      throw new BadRequestException(`Failed to get ticket from blockchain: ${error.message}`);
    }
  }

  @Get('user/:address/tickets')
  @HttpCode(HttpStatus.OK)
  async getUserTicketsOnChain(@Param('address') address: string) {
    try {
      // Validar formato de dirección
      try {
        decodeAddress(address);
      } catch {
        throw new BadRequestException('Invalid wallet address format');
      }

      return await this.actionsService.getUserTickets(address);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get user tickets from blockchain: ${error.message}`);
    }
  }

  @Get('marketplace/listings')
  @HttpCode(HttpStatus.OK)
  async getAllListingsOnChain() {
    try {
      return await this.actionsService.getAllListings();
    } catch (error) {
      throw new BadRequestException(`Failed to get listings from blockchain: ${error.message}`);
    }
  }

  @Get('marketplace/listing/:ticketId')
  @HttpCode(HttpStatus.OK)
  async getListingOnChain(@Param('ticketId') ticketId: string) {
    try {
      const ticketIdBigInt = BigInt(ticketId);
      return await this.actionsService.getListing(ticketIdBigInt);
    } catch (error) {
      throw new BadRequestException(`Failed to get listing from blockchain: ${error.message}`);
    }
  }

  @Get('check/organizer/:address')
  @HttpCode(HttpStatus.OK)
  async isOrganizer(@Param('address') address: string) {
    try {
      try {
        decodeAddress(address);
      } catch {
        throw new BadRequestException('Invalid wallet address format');
      }

      const isOrg = await this.actionsService.isOrganizer(address);
      return {
        address,
        isOrganizer: isOrg,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to check organizer status: ${error.message}`);
    }
  }

  @Get('check/scanner/:address')
  @HttpCode(HttpStatus.OK)
  async isScanner(@Param('address') address: string) {
    try {
      try {
        decodeAddress(address);
      } catch {
        throw new BadRequestException('Invalid wallet address format');
      }

      const isScan = await this.actionsService.isScanner(address);
      return {
        address,
        isScanner: isScan,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to check scanner status: ${error.message}`);
    }
  }
}

