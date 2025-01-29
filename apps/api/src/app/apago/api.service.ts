import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { ApiClientData } from './types';
import stakeholderStages from './data/stakeholderStages';

@Injectable()
export class ApiService {
  instance: AxiosInstance;
  lastLogin: null | number = null;
  constructor() {}

  async init() {
    const jar = new CookieJar();

    if (!process.env.LAKESIDE_API) {
      throw new InternalServerErrorException(
        `Server environment does not have the required LAKESIDE_API value defined.Must define LAKESIDE_API, LAKESIDE_EMAIL, and LAKESIDE_PASSWORD.`
      );
    }
    if (process.env.LAKESIDE_API && process.env.LAKESIDE_EMAIL) {
      console.log(
        `[INFO] *** API server is pointed at the following LSC API: ${process.env.LAKESIDE_API}; Using the following email: ${process.env.LAKESIDE_EMAIL}`
      );
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

    // The *editing* user really only has to have Stakeholder_Edit. For the *editing* user,
    // whether or not they have the permission for the stakeholder action (data.stage) is not relevant.
    const stakeholderEditorRequiredPerms = ['Stakeholder_Edit'];
    console.log('in getStakeholder with the following data:', JSON.stringify(data));
    console.log(
      'About to check permissions for the editing user. Will run getUser with the following params - userId:',
      data.userId,
      '- accountId:',
      data.accountId,
      'required permissions:',
      stakeholderEditorRequiredPerms
    );

    // Check the permissions of the editing user.
    await this.getLakesideUser(data.userId, data.accountId, [...stakeholderEditorRequiredPerms]);

    // Having gotten here without erroring out, now get the *requested* user's user object, and make sure they have the permission to perform the action that will be added to their stakeholder status (`data.stage` is the permission required).

    // Normally, we throw generic 401 exceptions from the getLakesideUser call.
    // In the case of stakeholders, however, we want to instead identify which one stage, if any, failed subscription for the potential user.
    // Then we will pass back a more helpful error message to the UI.
    // We do this by indicating below that this perm check is a subscription attempt.
    return await this.getLakesideUser(data.stakeholderId, data.accountId, [data.stage], { isSubscribeAttempt: true });
  }

  async getAccount(data: ApiClientData) {
    if (data.type !== 'check_permission') return null;
    await this.login();
    await this.setAccount(data.accountId);

    return await this.getLakesideUser(data.userId, data.accountId, data.permissions);
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

  async getLakesideUser(
    id: string,
    accountId: string,
    permissions: Array<string>,
    opts?: { isSubscribeAttempt: boolean }
  ) {
    try {
      const res = await this.instance.get(`/admin/user/${id}`);

      Logger.log('get user response');
      // Logger.debug(res);

      const { Accounts, Roles } = res.data;

      Logger.log('Accounts, Roles:');
      Logger.log(Accounts, Roles);

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
      Logger.error('Error in getLakesideUser:' + error);
      // In the case where signup for a single stage is attempted and it is an attempt to subscribe,
      // return a better error message.
      if (permissions.length === 1 && opts?.isSubscribeAttempt) {
        throw new UnauthorizedException({
          message: `User does not have the required permissions to subscribe to ${
            stakeholderStages?.find((entry) => entry.value === permissions[0])?.label || permissions[0]
          } events.`,
          reason: 'insufficient_permissions',
        });
      }
      throw new UnauthorizedException({
        message: 'User does not have the required permissions to participate in Novu notifications.',
        reason: 'insufficient_permissions',
      });
    }
  }

  async getJobList(
    id: string,
    jobAccountId: string,
    jobId: string,
    jobAssocAccts?: { [acct in 'parentAcct' | 'bookAcct' | 'tepAcct']?: string } | undefined
  ) {
    try {
      console.log(
        'in getJobList for the following params:',
        '(id is user ID)',
        JSON.stringify({ id, jobAccountId, jobId })
      );

      console.log('calling /admin/user/' + id);
      const res = await this.instance.get(`/admin/user/${id}`);

      console.log('response details:', res.status, res.statusText);

      const { JobsList } = res.data;

      // Here, we have to consider if we can always check all jobAssocAccts WITHOUT having to change the currently set account each time.

      // Maybe, at the upper level, we could always set the acct to the parentAcct value - which might always reliably give us access to all 3 accounts' lists.

      console.log('JobsList obtained in data:', JobsList);

      if (!JobsList) {
        console.log('did not obtain a JobsList back from the call. Returning false for getJobList.');
        return false;
      }

      // Again, be aware of the possibility that we might have to change the currently set account, but for now:
      if (jobAssocAccts) {
        if (jobAssocAccts.parentAcct) {
          console.log('checking JobsList, for the list for parentAcct', jobAssocAccts.parentAcct);
          const list = JobsList[jobAssocAccts.parentAcct];
          console.log('value of list for that account:', list);
          const found = list?.includes(jobId);
          console.log('Was the list was found to include the job under ID', jobId, '? ->', String(found));
          if (found) {
            return found;
          }
        }
        if (jobAssocAccts.bookAcct) {
          console.log('checking JobsList, for the list for bookAcct', jobAssocAccts.bookAcct);
          const list = JobsList[jobAssocAccts.bookAcct];
          console.log('value of list for that account:', list);
          const found = list?.includes(jobId);
          console.log('Was the list was found to include the job under ID', jobId, '? ->', String(found));
          if (found) {
            return found;
          }
        }
        if (jobAssocAccts.tepAcct) {
          console.log('checking JobsList, for the list for tepAcct', jobAssocAccts.tepAcct);
          const list = JobsList[jobAssocAccts.tepAcct];
          console.log('value of list for that account:', list);
          const found = list?.includes(jobId);
          console.log('Was the list was found to include the job under ID', jobId, '? ->', String(found));
          if (found) {
            return found;
          }
        }
        console.log('Could not find job in any of the listed associated accounts. Returning false');
        return false;
      } else {
        console.log('no jobAssociatedAccounts was defined! Just checking with the normal job account ID.');
        console.log('checking JobsList, for the list for account', jobAccountId);
        const list = JobsList[jobAccountId];

        console.log('value of list for that account:', list);

        console.log('Was the list was found to include the job under ID', jobId, '? ->', String(list.includes(jobId)));

        return list.includes(jobId);
      }
    } catch (error) {
      console.log('error in getJobList:', error);
      console.log('due to error, just returning false for getJobList.');
      return false;
    }
  }

  async getLakesideUsers() {
    const res = await this.instance.get(`/admin/users`);

    return res.data;
  }
}
