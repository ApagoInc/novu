import { IsArray, IsDefined, IsOptional, IsString } from 'class-validator';

import { ExternalSubscriberId, TopicKey } from '../../types';

import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class AddBulkSubscribersCommand extends EnvironmentCommand {
  @IsArray()
  @IsDefined()
  topicKeys: TopicKey[];

  @IsArray()
  @IsDefined()
  subscribers: ExternalSubscriberId[];

  @IsString()
  @IsOptional()
  templateId?: string;
}
