import { IsArray, IsDefined, IsString, IsIn, IsJSON, IsOptional } from 'class-validator';
import * as STAKEHOLDER_STAGES from '../data/stakeholderStages.json';

const stages = STAKEHOLDER_STAGES.map((val) => val.value);

export class StakeholderBodyDto {
  @IsDefined()
  @IsString()
  userId: string;

  @IsDefined()
  @IsArray()
  @IsString()
  parts: string[];

  @IsDefined()
  @IsString()
  @IsIn(stages)
  stage: string;
}

export class StakeholdersResponseDto {
  @IsString()
  @IsDefined()
  subscriberId: string;

  @IsArray()
  stages: { stage: string; parts: string[] }[];
}

export class StakeholderEventTriggerBodyDto {
  @IsDefined()
  @IsString()
  jobId: string;

  @IsDefined()
  @IsString()
  part: string;

  @IsDefined()
  @IsString()
  @IsIn(stages)
  stage: string;

  @IsJSON()
  @IsOptional()
  payload?: any;
}
