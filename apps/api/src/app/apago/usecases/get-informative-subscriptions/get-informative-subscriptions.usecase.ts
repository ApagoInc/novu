import { Injectable } from '@nestjs/common';
import { InformativeSubscriptionsRepository } from '@novu/dal';

import { GetInformativeSubscriptionsCommand } from './get-informative-subscriptions.command';

@Injectable()
export class GetInformativeSubscriptions {
  constructor(private informativeSubscriptionsRepository: InformativeSubscriptionsRepository) {}

  async execute(command: GetInformativeSubscriptionsCommand) {
    const informativeSubscriptions = await this.informativeSubscriptionsRepository.getInformativeSubscriptions({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      accountId: command.accountId,
      _subscriberId: command.subscriberId,
    });

    return informativeSubscriptions;
  }
}
