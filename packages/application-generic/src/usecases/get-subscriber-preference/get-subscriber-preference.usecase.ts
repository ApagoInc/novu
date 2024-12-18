import { Injectable } from '@nestjs/common';
import {
  NotificationTemplateRepository,
  NotificationTemplateEntity,
  MemberRepository,
} from '@novu/dal';
import {
  ChannelTypeEnum,
  IPreferenceChannels,
  ISubscriberPreferenceResponse,
} from '@novu/shared';

import { AnalyticsService } from '../../services';
import { GetSubscriberPreferenceCommand } from './get-subscriber-preference.command';
import {
  GetSubscriberTemplatePreference,
  GetSubscriberTemplatePreferenceCommand,
} from '../get-subscriber-template-preference';

@Injectable()
export class GetSubscriberPreference {
  constructor(
    private memberRepository: MemberRepository,
    private notificationTemplateRepository: NotificationTemplateRepository,
    private getSubscriberTemplatePreferenceUsecase: GetSubscriberTemplatePreference,
    private analyticsService: AnalyticsService
  ) {}

  // TODO - do we ever even use this?

  async execute(
    command: GetSubscriberPreferenceCommand
  ): Promise<ISubscriberPreferenceResponse[]> {
    console.log(
      'in execute of GetSubscriberPreferenceCommand - received the following values for the command:'
    );
    try {
      console.log(JSON.stringify(command));
    } catch (e) {
      console.log(
        'Error - ',
        e,
        '- failed to stringify the following:',
        command
      );
    }

    if (command.accountId) {
      console.log(
        'in execute of GetSubscriberPreferenceCommand - received the following value for accountId:',
        command.accountId
      );
    } else {
      if (typeof command.accountId === null) {
        console.log(
          'in execute of GetSubscriberPreferenceCommand - accountId was passed as null'
        );
      } else {
        console.log(
          'WARNING - in execute of GetSubscriberPreferenceCommand - accountId was not passed as either null or string! Value of accountId, stringified:',
          JSON.stringify(command.accountId)
        );
      }
    }

    const admin = await this.memberRepository.getOrganizationAdminAccount(
      command.organizationId
    );

    const templateList =
      await this.notificationTemplateRepository.getActiveList(
        command.organizationId,
        command.environmentId,
        true
      );

    if (admin) {
      this.analyticsService.track(
        'Fetch User Preferences - [Notification Center]',
        admin._userId,
        {
          _organization: command.organizationId,
          templatesSize: templateList.length,
        }
      );
    }

    return await Promise.all(
      templateList.map(async (template) =>
        this.getSubscriberTemplatePreferenceUsecase.execute(
          GetSubscriberTemplatePreferenceCommand.create({
            accountId: command.accountId,
            organizationId: command.organizationId,
            subscriberId: command.subscriberId,
            environmentId: command.environmentId,
            template,
          })
        )
      )
    );
  }
}
