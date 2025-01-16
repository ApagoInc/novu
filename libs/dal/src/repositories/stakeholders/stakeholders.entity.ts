import type { EnvironmentId } from '../environment';
import type { OrganizationId } from '../organization';
import type { ChangePropsValueType } from '../../types/helpers';
import { SubscriberId } from '../subscriber';

/**
 * @class StakeholdersEntity
 * 
 * @description A class that represents a SINGLE subscription of a stakeholder to a given stage of a job.
 * (The class would almost be better named as "StakeholderSingleSubscriptionEntity")
 */
export class StakeholdersEntity {
  _id: string;

  jobId: string;

  stage: string;

  parts: string[];

  _environmentId: EnvironmentId;

  _organizationId: OrganizationId;

  _subscriberId: SubscriberId;

  unconfirmed: boolean;
}

export type StakeholdersDBModel = ChangePropsValueType<
  StakeholdersEntity,
  '_environmentId' | '_organizationId' | '_subscriberId'
>;
