import { IsArray, IsDefined } from 'class-validator';

import { ExternalSubscriberId, TopicKey } from '../../types';

import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class RemoveBulkSubscribersCommand extends EnvironmentCommand {
  @IsArray()
  @IsDefined()
  topicKeys: TopicKey[];

  @IsArray()
  @IsDefined()
  subscribers: ExternalSubscriberId[];
}
