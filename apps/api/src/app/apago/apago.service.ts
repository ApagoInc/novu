import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiClientData, User } from './types';
import { TriggerRecipientsTypeEnum } from '@novu/shared';
import { ApiService } from './api.service';
import * as util from 'util';
import slugify from 'slugify';
import * as INFORMATİVE_EVENTS from './data/informativeEvents.json';
import * as STAKEHOLDER_STAGES from './data/stakeholderStages.json';
import * as DEFAULT_TEMPLATES from './data/defaultTemplates.json';

@Injectable()
export class ApagoService {
  queue: Array<{ data: ApiClientData; cb: (err: any, data: User | null) => void }> = [];
  apiServices: Array<ApiService> = [];
  apiServiceCount = 10;
  informativeEvents = INFORMATİVE_EVENTS;
  stakeholderStages = STAKEHOLDER_STAGES;

  constructor() {
    this.initServices();
  }

  getTemplates() {
    return [
      ...INFORMATİVE_EVENTS.flatMap((arr) =>
        arr.events.map((val) => ({
          name: val.label,
          critical: false,
          initialContent: DEFAULT_TEMPLATES[val.value],
        }))
      ),
      ...STAKEHOLDER_STAGES.map((val) => ({
        name: val.label,
        critical: true,
        initialContent: DEFAULT_TEMPLATES[val.value],
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
        job.cb(new UnauthorizedException('Unkown operation'), null);
      }
    } catch (error) {
      job.cb(error, null);
    }

    this.apiServices.push(apiClient);
    this.processQueue();
  }

  getStakeholderKey(body: { jobId: string; part: string; stage: string }) {
    return `stakeholder:${body.jobId}:${body.stage}:${body.part}`;
  }

  getInformativeKey(payload: {
    part?: string;
    event: string;
    accountId: string;
    userId: string;
    allTitles?: boolean;
    administrative?: boolean;
  }) {
    const event: any = this.informativeEvents
      .flatMap((events) => events.events)
      .find((val) => val.value == payload.event);

    const key = ['informative', payload.accountId, payload.event];

    if (payload.part && !event?.no_parts && !event.administrative) {
      key.push(payload.part);
    }

    if (!payload.allTitles && !event?.administrative) {
      key.push(payload.userId);
    }

    return key.join(':');
  }

  getInformativeEvents(body: { part: string; payload?: any; event: string; accountId: string; userId: string }) {
    const all = [true, false];

    const event: any = this.informativeEvents.flatMap((events) => events.events).find((val) => val.value == body.event);

    if (!event?.label) return [];

    const events = all.map((allTitles) => ({
      name: `${slugify(event?.label, { lower: true, strict: true })}`,
      payload: body.payload || {},
      to: [
        {
          type: 'Topic' as TriggerRecipientsTypeEnum.TOPIC,
          topicKey: this.getInformativeKey({
            event: body.event,
            part: body.part,
            accountId: body.accountId,
            userId: body.userId,
            allTitles,
          }),
        },
      ],
    }));

    return event.administrative ? [events[0]] : events;
  }
}
