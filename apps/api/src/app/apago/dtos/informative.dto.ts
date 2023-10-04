import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsString,
  IsIn,
  IsBoolean,
  IsOptional,
  ValidateIf,
  IsJSON,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import * as INFORMATİVE_EVENTS from '../data/informativeEvents.json';

const events = INFORMATİVE_EVENTS.flatMap((arr) => arr.events);

const administrativeEvents = events.filter((val: any) => val.administrative).map((val) => val.value);

const partEvents = events.filter((val) => val.has_parts).map((val) => val.value);

export class InformativeBodyDto {
  @IsDefined()
  @IsString()
  @IsIn(['allTitles', 'myTitles'])
  @ValidateIf((o) => !administrativeEvents.includes(o.event))
  titles?: string;

  @IsDefined()
  @IsArray()
  @ValidateIf((o) => partEvents.includes(o.event))
  parts?: string[];

  @IsDefined()
  @IsString()
  @IsIn(events.map((val) => val.value))
  event: string;

  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @IsOptional()
  @IsBoolean()
  email?: boolean;
}

export class InformativeBulkBodyDto {
  @IsDefined()
  @IsArray()
  eventList!: InformativeBodyDto[];
}

export class InformativeEventTriggerBodyDto {
  @IsDefined()
  @IsString()
  @IsDefined()
  accountId: string;

  @IsDefined()
  @IsString()
  @ValidateIf((o) => !administrativeEvents.includes(o.event))
  jobAccountId?: string;

  @IsDefined()
  @IsString()
  @ValidateIf((o) => !administrativeEvents.includes(o.event))
  jobId?: string;

  @IsDefined()
  @IsString()
  @ValidateIf((o) => partEvents.includes(o.event))
  part?: string;

  @IsDefined()
  @IsIn(events.map((val) => val.value))
  @IsNotEmpty()
  event: string;

  @IsOptional()
  @IsObject()
  payload?: any;
}
