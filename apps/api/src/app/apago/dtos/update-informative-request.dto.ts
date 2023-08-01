import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined, IsOptional } from 'class-validator';
import { InformativeEvent } from '../types';

export class UpdateInformativeRequestDTO {
  @IsArray()
  @IsOptional()
  parts: string[];

  @IsDefined()
  userId: string;

  @IsDefined()
  accountId: string;

  @IsDefined()
  channel: string;

  @IsOptional()
  allTitles: boolean;

  @IsDefined()
  event: InformativeEvent;

  @IsOptional()
  administrative: boolean;
}
