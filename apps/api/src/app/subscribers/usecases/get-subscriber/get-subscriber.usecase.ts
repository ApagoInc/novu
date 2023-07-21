import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriberEntity, SubscriberRepository } from '@novu/dal';
import { CachedEntity, buildSubscriberKey } from '@novu/application-generic';

import { GetSubscriberCommand } from './get-subscriber.command';

@Injectable()
export class GetSubscriber {
  constructor(private subscriberRepository: SubscriberRepository) {}

  async execute(command: GetSubscriberCommand): Promise<SubscriberEntity> {
    const { environmentId, subscriberId, fetchTopics, topic } = command;
    const subscriber = await this.fetchSubscriber({ _environmentId: environmentId, subscriberId, fetchTopics, topic });
    if (!subscriber) {
      throw new NotFoundException(`Subscriber not found for id ${subscriberId}`);
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
    fetchTopics,
    topic,
  }: {
    subscriberId: string;
    _environmentId: string;
    fetchTopics?: boolean;
    topic?: string;
  }): Promise<SubscriberEntity | null> {
    if (fetchTopics)
      return await this.subscriberRepository.findBySubscriberIdWithTopics(_environmentId, subscriberId, topic);
    return await this.subscriberRepository.findBySubscriberId(_environmentId, subscriberId);
  }
}
