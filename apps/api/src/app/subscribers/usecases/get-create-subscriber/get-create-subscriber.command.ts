import { IsBoolean, IsDefined, IsString, IsOptional } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class GetCreateSubscriberCommand extends EnvironmentCommand {
  @IsString()
  @IsDefined()
  subscriberId: string;

  @IsBoolean()
  @IsOptional()
  fetchTopics?: boolean;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  email?: string;
}
