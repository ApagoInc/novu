import { NotificationTemplateEntity, SubscriberEntity } from '@novu/dal';
import { IsNotEmpty, IsString } from 'class-validator';

import { EnvironmentWithSubscriber } from '../../commands';

export class GetSubscriberTemplatePreferenceCommand extends EnvironmentWithSubscriber {
  @IsNotEmpty()
  template: NotificationTemplateEntity;

  subscriber?: SubscriberEntity;

  @IsString()
  accountId: string;
}
