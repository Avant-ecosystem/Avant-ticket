import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Body,
  Post,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QrService } from '../common/services/qr.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly qrService: QrService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('eventId') eventId?: string,
    @Query('ownerId') ownerId?: string,
    @Query() pagination?: PaginationDto,
  ) {
    if (eventId) {
      return this.ticketsService.findByEvent(eventId, pagination);
    }
    if (ownerId) {
      return this.ticketsService.findByOwner(ownerId, pagination);
    }
    return this.ticketsService.findAll(pagination);
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findMyTickets(
    @CurrentUser() user: any,
    @Query() pagination?: PaginationDto,
  ) {
    return this.ticketsService.findByOwner(user.id, pagination);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER')
  @HttpCode(HttpStatus.OK)
  getStats(@CurrentUser() user: any) {
    return this.ticketsService.getStats(user?.id);
  }

  @Post(':eventId/mark-used')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ORGANIZER','STAFF')
  @HttpCode(HttpStatus.OK)
markUsedBatch(
  @Param('eventId') eventId: string,
  @Body('ticketIds') ticketIds: string[],
) {
  return this.ticketsService.markTicketsAsUsedBatch(eventId, ticketIds);
}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get(':id/qr')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getQrCode(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const ticket = await this.ticketsService.findOne(id);
    if (ticket.ownerId !== user.id) {
      throw new ForbiddenException('You can only view your own ticket QR codes');
    }
    
    const qrData = this.qrService.generateQrData(ticket.blockchainTicketId,ticket.eventId);
    const qrImage = await this.qrService.generateQrCode(ticket.blockchainTicketId,ticket.eventId);
    return {
      qrData,
      qrImage,
    };
  }
}
