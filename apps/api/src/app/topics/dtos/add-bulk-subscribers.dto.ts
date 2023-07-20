import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDefined } from 'class-validator';

import { ExternalSubscriberId } from '../types';

export class AddBulkSubscribersRequestDto {
  @ApiProperty({
    description: 'List of subscriber identifiers that will be associated to the topic',
  })
  @IsArray()
  @IsDefined()
  subscribers: ExternalSubscriberId[];

  @IsArray()
  @IsDefined()
  topicKeys: string[];
}
