import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriberEntity, SubscriberRepository, TopicSubscribersEntity } from '@novu/dal';
import { CachedEntity, buildSubscriberKey } from '@novu/application-generic';

import { GetCreateSubscriberCommand } from './get-create-subscriber.command';

type SubscriberEntityWithTopics = SubscriberEntity & { topicSubscribers: TopicSubscribersEntity[] };

@Injectable()
export class GetCreateSubscriber {
  constructor(private subscriberRepository: SubscriberRepository) {}

  async execute(command: GetCreateSubscriberCommand): Promise<SubscriberEntityWithTopics> {
    const { environmentId, subscriberId, topic } = command;

    const subscriber = await this.fetchSubscriberWithTopics({ _environmentId: environmentId, subscriberId, topic });
    if (subscriber) return subscriber;

    const createSubscriber = await this.subscriberRepository.create({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      firstName: command.firstName,
      lastName: command.lastName,
      subscriberId: command.subscriberId,
      email: command.email,
    });

    return { ...createSubscriber, topicSubscribers: [] };
  }

  private async fetchSubscriberWithTopics({
    subscriberId,
    _environmentId,
    topic,
  }: {
    subscriberId: string;
    _environmentId: string;
    topic?: string;
  }): Promise<SubscriberEntityWithTopics | null> {
    return await this.subscriberRepository.findBySubscriberIdWithTopics(_environmentId, subscriberId, topic);
  }
}
