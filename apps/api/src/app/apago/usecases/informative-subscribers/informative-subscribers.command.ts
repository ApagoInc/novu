import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class InformativeSubscribersCommand extends EnvironmentCommand {
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsNotEmpty()
  @IsMongoId()
  templateId: string;

  @IsOptional()
  @IsString()
  part?: string;
}
