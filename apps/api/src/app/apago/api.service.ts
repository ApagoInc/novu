import { Injectable } from '@nestjs/common';
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
    try {
      if (data.type !== 'edit_stakeholder') return null;
      await this.setAccount(data.accountId);
      await this.getJob(data.jobId);
      await this.getUser(data.userId, data.accountId, ['Stakeholder_Edit', data.stage]);
      return await this.getUser(data.stakeholderId, data.accountId, [data.stage]);
    } catch (error) {
      return null;
    }
  }

  async getAccount(data: ApiClientData) {
    try {
      if (data.type !== 'check_permission') return null;
      await this.setAccount(data.accountId);
      return await this.getUser(data.userId, data.accountId, data.permissions);
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async setAccount(accountId: string) {
    await this.instance.post('/user/setaccount', {
      account: accountId,
    });
  }

  async getJob(jobId: string) {
    await this.instance.get(`/job/job/${jobId}`);
  }

  async getPermissions(roleName: string, accountId: string) {
    const res = await this.instance.get(`/admin/account/${accountId}`);

    const permissions = res.data.Roleset.Roles[roleName].Permissions;
    return permissions;
  }

  async getUser(id: string, accountId: string, permissions: Array<string>) {
    const res = await this.instance.get(`/admin/user/${id}`);

    const { Accounts, Roles } = res.data;

    const index = Accounts.indexOf(accountId);

    const userPermissions = await this.getPermissions(Roles[index], accountId);

    for (let i = 0; i < permissions.length; i++) {
      if (!userPermissions.includes(permissions[i])) throw new Error('Unauthorized');
    }

    return res.data;
  }
}
