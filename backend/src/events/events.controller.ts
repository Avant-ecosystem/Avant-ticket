import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { MintTicketsDto } from './dto/mint-tickets.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: any) {
    return this.eventsService.create(user.id, createEventDto);
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() pagination: PaginationDto) {
    return this.eventsService.findAll(pagination);
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.getEventStats(id, user?.id);
  }

  @Post(':id/mint-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN', 'USER')
  @HttpCode(HttpStatus.CREATED)
  async mintTickets(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() mintTicketsDto: MintTicketsDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.mintTickets(
      id,
      user.id,
      mintTicketsDto.amount,
      mintTicketsDto.buyerWalletAddress,
      mintTicketsDto.zones,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.update(id, user.id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.eventsService.remove(id, user.id);
  }

    /**
   * Asignar staff (scanner) a un evento
   * Solo ORGANIZER del evento o ADMIN
   */
  @Post(':id/staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ORGANIZER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  addStaffToEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body('staffEmail') staffEmail: string,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.addStaffToEvent(
      eventId,
      user.id,
      staffEmail,
    );
  }

  /**
   * Eventos asignados al staff logueado
   * (Scanner app)
   */
  @Get('staff/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCANNER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  getMyStaffEvents(@CurrentUser() user: any) {
    return this.eventsService.findEventsByStaff(user.id);
  }
  

  @Get(':eventId/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCANNER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async getEventTickets(@Param('eventId') eventId: string) {
    return this.eventsService.getTicketsForSync(eventId);
  }
}

