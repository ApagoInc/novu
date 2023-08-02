import { MongooseModule } from '@nestjs/mongoose';
import { USE_CASES } from '../topics/use-cases';
import { SharedModule } from '../shared/shared.module';
import { Module } from '@nestjs/common';
import { ApagoController } from './apago.controller';
import { AuthModule } from '../auth/auth.module';
import { ApagoService } from './apago.service';
import { User, UserSchema } from './schemas/user.schema';
import { Account, AccountSchema } from './schemas/account.schema';
import { SubscribersModule } from '../subscribers/subscribers.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/lake', {
      connectionName: 'apago',
    }),
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Account.name, schema: AccountSchema },
      ],
      'apago'
    ),
    AuthModule,
    SubscribersModule,
    SharedModule,
  ],
  controllers: [ApagoController],
  providers: [ApagoService, ...USE_CASES],
  exports: [...USE_CASES],
})
export class ApagoModule {}
