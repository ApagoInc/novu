import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined } from 'class-validator';

export class InformativeResponseDTO {
  event: string;
  parts: Array<string>;
  channel: string;
  user?: string;
}
