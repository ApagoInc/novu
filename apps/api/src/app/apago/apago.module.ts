import { SharedModule } from '../shared/shared.module';
import { Module, forwardRef } from '@nestjs/common';
import { ApagoController } from './apago.controller';
import { AuthModule } from '../auth/auth.module';
import { ApagoService } from './apago.service';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { ApiService } from './api.service';
import { WorkflowModule } from '../workflows/workflow.module';
import { TopicsModule } from '../topics/topics.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule, SubscribersModule, TopicsModule, forwardRef(() => AuthModule), SharedModule, WorkflowModule],
  controllers: [ApagoController],
  providers: [ApagoService, ApiService],
  exports: [ApagoService],
})
export class ApagoModule {}
