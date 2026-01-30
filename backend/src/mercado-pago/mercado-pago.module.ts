import { Module } from '@nestjs/common';
import { MercadoPagoService } from './mercado-pago.service';
import { MercadoPagoController } from './mercado-pago.controller';

import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { EventsModule } from 'src/events/events.module';
import { PrismaModule } from 'src/prisma/prisma.module';
@Module({
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService],
  imports: [BlockchainModule, EventsModule, PrismaModule],
})
export class MercadoPagoModule {}
