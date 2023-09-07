import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriberRepository } from '@novu/dal';

import { GetCreateSubscriberCommand } from './get-create-subscriber.command';

@Injectable()
export class GetCreateSubscriber {
  constructor(private subscriberRepository: SubscriberRepository) {}

  async execute(command: GetCreateSubscriberCommand) {
    const { environmentId, subscriberId, topic } = command;

    const subscriber = await this.fetchSubscriberWithTopics({ _environmentId: environmentId, subscriberId, topic });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber not found for id ${subscriberId}`);
    }

    return subscriber;
  }

  private async fetchSubscriberWithTopics({
    subscriberId,
    _environmentId,
    topic,
  }: {
    subscriberId: string;
    _environmentId: string;
    topic: string;
  }) {
    return await this.subscriberRepository.findSubscriberTopics(_environmentId, subscriberId, topic);
  }
}
