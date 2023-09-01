import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AdministrativeEvent, ApiClientData, InformativeEvents, StakeholderStages, User } from './types';
import validator from 'validator';
import { TemplateVariableTypeEnum, TriggerRecipientsTypeEnum } from '@novu/shared';
import { ApiService } from './api.service';
import * as util from 'util';
import slugify from 'slugify';

@Injectable()
export class ApagoService {
  queue: Array<{ data: ApiClientData; cb: (err: any, data: User | null) => void }> = [];
  apiServices: Array<ApiService> = [];
  apiServiceCount = 10;

  baseVariables = [
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'accountName' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'accountID' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'actorUserID' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'actorUserName' },
    { type: TemplateVariableTypeEnum.STRING, required: false, name: 'href' },
  ];

  titleVariables = [
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'titleName' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'titleID' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'titleOwnerUserID' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'titleOwnerUserName' },
  ];

  componentVariables = [
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'componentName' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'componentID' },
  ];

  pageVariables = [
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'pageID' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'pageOrdinal' },
    { type: TemplateVariableTypeEnum.STRING, required: true, name: 'pageCount' }
  ]

  informativeEvents: InformativeEvents = [
    {
      title: 'Title Events',
      events: [
        {
          label: 'Title Created',
          value: 'TITLE_CREATED',
          no_parts: true,
          variables: [...this.baseVariables, ...this.titleVariables]
        },
        {
          label: 'Title Deleted',
          value: 'TITLE_DELETED',
          no_parts: true,
          variables: [...this.baseVariables, ...this.titleVariables],
        },
        {
          label: 'Component Created',
          value: 'COMPONENT_CREATED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables],
        },
        {
          label: 'File(s) Uploaded',
          value: 'FILES_UPLOADED',
          variables: [
            ...this.baseVariables,
            ...this.titleVariables,
            ...this.componentVariables,
            { required: true, type: TemplateVariableTypeEnum.STRING, name: 'files' },
          ],
        },
        {
          label: 'Component Deleted',
          value: 'COMPONENT_DELETED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables],
        },
        {
          label: 'Page(s) Deleted',
          value: 'PAGES_DELETED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables, ...this.pageVariables]
        },
        {
          label: 'Title Archive Retrieval Requested',
          value: 'TITLE_ARCHIVE_RETRIEVAL_REQUESTED',
          variables: [...this.baseVariables, ...this.titleVariables],
        },
        {
          label: 'Title Retrieved From Archive',
          value: 'TITLE_RETRIEVED_FROM_ARCHIVE',
          variables: [...this.baseVariables, ...this.titleVariables],
        },
        {
          label: 'Title Not Found In Archive',
          value: 'TITLE_NOT_FOUND_IN_ARCHIVE',
          variables: [...this.baseVariables, ...this.titleVariables],
        },
      ],
    },
    {
      title: 'File Check Event',
      events: [
        {
          label: 'Preflight Warnings/Errors',
          value: 'PREFLIGHT_WARNINGS_ERRORS',
          variables: [...this.baseVariables, ...this.titleVariables],
        },
        {
          label: 'Specifications Warning/Errors',
          value: 'SPECIFICATIONS_WARNINGS_ERRORS',
          variables: [...this.baseVariables, ...this.titleVariables],
        },
      ],
    },
    {
      title: 'Proofing Events',
      events: [
        {
          label: 'Page Review(s) Requested',
          value: 'PAGE_REVIEWS_REQUESTED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables, ...this.pageVariables]
        },
        {
          label: 'Component Review Requested',
          value: 'COMPONENT_REVIEW_REQUESTED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables],
        },
        {
          label: 'Title Review Requested',
          value: 'TITLE_REVIEW_REQUESTED',
          no_parts: true,
          variables: [...this.baseVariables, ...this.titleVariables],
        },
        {
          label: 'Page Approval(s) Requested',
          value: 'PAGE_APPROVALS_REQUESTED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables, ...this.pageVariables]
        },
        {
          label: 'Component Approval Requested',
          value: 'COMPONENT_APPROVAL_REQUESTED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables],
        },
        {
          label: 'Title Approval Requested',
          value: 'TITLE_APPROVAL_REQUESTED',
          no_parts: true,
          variables: [...this.baseVariables, ...this.titleVariables],
        },
        {
          label: 'Page Proof(s) Approved',
          value: 'PAGE_PROOFS_APPROVED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables, ...this.pageVariables]
        },
        {
          label: 'Page Proof(s) Rejected',
          value: 'PAGE_PROOFS_REJECTED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables, ...this.pageVariables]
        },
        {
          label: 'Component Proof Approved',
          value: 'COMPONENT_PROOF_APPROVED',
          variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables],
        },
        {
          label: 'Title Proof Approved',
          value: 'TITLE_PROOF_APPROVED',
          no_parts: true,
          variables: [...this.baseVariables, ...this.titleVariables],
        },
        {
          label: 'Title Ready for Delivery',
          value: 'TITLE_READY_FOR_DELIVERY',
          no_parts: true,
          variables: [...this.baseVariables, ...this.titleVariables],
        },
      ],
    },
    {
      title: 'Administrative Events',
      events: [
        {
          label: 'User Was Created',
          value: 'USER_WAS_CREATED',
          no_parts: true,
          variables: this.baseVariables
        },
        {
          label: 'User Was Modified',
          value: 'USER_WAS_MODIFIED',
          no_parts: true,
          variables: this.baseVariables
        },
        {
          label: 'User Was Deleted',
          value: 'USER_WAS_DELETED',
          no_parts: true,
          variables: this.baseVariables
        },
      ],
    },
  ];

  stakeholderStages: StakeholderStages = [
    {
      label: 'Resolve Preflight',
      value: 'Preflight1_ApplyFix',
      variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables],
    },
    {
      label: 'Approve Content',
      value: 'Preflight1_Signoff',
      variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables],
    },
    {
      label: 'Approve to Print',
      value: 'Preflight2_Signoff',
      variables: [...this.baseVariables, ...this.titleVariables, ...this.componentVariables],
    },
  ];

  administrativeEvents: Array<AdministrativeEvent> = ['USER_WAS_CREATED', 'USER_WAS_MODIFIED', 'USER_WAS_DELETED'];

  constructor() {
    this.initServices();
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
    const key = Buffer.from(
      JSON.stringify({
        part: body.part,
        stage: body.stage,
        jobId: body.jobId,
      })
    ).toString('base64');

    return `stakeholder:${body.jobId}:${key}`;
  }

  parsePayload(payload: string) {
    if (!payload) return null;

    if (!validator.isBase64(payload)) return null;

    const string = Buffer.from(payload, 'base64').toString();

    if (!validator.isJSON(string)) return null;

    return JSON.parse(string);
  }

  getInformativeKey(payload: {
    part?: string;
    event: string;
    accountId: string;
    userId: string;
    allTitles?: boolean;
    administrative?: boolean;
  }) {
    const administrative = this.administrativeEvents.includes(payload.event as AdministrativeEvent);

    const key = Buffer.from(
      JSON.stringify({
        ...(payload.part && !administrative && { part: payload.part }),
        event: payload.event,
        ...(payload.allTitles && { user: payload.userId }),
        ...(administrative && { administrative: true }),
      })
    ).toString('base64');

    return `informative:${payload.accountId}:${key}`;
  }

  getInformativeEvents(body: { part: string; payload?: any; event: string; accountId: string; userId: string }) {
    const all = [true, false];

    const event = this.informativeEvents.flatMap((events) => events.events).find((val) => val.value == body.event);

    if (!event?.label) return [];

    const events = all.map((allTitles) => ({
      name: `${slugify(event?.label, { lower: true, strict: true })}`,
      payload: body.payload || {},
      to: [
        {
          type: 'Topic' as TriggerRecipientsTypeEnum.TOPIC,
          topicKey: this.getInformativeKey({
            event: body.event,
            ...(!event?.no_parts && { part: body.part }),
            accountId: body.accountId,
            userId: body.userId,
            allTitles,
          }),
        },
      ],
    }));

    return events;
  }
}
