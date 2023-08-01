import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  Email: string;

  @Prop()
  UserID: string;

  @Prop()
  FirstName: string;

  @Prop()
  LastName: string;

  @Prop()
  Accounts: Array<string>;

  @Prop()
  Roles: Array<string>;
}

export const UserSchema = SchemaFactory.createForClass(User);
