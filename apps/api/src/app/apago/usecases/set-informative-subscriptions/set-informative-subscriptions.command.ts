import { IsArray, IsDefined, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';
import { ChannelPreference } from '../../../shared/dtos/channel-preference';

class InformativeSubscriptionsList {
  allTitles?: boolean;

  templateId: string;

  parts?: string[];

  @IsArray()
  preferences: ChannelPreference[];
}

export class SetInformativeSubscriptionsCommand extends EnvironmentCommand {
  @IsDefined()
  @IsMongoId()
  subscriberId: string;

  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsDefined()
  @IsArray()
  list: InformativeSubscriptionsList[];

  @IsDefined()
  externalSubsciberId: string;
}
