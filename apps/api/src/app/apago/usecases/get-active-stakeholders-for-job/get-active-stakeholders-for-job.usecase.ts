import { Injectable } from '@nestjs/common';
import { StakeholdersRepository } from '@novu/dal';
import { GetActiveStakeholdersForJobCommand } from './get-active-stakeholders-for-job.command';

@Injectable()
export class GetActiveStakeholdersForJob {
  constructor(private stakeholdersRepository: StakeholdersRepository) { }

  async execute(command: GetActiveStakeholdersForJobCommand) {

    const baseCommand = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      accountId: command.accountId,
      jobId: command.jobId,
    };

    const stakeholders = await this.stakeholdersRepository.find({
      _environmentId: command.environmentId,
      _organizationId: baseCommand._organizationId,
      jobId: baseCommand.jobId,
      // Note: using the below to see if the parts array has any elements at all
      parts: { $not: { $size: 0 } }
    })

    // To see if we can delete this in future:
    const debug_stakeHoldersForJob = await this.stakeholdersRepository.find({
      _organizationId: baseCommand._organizationId,
      jobId: baseCommand.jobId,
    })

    console.log("DEBUG - in execute for GetActiveStakeholdersForJob usecase - also queried and found", debug_stakeHoldersForJob.length, 'total stakeholders for the job. (If this is consistently the same count as the active stakeholders value count, then the "post" update hook schema is confirmed as working to cleanup/delete old stakeholder stage subscriptions)')
    return stakeholders;
  }
}
