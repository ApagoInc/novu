import { IsArray, IsDefined, IsString, IsIn, IsOptional, IsObject } from 'class-validator';
import * as STAKEHOLDER_STAGES from '../data/stakeholderStages.json';

const stages = STAKEHOLDER_STAGES.map((val) => val.value);

export class StakeholderBodyDto {
  @IsDefined()
  @IsString()
  userId: string;

  @IsDefined()
  @IsArray()
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

  @IsOptional()
  @IsObject()
  payload?: any;
}
