import { IsNotEmpty, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class StakeholderSubscribersCommand extends EnvironmentCommand {
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @IsNotEmpty()
  @IsString()
  part: string;

  @IsNotEmpty()
  @IsString()
  stage: string;
}
