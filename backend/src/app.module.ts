import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { ScannerModule } from './scanner/scanner.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { CommonModule } from './common/common.module';

import { WebhooksController } from './webhooks/webhooks.controller';
import { MercadoPagoModule } from './mercado-pago/mercado-pago.module';
import { PaymentsModule } from './payments/payments.module';
import { AmplifyModule } from './amplify/amplify.module';
import { OxapayModule } from './oxapay/oxapay.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    EventsModule,
    TicketsModule,
    MarketplaceModule,
    ScannerModule,
    BlockchainModule,
    MercadoPagoModule,
    PaymentsModule,
    AmplifyModule,
    OxapayModule,

  ],
  controllers: [AppController, WebhooksController],
  providers: [AppService],
})
export class AppModule {}
