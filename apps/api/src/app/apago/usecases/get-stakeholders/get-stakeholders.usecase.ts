import { Injectable } from '@nestjs/common';
import { StakeholdersRepository } from '@novu/dal';
import { GetStakeholdersCommand } from './get-stakeholders.command';

@Injectable()
export class GetStakeholders {
  constructor(private stakeholdersRepository: StakeholdersRepository) {}

  async execute(command: GetStakeholdersCommand) {
    const stakeholders = await this.stakeholdersRepository.getStakeholders({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      jobId: command.jobId,
    });

    return stakeholders;
  }
}
