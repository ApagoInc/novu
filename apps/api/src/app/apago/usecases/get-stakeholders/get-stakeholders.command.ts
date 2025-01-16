import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class GetStakeholdersCommand extends EnvironmentCommand {
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @IsOptional()
  @IsBoolean()
  unconfirmed?: boolean;
}
