import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiClientData, User, informativeEvents, stakeholderStages } from './types';
import { ApiService } from './api.service';
import * as util from 'util';
import informativeEventsData from './data/informativeEvents';
import stakeholderStagesData from './data/stakeholderStages';
import defaultTemplatesData from './data/defaultTemplates';

@Injectable()
export class ApagoService {
  queue: Array<{ data: ApiClientData; cb: (err: any, data: User | null) => void }> = [];
  apiServices: Array<ApiService> = [];
  apiServiceCount = 10;
  informativeEvents: informativeEvents = informativeEventsData;
  stakeholderStages: stakeholderStages = stakeholderStagesData;

  constructor() {
    this.initServices();
  }

  /** NOTE: This cannot be safely used for anything other than the initial workflow creation in the "/lakeside" route. */
  _getInitialTemplateData() {
    return [
      ...informativeEventsData.flatMap((arr) => {
        return arr.events.map((val) => {
          return {
            internalId: val.value,
            name: val.label,
            critical: false,
            initialContent: defaultTemplatesData[val.value],
            email: false,
            in_app: false,
            digest: val.digest ? { ...val.digest } : undefined,
          };
        });
      }),
      ...stakeholderStagesData.map((val) => ({
        internalId: val.value,
        name: val.label,
        critical: true,
        initialContent: defaultTemplatesData[val.value],
        email: true,
        in_app: true,
        digest: val.digest ? { ...val.digest } : undefined,
      })),
    ];
  }

  async initServices() {
    for (let i = 0; i < this.apiServiceCount; i++) {
      const apiService = new ApiService();
      await apiService.init();
      this.apiServices.push(apiService);
    }
  }

  checkUserPermission(data: { accountId: string; userId: string; permissions: Array<string> }): Promise<User | null> {
    const queuePromise = util.promisify(this.addToQueue.bind(this));
    return queuePromise({ ...data, type: 'check_permission' });
  }

  checkStakeholderPermissions(data: {
    userId: string;
    accountId: string;
    jobId: string;
    stakeholderId: string;
    stage: string;
  }): Promise<User | null> {
    const queuePromise = util.promisify(this.addToQueue.bind(this));
    return queuePromise({ ...data, type: 'edit_stakeholder' });
  }

  addToQueue(data: ApiClientData, cb: () => void) {
    this.queue.push({ data, cb });
    this.processQueue();
  }

  async processQueue() {
    if (this.queue.length == 0) return;
    if (this.apiServices.length == 0) return;

    const apiClient = this.apiServices[0];
    this.apiServices.shift();

    const job = this.queue[0];
    this.queue.shift();

    try {
      if (job.data.type == 'edit_stakeholder') {
        const result = await apiClient.getStakeholder(job.data);
        job.cb(null, result);
      } else if (job.data.type == 'check_permission') {
        const result = await apiClient.getAccount(job.data);
        job.cb(null, result);
      } else {
        job.cb(new UnauthorizedException('Unknown operation'), null);
      }
    } catch (error) {
      job.cb(error, null);
    }

    this.apiServices.push(apiClient);
    this.processQueue();
  }
}
