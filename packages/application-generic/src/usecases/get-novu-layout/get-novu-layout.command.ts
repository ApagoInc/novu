import { IsDefined, IsString } from 'class-validator';
import { BaseCommand } from '../../commands/base.command';

export class GetNovuLayoutCommand extends BaseCommand {
  @IsString()
  @IsDefined()
  layoutName: string
}
