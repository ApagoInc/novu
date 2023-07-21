import { IsBoolean, IsDefined, IsString, IsOptional } from 'class-validator';
import { EnvironmentCommand } from '../../../shared/commands/project.command';

export class GetSubscriberCommand extends EnvironmentCommand {
  @IsString()
  @IsDefined()
  subscriberId: string;

  @IsBoolean()
  @IsOptional()
  fetchTopics?: boolean;

  @IsString()
  @IsOptional()
  topic?: string;
}
