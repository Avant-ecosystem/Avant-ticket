import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainConnectionService } from './blockchain-connection.service';
import { BlockchainActionsService } from './blockchain-actions.service';
import { BlockchainSyncService } from './blockchain-sync.service';
import { BlockchainWorkerService } from './blockchain-worker.service';
import { BlockchainEventListenerService } from './blockchain-event-listener.service';
import { BlockchainController } from './blockchain.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
  ],
  controllers: [BlockchainController],
  providers: [
    BlockchainConnectionService,
    BlockchainSyncService,
    BlockchainWorkerService,
    BlockchainActionsService,
    BlockchainEventListenerService,
  ],
  exports: [
    BlockchainConnectionService,
    BlockchainSyncService,
    BlockchainWorkerService,
    BlockchainActionsService,
    BlockchainEventListenerService,
  ],
})
export class BlockchainModule {}

