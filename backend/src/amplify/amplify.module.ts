import { Module } from '@nestjs/common';
import { AmplifyService } from './amplify.service';
import { AmplifyController } from './amplify.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from 'src/events/events.service';
import { BlockchainModule } from 'src/blockchain/blockchain.module';

@Module({
  imports: [BlockchainModule],
  controllers: [AmplifyController],
  providers: [AmplifyService, PrismaService, EventsService],
})
export class AmplifyModule {}
