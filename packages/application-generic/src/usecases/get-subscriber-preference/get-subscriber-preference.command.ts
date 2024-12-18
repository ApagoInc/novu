// import { IsOptional, IsString } from 'class-validator';
import { EnvironmentWithSubscriber } from '../../commands/project.command';

export class GetSubscriberPreferenceCommand extends EnvironmentWithSubscriber {
  accountId: string | null;
}
