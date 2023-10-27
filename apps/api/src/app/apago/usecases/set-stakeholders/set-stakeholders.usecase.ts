import { Injectable } from '@nestjs/common';
import { StakeholdersRepository } from '@novu/dal';

import { SetStakeholdersCommand } from './set-stakeholders.command';
import { UpdateSubscriberPreferenceCommand } from '../../../subscribers/usecases/update-subscriber-preference';
import { UpdatePreference } from '../../../subscribers/usecases/update-preference/update-preference.usecase';

@Injectable()
export class SetStakeholders {
  constructor(private stakeholdersRepository: StakeholdersRepository) {}

  async execute(command: SetStakeholdersCommand) {
    const baseCommand = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _subscriberId: command.subscriberId,
      accountId: command.accountId,
      jobId: command.jobId,
      stage: command.stage,
    };

    const stakeholder = await this.stakeholdersRepository.update(
      {
        ...baseCommand,
      },
      { $set: { parts: command.parts } }
    );

    if (stakeholder.matched !== 0) return stakeholder;

    return this.stakeholdersRepository.create({
      ...baseCommand,
      parts: command.parts,
    });
  }
}
