import { USE_CASES } from '../topics/use-cases';
import { SharedModule } from '../shared/shared.module';
import { Module } from '@nestjs/common';
import { ApagoController } from './apago.controller';
import { AuthModule } from '../auth/auth.module';
import { ApagoService } from './apago.service';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { ApiService } from './api.service';

@Module({
  imports: [AuthModule, SubscribersModule, SharedModule],
  controllers: [ApagoController],
  providers: [ApagoService, ...USE_CASES, ApiService],
  exports: [...USE_CASES, ApagoService],
})
export class ApagoModule {}
