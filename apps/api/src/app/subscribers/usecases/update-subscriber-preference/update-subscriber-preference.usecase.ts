import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  SubscriberPreferenceEntity,
  SubscriberPreferenceRepository,
  NotificationTemplateRepository,
  SubscriberEntity,
  SubscriberRepository,
  MemberRepository,
} from '@novu/dal';
import {
  AnalyticsService,
  GetSubscriberTemplatePreference,
  GetSubscriberTemplatePreferenceCommand,
} from '@novu/application-generic';
import { ISubscriberPreferenceResponse } from '@novu/shared';

import { UpdateSubscriberPreferenceCommand } from './update-subscriber-preference.command';
import { ApiException } from '../../../shared/exceptions/api.exception';

@Injectable()
export class UpdateSubscriberPreference {
  constructor(
    private subscriberPreferenceRepository: SubscriberPreferenceRepository,
    private getSubscriberTemplatePreference: GetSubscriberTemplatePreference,
    private notificationTemplateRepository: NotificationTemplateRepository,
    private analyticsService: AnalyticsService,
    private subscriberRepository: SubscriberRepository,
    private memberRepository: MemberRepository
  ) {}

  async execute(command: UpdateSubscriberPreferenceCommand): Promise<ISubscriberPreferenceResponse> {
    const subscriber = await this.subscriberRepository.findBySubscriberId(command.environmentId, command.subscriberId);
    if (!subscriber) throw new NotFoundException(`Subscriber not found`);

    const userPreference = await this.subscriberPreferenceRepository.findOne({
      accountId: command.accountId,
      _organizationId: command.organizationId,
      _environmentId: command.environmentId,
      _subscriberId: subscriber._id,
      _templateId: command.templateId,
    });

    Logger.debug('userPreference before update:', JSON.stringify(userPreference));

    const admin = await this.memberRepository.getOrganizationAdminAccount(command.organizationId);
    if (admin) {
      this.analyticsService.track('Update User Preference - [Notification Center]', admin._userId, {
        _organization: command.organizationId,
        _subscriber: subscriber._id,
        _template: command.templateId,
        channel: command.channel?.type,
        enabled: command.channel?.enabled,
      });
    }

    if (!userPreference) {
      await this.createUserPreference(command, subscriber);
    } else {
      await this.updateUserPreference(command, subscriber);
    }

    const template = await this.notificationTemplateRepository.findById(command.templateId, command.environmentId);
    if (!template) {
      throw new NotFoundException(`Template with id ${command.templateId} is not found`);
    }

    // TODO - do we need accountId for 'subscriber template preferences'?
    const getSubscriberPreferenceCommand = GetSubscriberTemplatePreferenceCommand.create({
      accountId: command.accountId,
      organizationId: command.organizationId,
      subscriberId: command.subscriberId,
      environmentId: command.environmentId,
      template,
    });

    return await this.getSubscriberTemplatePreference.execute(getSubscriberPreferenceCommand);
  }

  private async createUserPreference(
    command: UpdateSubscriberPreferenceCommand,
    subscriber: SubscriberEntity
  ): Promise<void> {
    const TEMP_DebugSafeStringify = (stringifyTarget?: any) => {
      try {
        console.log(JSON.stringify(stringifyTarget));
      } catch (e) {
        console.log('ERROR - failed to stringify a value:', stringifyTarget);
      }
    };

    console.log(
      'in createUserPreference - about to create preference for the following command data, for subscriber',
      subscriber.subscriberId,
      '- value of command.channel:'
    );
    TEMP_DebugSafeStringify(command.channel);

    const channelObj = {} as Record<'email' | 'sms' | 'in_app' | 'chat' | 'push', boolean>;
    if (command.channel) {
      console.log(
        'adding a channel preference of type',
        String(command.channel.type),
        'to be set to the following value for "enabled":',
        String(command.channel.enabled)
      );

      channelObj[command.channel.type] = command.channel.enabled;
    }

    console.log(
      'in createUserPreference - about to create preference for the following command data, for subscriber',
      subscriber.subscriberId,
      '-'
    );

    TEMP_DebugSafeStringify(command);

    console.log('in createUserPreference - value passed for command.enabled:', String(command.enabled));
    console.log('in createUserPreference - value passed for command.channels:');
    TEMP_DebugSafeStringify(command.channel?.type ? channelObj : null);

    await this.subscriberPreferenceRepository.create({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _subscriberId: subscriber._id,
      _templateId: command.templateId,
      accountId: command.accountId,
      /*
       * Unless explicitly set to false when creating a user preference we want it to be enabled
       * even if not passing at first enabled to true.
       */
      enabled: command.enabled !== false,
      channels: command.channel?.type ? channelObj : null,
    });
  }

  private async updateUserPreference(
    command: UpdateSubscriberPreferenceCommand,
    subscriber: SubscriberEntity
  ): Promise<void> {
    const TEMP_DebugSafeStringify = (stringifyTarget?: any) => {
      try {
        console.log(JSON.stringify(stringifyTarget));
      } catch (e) {
        console.log('ERROR - failed to stringify a value:', stringifyTarget);
      }
    };

    console.log(
      'in updateUserPreference - about to update preference for the following command data, for subscriber',
      subscriber.subscriberId,
      '- value of command.channel:'
    );
    TEMP_DebugSafeStringify(command.channel);

    const updatePayload: Partial<SubscriberPreferenceEntity> = {};

    console.log(
      'in updateUserPreference - the following value was passed for command.enabled:',
      String(command.enabled)
    );

    if (command.enabled != null) {
      console.log(
        'in updateUserPreference - adding the following value to the update payload for "enabled":',
        String(command.enabled)
      );

      updatePayload.enabled = command.enabled;
    }

    console.log(
      'in updateUserPreference - the following value was evaluated for command.channel?.type:',
      String(command.channel?.type)
    );

    if (command.channel?.type) {
      updatePayload[`channels.${command.channel.type}`] = command.channel.enabled;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new ApiException('In order to make an update you need to provider channel or enabled');
    }

    console.log('in updateUserPreference - final update payload being used as the $set expression in the update:');
    TEMP_DebugSafeStringify(updatePayload);

    await this.subscriberPreferenceRepository.update(
      {
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        _subscriberId: subscriber._id,
        _templateId: command.templateId,
        accountId: command.accountId,
      },
      {
        $set: updatePayload,
      }
    );
  }
}
