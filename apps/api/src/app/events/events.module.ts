import { Module, forwardRef } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import {
  EventsDistributedLockService,
  StorageHelperService,
  SendTestEmail,
  QueueService,
  CalculateDelayService,
  GetNovuProviderCredentials,
} from '@novu/application-generic';

import { EventsController } from './events.controller';
import { TriggerHandlerQueueService } from './services/workflow-queue/trigger-handler-queue.service';
import { USE_CASES } from './usecases';

import { SharedModule } from '../shared/shared.module';
import { WidgetsModule } from '../widgets/widgets.module';
import { AuthModule } from '../auth/auth.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { LogsModule } from '../logs/logs.module';
import { ContentTemplatesModule } from '../content-templates/content-templates.module';
import { IntegrationModule } from '../integrations/integrations.module';
import { ExecutionDetailsModule } from '../execution-details/execution-details.module';
import { TopicsModule } from '../topics/topics.module';
import { LayoutsModule } from '../layouts/layouts.module';
import { ApagoModule } from '../apago/apago.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    SharedModule,
    TerminusModule,
    WidgetsModule,
    forwardRef(() => AuthModule),
    SubscribersModule,
    LogsModule,
    ContentTemplatesModule,
    IntegrationModule,
    ExecutionDetailsModule,
    TopicsModule,
    LayoutsModule,
    forwardRef(() => ApagoModule),
    TenantModule,
  ],
  controllers: [EventsController],
  providers: [
    ...USE_CASES,
    {
      provide: QueueService,
      useClass: QueueService,
    },
    StorageHelperService,
    TriggerHandlerQueueService,
    EventsDistributedLockService,
    SendTestEmail,
    CalculateDelayService,
    GetNovuProviderCredentials,
  ],
  exports: [...USE_CASES],
})
export class EventsModule {}
