import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class BatchUpdateStakeholdersForJobCommand extends EnvironmentCommand {
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsNotEmpty()
  @IsString()
  jobId: string;

  @IsObject()
  @IsOptional()
  query?: {
    unconfirmed: boolean
  }

  @IsObject()
  update: {
    unconfirmed: boolean
  }
}
