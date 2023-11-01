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

    await Promise.all(
      command.list.map(async (item) => {
        const updateSubsription = await this.informativeSubscriptionsRepository.update(
          { ...baseCommand, _templateId: item.templateId },
          { $set: { parts: item.parts, allTitles: item.allTitles } }
        );

        if (updateSubsription.matched == 0) {
          this.informativeSubscriptionsRepository.create({
            ...baseCommand,
            _templateId: item.templateId,
            accountId: command.accountId,
            parts: item.parts,
            allTitles: item.allTitles,
          });
        }

        for (const preference of item.preferences) {
          await this.updatePreferenceUsecase.execute(
            UpdateSubscriberPreferenceCommand.create({
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
