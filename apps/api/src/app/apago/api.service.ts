import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { ApiClientData } from './types';

@Injectable()
export class ApiService {
  instance: AxiosInstance;
  lastLogin: null | number = null;
  constructor() {}

  async init() {
    const jar = new CookieJar();

    if (!process.env.LAKESIDE_API) {
      throw new InternalServerErrorException(`Server environment does not have the required LAKESIDE_API value defined.Must define LAKESIDE_API, LAKESIDE_EMAIL, and LAKESIDE_PASSWORD.`)
    }
    const instance = wrapper(axios.create({ jar, baseURL: process.env.LAKESIDE_API }));

    this.instance = instance;
  }

  async login() {
    const now = Math.floor(Date.now() / 1000);

    if (this.lastLogin === null || now - this.lastLogin > 3600) {
      await this.instance.post('user/login?token=true', {
        email: process.env.LAKESIDE_EMAIL,
        password: process.env.LAKESIDE_PASSWORD,
      });

      this.lastLogin = now;
    }
  }

  async getStakeholder(data: ApiClientData) {
    if (data.type !== 'edit_stakeholder') return null;
    await this.login();
    await this.setAccount(data.accountId);
    await this.getJob(data.jobId);
    await this.getUser(data.userId, data.accountId, ['Stakeholder_Edit', data.stage]);

    return await this.getUser(data.stakeholderId, data.accountId, [data.stage]);
  }

  async getAccount(data: ApiClientData) {
    if (data.type !== 'check_permission') return null;
    await this.login();
    await this.setAccount(data.accountId);

    return await this.getUser(data.userId, data.accountId, data.permissions);
  }

  async setAccount(accountId: string) {
    try {
      await this.instance.post('/user/setaccount', {
        account: accountId,
      });
    } catch (error) {
      throw new UnauthorizedException("Can't find account!");
    }
  }

  async getJob(jobId: string) {
    try {
      await this.instance.get(`/job/job/${jobId}`);
    } catch (error) {
      throw new UnauthorizedException("Can't find job!");
    }
  }

  async getPermissions(roleName: string, accountId: string) {
    const res = await this.instance.get(`/admin/account/${accountId}`);

    const permissions = res.data.Roleset.Roles[roleName].Permissions;

    return permissions;
  }

  async getUser(id: string, accountId: string, permissions: Array<string>) {
    try {
      const res = await this.instance.get(`/admin/user/${id}`);

      Logger.debug('get user response');
      // Logger.debug(res);

      const { Accounts, Roles } = res.data;

      Logger.debug('Accounts, Roles:');
      Logger.debug(Accounts, Roles);

      const index = Accounts.indexOf(accountId);

      const userPermissions = await this.getPermissions(Roles[index], accountId);

      for (let i = 0; i < permissions.length; i++) {
        Logger.log(
          `userPermissions includes the permission ${permissions[i]} ? - ${userPermissions.includes(permissions[i])}`
        );
        if (!userPermissions.includes(permissions[i])) throw new Error('Unauthorized');
      }

      return res.data;
    } catch (error) {
      Logger.error('Error in getUser:');
      Logger.error(error);
      throw new UnauthorizedException({message: 'User does not have the required permissions to participate in Novu notifications.', reason: 'insufficient_permissions'});
    }
  }

  async getJobList(id: string, jobAccountId: string, jobId: string) {
    try {
      const res = await this.instance.get(`/admin/user/${id}`);

      const { JobsList } = res.data;

      if (!JobsList) return false;

      const list = JobsList[jobAccountId];

      return list.includes(jobId);
    } catch (error) {
      return false;
    }
  }

  async getUsers() {
    const res = await this.instance.get(`/admin/users`);

    return res.data;
  }
}
