import { StakeholdersRepository } from '@novu/dal';
import { Injectable } from '@nestjs/common';
import { BatchUpdateStakeholdersForJobCommand } from './batch-update-stakeholders-for-job.command';

@Injectable()
export class BatchUpdateStakeholdersForJob {
  constructor(private stakeholdersRepository: StakeholdersRepository) { }

  async execute(command: BatchUpdateStakeholdersForJobCommand) {
    try {
      const baseCommand = {
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        accountId: command.accountId,
        jobId: command.jobId,
        query: command.query,
        update: command.update
      };

      // Get all stakeholders for the job that match the query.
      // If no query is passed, get all stakeholders for the job.
      const queryCriteria = {
        _organizationId: baseCommand._organizationId,
        jobId: baseCommand.jobId,
        ...(baseCommand.query ? baseCommand.query : {})
      }

      const debug_jobStakeholders = await this.stakeholdersRepository.find(queryCriteria)
      console.log('debug - query for job stakeholders with the passed query of', 
        `${queryCriteria ? JSON.stringify(queryCriteria) : '(no query passed!)'}`, 
        'returned a count of', debug_jobStakeholders.length, 'records')

      const batchUpdate = await this.stakeholdersRepository.update(queryCriteria, { $set: command.update })

      console.log('Result of batchUpdate:', batchUpdate)
      return batchUpdate;
    } catch (error) {
      console.log('Something went wrong while trying to run a batch update on the stakeholders of the job under jobID ' + command.jobId)
      return null;
    }
  }
}
