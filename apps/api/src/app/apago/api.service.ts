import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { ApiClientData } from './types';

@Injectable()
export class ApiService {
  instance: AxiosInstance;
  constructor() {}

  async init() {
    const jar = new CookieJar();

    const instance = wrapper(axios.create({ jar, baseURL: process.env.LAKESIDE_API }));

    this.instance = instance;

    await this.login();
  }

  async login() {
    await this.instance.post('user/login?token=true', {
      email: process.env.LAKESIDE_EMAIL,
      password: process.env.LAKESIDE_PASSWORD,
    });
  }

  async getStakeholder(data: ApiClientData) {
    if (data.type !== 'edit_stakeholder') return null;
    await this.setAccount(data.accountId);
    await this.getJob(data.jobId);
    await this.getUser(data.userId, data.accountId, ['Stakeholder_Edit', data.stage]);
    return await this.getUser(data.stakeholderId, data.accountId, [data.stage]);
  }

  async getAccount(data: ApiClientData) {
    if (data.type !== 'check_permission') return null;
    await this.setAccount(data.accountId);
    return await this.getUser(data.userId, data.accountId, data.permissions);
  }

  async setAccount(accountId: string) {
    try {
      await this.instance.post('/user/setaccount', {
        account: accountId,
      });
    } catch (error) {
      console.log(error.response.data);
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

      const { Accounts, Roles } = res.data;

      const index = Accounts.indexOf(accountId);

      const userPermissions = await this.getPermissions(Roles[index], accountId);

      for (let i = 0; i < permissions.length; i++) {
        if (!userPermissions.includes(permissions[i])) throw new Error('Unauthorized');
      }

      return res.data;
    } catch (error) {
      throw new UnauthorizedException('Insufficient permissions');
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
