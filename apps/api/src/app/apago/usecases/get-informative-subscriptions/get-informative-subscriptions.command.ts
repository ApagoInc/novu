import { IsDefined, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class GetInformativeSubscriptionsCommand extends EnvironmentCommand {
  @IsDefined()
  @IsMongoId()
  subscriberId: string;

  @IsNotEmpty()
  @IsString()
  accountId: string;
}
