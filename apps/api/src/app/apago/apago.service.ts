import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Account } from './schemas/account.schema';
import { Connection } from 'mongoose';

@Injectable()
export class ApagoService {
  rolesMap = {
    RESOLVE_PREFLIGHT: ['role1', 'AccountAdmin'],
    APPROVE_TO_PRINT: ['role1'],
    APPROVE_CONTENT: ['role1', 'AccountAdmin'],
  };

  constructor(
    @InjectModel(User.name, 'apago') private userModel: Model<User>,
    @InjectModel(Account.name, 'apago') private accountModel: Model<Account>,
    @InjectConnection('apago') private connection: Connection
  ) {}

  getStakeholderKey(body: { jobId: string; part: string; stage: string }) {
    const key = Buffer.from(
      JSON.stringify({
        part: body.part,
        stage: body.stage,
        jobId: body.jobId,
      })
    ).toString('base64');

    return `stakeholder:${body.jobId}:${key}`;
  }

  getInformativeKey(payload: {
    part?: string;
    event: string;
    accountId: string;
    userId: string;
    channel: string;
    allTitles?: boolean;
    administrative?: boolean;
  }) {
    const key = Buffer.from(
      JSON.stringify({
        ...(payload.part && !payload.administrative && { part: payload.part }),
        event: payload.event,
        channel: payload.channel,
        ...(payload.allTitles && { user: payload.userId }),
        ...(payload.administrative && { administrative: true }),
      })
    ).toString('base64');

    return `informative:${payload.accountId}:${key}`;
  }

  async getJob(JobID: string, accountId: string): Promise<any> {
    return await this.connection.collection(`jobs-${accountId}`).findOne({ JobID });
  }

  async checkUserRole(userId: string, accountId: string, stage: string) {
    const user = await this.userModel.findOne({ Accounts: accountId, UserID: userId });

    if (!user) return null;

    const { Accounts, Roles } = user;

    const index = Accounts.indexOf(accountId);

    if (index == -1) return null;

    const role = Roles[index];

    if (this.rolesMap[stage] && this.rolesMap[stage].includes(role)) return user;

    return null;
  }

  async checkUserAccount(userId: string, accountId: string) {
    const user = await this.userModel.findOne({ Accounts: accountId, UserID: userId });

    if (!user) return null;

    const { Accounts } = user;

    const index = Accounts.indexOf(accountId);

    if (index == -1) return null;

    return user;
  }

  async getAllUsers() {
    return await this.userModel.find();
  }
}
