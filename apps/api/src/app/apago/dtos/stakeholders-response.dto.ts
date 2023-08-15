import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined } from 'class-validator';

export class StakeholdersResponseDTO {
  subscriberId: string;
  stages: Array<{ stage: string; parts: Array<string> }>;
}
