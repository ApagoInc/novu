import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema()
export class Account {
  @Prop()
  AccountName: string;

  @Prop()
  AccountID: number;

  @Prop()
  status: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
