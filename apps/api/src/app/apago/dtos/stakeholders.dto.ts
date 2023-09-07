import { ArrayMinSize, IsArray, IsDefined, IsString, IsIn } from 'class-validator';
import * as STAKEHOLDER_STAGES from '../data/stakeholderStages.json';

const stages = STAKEHOLDER_STAGES.map((val) => val.value);

export class StakeholderBodyDto {
  @IsDefined()
  @IsString()
  userId: string;

  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  parts: string[];

  @IsDefined()
  @IsIn(stages)
  stage: string;
}
