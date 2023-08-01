import { IsArray, IsDefined } from 'class-validator';
import { StakeholderStage } from '../types';

export class UpdateStakeholdersRequestDTO {
  @IsArray()
  @IsDefined()
  parts: string[];

  @IsDefined()
  userId: string;

  @IsDefined()
  stage: StakeholderStage;
}
