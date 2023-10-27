import {
  IsArray,
  IsDefined,
  IsString,
  IsIn,
  IsBoolean,
  IsOptional,
  ValidateIf,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import * as INFORMATİVE_EVENTS from '../data/informativeEvents.json';
import { ChannelPreference } from '../../shared/dtos/channel-preference';

const events = INFORMATİVE_EVENTS.flatMap((arr) => arr.events);

const administrativeEvents = events.filter((val: any) => val.administrative).map((val) => val.value);

const partEvents = events.filter((val) => val.has_parts).map((val) => val.value);

export class InformativeSubscriptionsList {
  @IsDefined()
  @IsBoolean()
  @ValidateIf((o) => !administrativeEvents.includes(o.event))
  allTitles?: boolean;

  @IsDefined()
  @IsArray()
  @ValidateIf((o) => partEvents.includes(o.event))
  parts?: string[];

  @IsDefined()
  @IsString()
  templateId: string;

  @IsArray()
  preferences: ChannelPreference[];
}

export class InformativeSubscriptionsDto {
  @IsDefined()
  @IsArray()
  list!: InformativeSubscriptionsList[];
}

export class InformativeEventTriggerBodyDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNotEmpty()
  @IsString()
  @ValidateIf((o) => !administrativeEvents.includes(o.event))
  jobAccountId?: string;

  @IsNotEmpty()
  @IsString()
  @ValidateIf((o) => !administrativeEvents.includes(o.event))
  jobId?: string;

  @IsNotEmpty()
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
