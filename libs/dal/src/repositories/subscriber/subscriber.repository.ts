import { SoftDeleteModel } from 'mongoose-delete';
import { FilterQuery } from 'mongoose';

import { SubscriberEntity, SubscriberDBModel } from './subscriber.entity';
import { Subscriber } from './subscriber.schema';
import { IExternalSubscribersEntity } from './types';
import { BaseRepository } from '../base-repository';
import { DalException } from '../../shared';
import type { EnforceEnvOrOrgIds } from '../../types';
import { EnvironmentId, ISubscribersDefine, OrganizationId } from '@novu/shared';

type SubscriberQuery = FilterQuery<SubscriberDBModel> & EnforceEnvOrOrgIds;

const TOPIC_SUBSCRIBERS_COLLECTION = 'topicsubscribers';

const lookup = {
  $lookup: {
    from: 'topicsubscribers',
    localField: 'subscriberId',
    foreignField: 'externalSubscriberId',
    as: 'topicSubscribers',
  },
};

const lookupPipe = {
  $lookup: {
    from: 'topicsubscribers',
    let: { subscriberId: '$subscriberId' },
    pipeline: [
      {
        $match: {
          topicKey: { $regex: 'test', $options: 'i' },
          $expr: { $and: [{ $eq: ['$externalSubscriberId', '$$subscriberId'] }] },
        },
      },
    ],
    as: 'topicSubscribers',
  },
};

export class SubscriberRepository extends BaseRepository<SubscriberDBModel, SubscriberEntity, EnforceEnvOrOrgIds> {
  private subscriber: SoftDeleteModel;
  constructor() {
    super(Subscriber, SubscriberEntity);
    this.subscriber = Subscriber;
  }

  async findBySubscriberId(
    environmentId: string,
    subscriberId: string,
    secondaryRead = false
  ): Promise<SubscriberEntity | null> {
    return await this.findOne(
      {
        _environmentId: environmentId,
        subscriberId,
      },
      undefined,
      { readPreference: secondaryRead ? 'secondaryPreferred' : 'primary' }
    );
  }

  async findBySubscriberIdWithTopics(environmentId: string, subscriberId: string, topicKey?: string) {
    const subscriber = await this.aggregate([
      { $match: { $and: [{ _environmentId: this.convertStringToObjectId(environmentId) }, { subscriberId }] } },
      {
        $lookup: {
          from: 'topicsubscribers',
          let: { subscriberId: '$subscriberId' },
          pipeline: [
            {
              $match: {
                ...(topicKey && {
                  topicKey: { $regex: topicKey, $options: 'i' },
                }),
                _environmentId: this.convertStringToObjectId(environmentId),
                $expr: { $and: [{ $eq: ['$externalSubscriberId', '$$subscriberId'] }] },
              },
            },
          ],
          as: 'topicSubscribers',
        },
      },
      { $limit: 1 },
    ]);
    return subscriber[0];
  }

  async bulkCreateSubscribers(
    subscribers: ISubscribersDefine[],
    environmentId: EnvironmentId,
    organizationId: OrganizationId
  ) {
    const bulkWriteOps = subscribers.map((subscriber) => {
      const { subscriberId, ...rest } = subscriber;

      return {
        updateOne: {
          filter: { subscriberId, _environmentId: environmentId, _organizationId: organizationId },
          update: { $set: rest },
          upsert: true,
        },
      };
    });

    let bulkResponse;
    try {
      bulkResponse = await this.bulkWrite(bulkWriteOps);
    } catch (e) {
      if (!e.writeErrors) {
        throw new DalException(e.message);
      }
      bulkResponse = e.result;
    }
    const created = bulkResponse.getUpsertedIds();
    const writeErrors = bulkResponse.getWriteErrors();

    const indexes: number[] = [];

    const insertedSubscribers = created.map((inserted) => {
      indexes.push(inserted.index);

      return mapToSubscriberObject(subscribers[inserted.index]?.subscriberId);
    });

    let failed = [];
    if (writeErrors.length > 0) {
      failed = writeErrors.map((error) => {
        indexes.push(error.err.index);

        return {
          message: error.err.errmsg,
          subscriberId: error.err.op?.subscriberId,
        };
      });
    }

    const updatedSubscribers = subscribers
      .filter((subId, index) => !indexes.includes(index))
      .map((subscriber) => {
        return mapToSubscriberObject(subscriber.subscriberId);
      });

    return {
      updated: updatedSubscribers,
      created: insertedSubscribers,
      failed,
    };
  }

  async searchByExternalSubscriberIds(
    externalSubscribersEntity: IExternalSubscribersEntity
  ): Promise<SubscriberEntity[]> {
    const { _environmentId, _organizationId, externalSubscriberIds } = externalSubscribersEntity;

    return this.find({
      _environmentId,
      _organizationId,
      subscriberId: {
        $in: externalSubscriberIds,
      },
    });
  }

  async searchSubscribers(environmentId: string, subscriberIds: string[] = [], emails: string[] = [], search?: string) {
    const filters: any = [];

    if (emails?.length) {
      filters.push({
        email: {
          $in: emails,
        },
      });
    }

    if (subscriberIds?.length) {
      filters.push({
        subscriberId: {
          $in: subscriberIds,
        },
      });
    }

    if (search) {
      filters.push(
        {
          email: {
            $regex: regExpEscape(search),
            $options: 'i',
          },
        },
        {
          subscriberId: { $eq: search },
        }
      );
    }

    return await this.find(
      {
        _environmentId: environmentId,
        $or: filters,
      },
      '_id'
    );
  }

  async delete(query: SubscriberQuery) {
    const foundSubscriber = await this.findOne({
      _environmentId: query._environmentId,
      subscriberId: query.subscriberId,
    });

    if (!foundSubscriber) {
      throw new DalException(`Could not find subscriber ${query.subscriberId} to delete`);
    }

    const requestQuery: SubscriberQuery = {
      _environmentId: foundSubscriber._environmentId,
      subscriberId: foundSubscriber.subscriberId,
    };

    await this.subscriber.delete(requestQuery);
  }

  async findDeleted(query: SubscriberQuery) {
    const requestQuery: SubscriberQuery = {
      _environmentId: query._environmentId,
      subscriberId: query.subscriberId,
    };

    const res = await this.subscriber.findDeleted(requestQuery);

    return this.mapEntity(res);
  }
}
function mapToSubscriberObject(subscriberId: string) {
  return { subscriberId };
}
function regExpEscape(literalString: string): string {
  return literalString.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, '\\$&');
}
