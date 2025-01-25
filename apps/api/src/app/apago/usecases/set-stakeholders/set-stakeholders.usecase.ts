import { StakeholdersRepository } from '@novu/dal';
import { Injectable } from '@nestjs/common';

import { SetStakeholdersCommand } from './set-stakeholders.command';

@Injectable()
export class SetStakeholders {
  constructor(private stakeholdersRepository: StakeholdersRepository) {}

  async execute(command: SetStakeholdersCommand) {


    // We will only use unconfirmed anywhere after the query,
    // and even then, we will only use it IF it was defined.
    const unconfirmedValUpdate = (
      typeof command.unconfirmed !== 'undefined' &&
      command.unconfirmed !== null &&
      typeof command.unconfirmed === 'boolean'
    ) ?
      { unconfirmed: command.unconfirmed } :
      {}




    const baseCommand = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _subscriberId: command.subscriberId,
      accountId: command.accountId,
      jobId: command.jobId,
      stage: command.stage,

      // We will EXCLUDE unconfirmed from this command.
      // Because, if we were to query for the record by the value that we're going to CHANGE it to, we would never be guaranteed to find the record.
      // unconfirmed: command.unconfirmed
    };

    // We will use this function to do different things, depending on the values we receive
    // If there are no parts selected for this stage, there's no subscription. It should be deleted.
    const shouldDelete = command.parts && command.parts.length === 0
    if (shouldDelete) {
      console.log('In execute for SetStakeholders command, got a command with parts of length 0, for the following baseCommand:', JSON.stringify(baseCommand), ' - if it exists, this subscription for this stage will be deleted.')

      const existingSub = await this.stakeholdersRepository.findOne(
        {
          ...baseCommand,
        }
      )
      if (existingSub) {
        console.log("Found existing sub that will now be deleted.")
        await this.stakeholdersRepository.delete({
          ...baseCommand
        })
        return { deleted: true }
      }
      console.log('Failed to find existing sub. May now proceed to create one with zero parts for this stage.')
    }

    // The below update first tries to update a matched existing stakeholder,
    // if one can be found that matches the above baseCommand...
    const stakeholder = await this.stakeholdersRepository.update(
      {
        ...baseCommand,
      },
      {
        $set: {
          parts: command.parts,
          ...unconfirmedValUpdate
        }
      }
    );

    if (stakeholder.matched !== 0) return stakeholder;

    // If the stakeholder couldn't be matched under the initial criteria -
    // then they will be created with this baseCommand that was passed - including "unconfirmed" if it was passed in the command.
    // (Technically, "unconfirmed" should probably never be passed to a new stakeholder record, given how the confirm workflow is set up. 'unconfirmed' should only be occurring as an update on existing stakeholder records.)
    // But, any call to this usecase through the API will currently set unconfirmed to false.
    return this.stakeholdersRepository.create({
      ...baseCommand,
      ...unconfirmedValUpdate,
      parts: command.parts,
    });
  }
}
