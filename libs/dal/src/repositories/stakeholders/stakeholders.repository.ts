import { SoftDeleteModel } from 'mongoose-delete';

import { BaseRepository } from '../base-repository';
import { StakeholdersDBModel, StakeholdersEntity } from './stakeholders.entity';
import { stakeholders } from './stakeholders.schema';
import type { EnforceEnvOrOrgIds } from '../../types/enforce';

export class StakeholdersRepository extends BaseRepository<
  StakeholdersDBModel,
  StakeholdersEntity,
  EnforceEnvOrOrgIds
> {
  private stakeholders: SoftDeleteModel;
  constructor() {
    super(stakeholders, StakeholdersEntity);
    this.stakeholders = stakeholders;
  }

  async getStakeholders(query: { _environmentId: string; _organizationId: string; jobId: string }) {
    const stakeholders = await this.MongooseModel.aggregate([
      {
        $addFields: {
          stages: {
            parts: '$parts',
            stage: '$stage',
          },
        },
      },
      {
        $match: {
          jobId: query.jobId,
          _environmentId: this.convertStringToObjectId(query._environmentId),
          _organizationId: this.convertStringToObjectId(query._organizationId),
        },
      },
      {
        $group: {
          _id: '$_subscriberId',
          stages: { $addToSet: '$stages' },
        },
      },
      {
        $lookup: {
          from: 'subscribers',
          localField: '_id',
          foreignField: '_id',
          as: 'subscriber',
        },
      },
      { $unwind: '$subscriber' },
    ]);

    return stakeholders;
  }

  async getSubscribers(query: {
    _environmentId: string;
    _organizationId: string;
    jobId: string;
    part: string;
    stage: string;
  }) {
    const subscribers = await this.MongooseModel.find({ ...query, parts: query.part })
      .select('_subscriberId subscriber')
      .populate<{ subscriber: { subscriberId: string } }>('subscriber', 'subscriberId')
      .lean();

    return subscribers;
  }
}
