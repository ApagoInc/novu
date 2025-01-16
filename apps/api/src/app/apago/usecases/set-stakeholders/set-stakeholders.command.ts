import { IsArray, IsBoolean, IsDefined, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class SetStakeholdersCommand extends EnvironmentCommand {
  @IsDefined()
  @IsMongoId()
  subscriberId: string;

  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsNotEmpty()
  @IsString()
  jobId: string;

  @IsArray()
  parts: string[];

  @IsNotEmpty()
  @IsString()
  stage: string;

  @IsOptional()
  @IsBoolean()
  unconfirmed?: boolean;
}
