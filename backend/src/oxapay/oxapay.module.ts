import { Module } from '@nestjs/common';
import { OxaPayService } from './oxapay.service';
import { OxaPayController } from './oxapay.controller';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { EventsModule } from 'src/events/events.module';

@Module({
  controllers: [OxaPayController],
  providers: [OxaPayService],
  imports: [BlockchainModule, EventsModule],
})
export class OxapayModule {}
