import { Injectable, Logger } from '@nestjs/common';
import { SubscriberRepository } from '@novu/dal';
import { SubscriberEntity } from '@novu/dal';

import {
  CachedEntity,
  InvalidateCacheService,
  buildSubscriberKey,
} from '../../services/cache';
import { CreateSubscriberCommand } from './create-subscriber.command';
import {
  UpdateSubscriber,
  UpdateSubscriberCommand,
} from '../update-subscriber';

@Injectable()
export class CreateSubscriber {
  constructor(
    private invalidateCache: InvalidateCacheService,
    private subscriberRepository: SubscriberRepository,
    private updateSubscriber: UpdateSubscriber
  ) {}

  async execute(command: CreateSubscriberCommand) {
    
    
// TODO - remove logs in this fn
Logger.log('Create subscriber execute is running')

    
    
    let subscriber =
      command.subscriber ??
      (await this.fetchSubscriber({
        _environmentId: command.environmentId,
        subscriberId: command.subscriberId,
      }));

    if (!subscriber) {
      await this.invalidateCache.invalidateByKey({
        key: buildSubscriberKey({
          subscriberId: command.subscriberId,
          _environmentId: command.environmentId,
        }),
      });


      Logger.log(`[${new Date().toISOString()}] - !!! - subscriber under subscriberId ${command.subscriberId} does not yet exist. Creating now...`)

      subscriber = await this.subscriberRepository.create({
        _environmentId: command.environmentId,
        _organizationId: command.organizationId,
        firstName: command.firstName,
        lastName: command.lastName,
        subscriberId: command.subscriberId,
        email: command.email,
        phone: command.phone,
        avatar: command.avatar,
        locale: command.locale,
        data: command.data,
      });
    } else {

      Logger.log(`[${new Date().toISOString()}] updating existing subscriber under ${command.subscriberId}...`)

      subscriber = await this.updateSubscriber.execute(
        UpdateSubscriberCommand.create({
          environmentId: command.environmentId,
          organizationId: command.organizationId,
          firstName: command.firstName,
          lastName: command.lastName,
          subscriberId: command.subscriberId,
          email: command.email,
          phone: command.phone,
          avatar: command.avatar,
          locale: command.locale,
          data: command.data,
          subscriber,
        })
      );
    }

    return subscriber;
  }

  @CachedEntity({
    builder: (command: { subscriberId: string; _environmentId: string }) =>
      buildSubscriberKey({
        _environmentId: command._environmentId,
        subscriberId: command.subscriberId,
      }),
  })
  private async fetchSubscriber({
    subscriberId,
    _environmentId,
  }: {
    subscriberId: string;
    _environmentId: string;
  }): Promise<SubscriberEntity | null> {
    return await this.subscriberRepository.findBySubscriberId(
      _environmentId,
      subscriberId,
      true
    );
  }
}
