import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ScannerService } from './scanner.service';
import { ScanTicketDto } from './dto/scan-ticket.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class VerifyTicketQueryDto {
  @IsString()
  @IsNotEmpty()
  qr: string;
}

@Controller('scanner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCANNER', 'ADMIN', 'ORGANIZER')
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  scanTicket(@Body() scanTicketDto: ScanTicketDto, @CurrentUser() user: any) {
    return this.scannerService.scanTicket(scanTicketDto.qrData, user.id);
  }

  @Get('verify')
  @HttpCode(HttpStatus.OK)
  verifyTicket(@Query('qr') qr: string) {
    if (!qr || typeof qr !== 'string') {
      throw new BadRequestException('QR code is required');
    }
    return this.scannerService.getTicketByQr(qr);
  }
}

