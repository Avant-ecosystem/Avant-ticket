import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QrService } from './services/qr.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [QrService],
  exports: [QrService],
})
export class CommonModule {}

