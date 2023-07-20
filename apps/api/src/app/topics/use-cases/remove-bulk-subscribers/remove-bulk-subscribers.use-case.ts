import { TopicSubscribersEntity, TopicSubscribersRepository } from '@novu/dal';
import { ConflictException, Injectable } from '@nestjs/common';

import { RemoveBulkSubscribersCommand } from './remove-bulk-subscribers.command';

import { EnvironmentId, OrganizationId, TopicId } from '../../types';

@Injectable()
export class RemoveBulkSubscribersUseCase {
  constructor(private topicSubscribersRepository: TopicSubscribersRepository) {}

  async execute(command: RemoveBulkSubscribersCommand): Promise<void> {
    for (const topicKey of command.topicKeys) {
      await this.topicSubscribersRepository.removeSubscribers(
        command.environmentId,
        command.organizationId,
        topicKey,
        command.subscribers
      );
    }

    return undefined;
  }
}
