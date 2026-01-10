import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { PurchaseListingDto } from './dto/purchase-listing.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @Query('eventId') eventId?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.marketplaceService.findAll(eventId, pagination);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.marketplaceService.findOne(id);
  }

  @Post('listings')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createListing(
    @Body() createListingDto: CreateListingDto,
    @CurrentUser() user: any,
  ) {
    return this.marketplaceService.createListing(user.id, createListingDto);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  purchaseListing(
    @Body() purchaseListingDto: PurchaseListingDto,
    @CurrentUser() user: any,
  ) {
    return this.marketplaceService.purchaseListing(user.id, purchaseListingDto);
  }

  @Delete('listings/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelListing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.marketplaceService.cancelListing(id, user.id);
  }
}

