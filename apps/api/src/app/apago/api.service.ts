import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

@Injectable()
export class ApiService {
  instance: AxiosInstance;
  data: any;
  constructor() {}

  async init() {
    const jar = new CookieJar();

    const instance = wrapper(axios.create({ jar, baseURL: process.env.LAKESIDE_API }));

    await instance.post('user/login?token=true', {
      email: process.env.LAKESIDE_EMAIL,
      password: process.env.LAKESIDE_PASSWORD,
    });

    this.instance = instance;
  }

  async getStakeholder(data: any) {
    try {
      this.data = data;
      await this.setAccount();
      await this.getJob();
      await this.getUser(data.userId, ['Stakeholder_Edit', data.stage]);
      return await this.getUser(data.stakeholderId, [data.stage]);
    } catch (error) {
      return null;
    }
  }

  async getAccount(data: any) {
    try {
      this.data = data;
      await this.setAccount();
      return await this.getUser(data.userId, data.permissions);
    } catch (error) {
      return null;
    }
  }

  async setAccount() {
    await this.instance.post('/user/setaccount', {
      account: this.data.accountId,
    });
  }

  async getJob() {
    await this.instance.get(`/job/job/${this.data.jobId}`);
  }

  async getPermissions(name) {
    const res = await this.instance.get(`/admin/rolesets`);

    const permissions = res.data[0].Roles[name].Permissions;
    return permissions;
  }

  async getUser(id: string, permissions: Array<string>) {
    const res = await this.instance.get(`/admin/user/${id}`);

    const { Accounts, Roles } = res.data;

    const index = Accounts.indexOf(this.data.accountId);

    const userPermissions = await this.getPermissions(Roles[index]);

    for (let i = 0; i < permissions.length; i++) {
      if (!userPermissions.includes(permissions[i])) throw new Error('Unauthorized');
    }

    return res.data;
  }
}
