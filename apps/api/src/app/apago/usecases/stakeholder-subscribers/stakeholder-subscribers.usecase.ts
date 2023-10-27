import { Injectable } from '@nestjs/common';
import { StakeholdersRepository } from '@novu/dal';

import { StakeholderSubscribersCommand } from './stakeholder-subscribers.command';
import { UpdateSubscriberPreferenceCommand } from '../../../subscribers/usecases/update-subscriber-preference';
import { UpdatePreference } from '../../../subscribers/usecases/update-preference/update-preference.usecase';

@Injectable()
export class StakeholderSubscribers {
  constructor(private stakeholdersRepository: StakeholdersRepository) {}

  async execute(command: StakeholderSubscribersCommand) {
    const subs = await this.stakeholdersRepository.getSubscribers({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      jobId: command.jobId,
      stage: command.stage,
      part: command.part,
    });

    return subs;
  }
}
