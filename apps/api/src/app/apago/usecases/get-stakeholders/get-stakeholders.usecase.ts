import { Injectable } from '@nestjs/common';
import { StakeholdersRepository } from '@novu/dal';
import { GetStakeholdersCommand } from './get-stakeholders.command';

@Injectable()
export class GetStakeholders {
  constructor(private stakeholdersRepository: StakeholdersRepository) { }

  async execute(command: GetStakeholdersCommand) {

    const unconfirmedValUpdate = (typeof command.unconfirmed !== 'undefined' &&
      command.unconfirmed !== null &&
      typeof command.unconfirmed === 'boolean'
    ) ?
      { unconfirmed: command.unconfirmed } :
      {}

    const stakeholders = await this.stakeholdersRepository.getStakeholders({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      jobId: command.jobId,
      ...(unconfirmedValUpdate ? unconfirmedValUpdate : {})
    });

    return stakeholders;
  }
}
