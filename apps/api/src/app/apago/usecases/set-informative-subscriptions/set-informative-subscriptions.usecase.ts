import { Injectable } from '@nestjs/common';
import { InformativeSubscriptionsRepository } from '@novu/dal';

import { SetInformativeSubscriptionsCommand } from './set-informative-subscriptions.command';
import { UpdateSubscriberPreferenceCommand } from '../../../subscribers/usecases/update-subscriber-preference';
import { UpdatePreference } from '../../../subscribers/usecases/update-preference/update-preference.usecase';

@Injectable()
export class SetInformativeSubscriptions {
  constructor(
    private informativeSubscriptionsRepository: InformativeSubscriptionsRepository,
    private updatePreferenceUsecase: UpdatePreference
  ) {}

  async execute(command: SetInformativeSubscriptionsCommand) {
    const baseCommand = {
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _subscriberId: command.subscriberId,
      accountId: command.accountId,
    };

    const TEMP_DebugSafeStringify = (stringifyTarget?: any) => {
      try {
        console.log(JSON.stringify(stringifyTarget));
      } catch (e) {
        console.log('ERROR - failed to stringify a value:', stringifyTarget);
      }
    };

    console.log(
      'In setInformativeSubscriptions for subscriberId',
      command.subscriberId,
      '- received the following baseCommand value:'
    );
    TEMP_DebugSafeStringify(baseCommand);

    console.log(
      'In setInformativeSubscriptions for subscriberId',
      command.subscriberId,
      '- received the following command.list value:'
    );
    TEMP_DebugSafeStringify(JSON.stringify(command.list));

    await Promise.all(
      command.list.map(async (item) => {
        console.log(
          'In setInformativeSubscriptions - about to attempt to update a subscription (if it exists), with the following data:'
        );
        TEMP_DebugSafeStringify(item);

        // TODO - could the issue be as simple as a *bad* settings for allTitles,
        // via evaluating trying to evaluate allTitles as a strict boolean, but instead evaluating it as falsy, undefined, etc?
        const updateSubsription = await this.informativeSubscriptionsRepository.update(
          { ...baseCommand, _templateId: item.templateId },
          { $set: { parts: item.parts, allTitles: item.allTitles } }
        );

        if (updateSubsription.matched == 0) {
          console.log(
            '"updateSubsription"\'s matched property was "==" to 0. Instead, creating this as a subscription now, with the following data: '
          );

          TEMP_DebugSafeStringify({
            ...baseCommand,
            _templateId: item.templateId,
            accountId: command.accountId,
            parts: item.parts,
            allTitles: item.allTitles,
          });

          this.informativeSubscriptionsRepository.create({
            ...baseCommand,
            _templateId: item.templateId,
            accountId: command.accountId,
            parts: item.parts,
            allTitles: item.allTitles,
          });
        }

        console.log('About to check the following preferences from item.preferences:');
        TEMP_DebugSafeStringify(item.preferences);

        for (const preference of item.preferences) {
          console.log('Checking the following preference from item.preferences:');
          TEMP_DebugSafeStringify(preference);

          await this.updatePreferenceUsecase.execute(
            UpdateSubscriberPreferenceCommand.create({
              accountId: command.accountId,
              environmentId: command.environmentId,
              organizationId: command.organizationId,
              subscriberId: command.externalSubsciberId,
              templateId: item.templateId,
              channel: { enabled: preference.enabled, type: preference.type },
            })
          );
        }
      })
    );

    return { success: true };
  }
}
