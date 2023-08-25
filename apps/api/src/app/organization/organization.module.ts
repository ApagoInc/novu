import { MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnvironmentsModule } from '../environments/environments.module';
import { IntegrationModule } from '../integrations/integrations.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { OrganizationController } from './organization.controller';
import { USE_CASES } from './usecases';
import { WorkflowModule } from '../workflows/workflow.module';
import { NotificationGroupsModule } from '../notification-groups/notification-groups.module';
import { ApagoModule } from '../apago/apago.module';

@Module({
  imports: [
    SharedModule,
    UserModule,
    EnvironmentsModule,
    IntegrationModule,
    WorkflowModule,
    NotificationGroupsModule,
    ApagoModule,
  ],
  controllers: [OrganizationController],
  providers: [...USE_CASES],
  exports: [...USE_CASES],
})
export class OrganizationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(AuthGuard).exclude({
      method: RequestMethod.GET,
      path: '/organizations/invite/:inviteToken',
    });
  }
}
