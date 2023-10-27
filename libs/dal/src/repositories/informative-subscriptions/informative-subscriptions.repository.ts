import { SoftDeleteModel } from 'mongoose-delete';

import { BaseRepository } from '../base-repository';
import { InformativeSubscriptionsDBModel, InformativeSubscriptionsEntity } from './informative-subscriptions.entity';
import { InformativeSubscriptions } from './informative-subscriptions.schema';
import type { EnforceEnvOrOrgIds } from '../../types/enforce';

export class InformativeSubscriptionsRepository extends BaseRepository<
  InformativeSubscriptionsDBModel,
  InformativeSubscriptionsEntity,
  EnforceEnvOrOrgIds
> {
  private informativeSubscriptions: SoftDeleteModel;
  constructor() {
    super(InformativeSubscriptions, InformativeSubscriptionsEntity);
    this.informativeSubscriptions = InformativeSubscriptions;
  }

  async getInformativeSubscriptions(query: {
    _environmentId: string;
    _subscriberId: string;
    accountId: string;
    _organizationId: string;
  }) {
    const subscriptions = await this.MongooseModel.find(query)
      .select('parts allTitles accountId _templateId')
      .populate<{ template: { name: string } }>('template', 'name')
      .populate<{ preferences: any }>({
        path: 'preferences',
        match: { _subscriberId: query._subscriberId },
        select: 'channels',
      })
      .lean();

    return subscriptions;
  }

  async getSubscribers(query: {
    _templateId: string;
    _environmentId: string;
    accountId: string;
    _organizationId: string;
    part?: string;
  }) {
    const subscribers = await this.MongooseModel.find({ ...query, ...(query.part && { parts: query.part }) })

      .populate<{ subscriber: { subscriberId: string } }>('subscriber', 'subscriberId')
      .lean();

    return subscribers;
  }
}
