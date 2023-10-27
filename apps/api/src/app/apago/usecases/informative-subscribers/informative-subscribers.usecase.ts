import { Injectable } from '@nestjs/common';
import { InformativeSubscriptionsRepository } from '@novu/dal';

import { InformativeSubscribersCommand } from './informative-subscribers.command';
import { UpdateSubscriberPreferenceCommand } from '../../../subscribers/usecases/update-subscriber-preference';
import { UpdatePreference } from '../../../subscribers/usecases/update-preference/update-preference.usecase';

@Injectable()
export class InformativeSubscribers {
  constructor(private informativeSubscriptionsRepository: InformativeSubscriptionsRepository) {}

  async execute(command: InformativeSubscribersCommand) {
    const subscribers = await this.informativeSubscriptionsRepository.getSubscribers({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _templateId: command.templateId,
      accountId: command.accountId,
      part: command.part,
    });

    return subscribers;
  }
}
