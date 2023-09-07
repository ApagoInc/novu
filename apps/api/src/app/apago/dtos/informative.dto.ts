import { ArrayMinSize, IsArray, IsDefined, IsString, IsIn, IsBoolean, IsOptional, ValidateIf } from 'class-validator';
import * as INFORMATİVE_EVENTS from '../data/informativeEvents.json';

const events = INFORMATİVE_EVENTS.flatMap((arr) => arr.events);

const administrativeEvents = events.filter((val: any) => val.administrative);

const partEvents = events.filter((val: any) => val.administrative || !val.no_parts);

export class InformativeBodyDto {
  @ValidateIf((o) => !administrativeEvents.includes(o.event))
  @IsOptional()
  @IsBoolean()
  allTitles?: boolean;

  @ValidateIf((o) => partEvents.includes(o.event))
  @IsDefined()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  parts: string[];

  @IsDefined()
  @IsIn(events.map((val) => val.value))
  event: string;
}
