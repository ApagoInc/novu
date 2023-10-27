import type { EnvironmentId } from '../environment';
import type { OrganizationId } from '../organization';
import type { ChangePropsValueType } from '../../types/helpers';
import { SubscriberId } from '../subscriber';

export class StakeholdersEntity {
  _id: string;

  jobId: string;

  stage: string;

  parts: string[];

  _environmentId: EnvironmentId;

  _organizationId: OrganizationId;

  _subscriberId: SubscriberId;
}

export type StakeholdersDBModel = ChangePropsValueType<
  StakeholdersEntity,
  '_environmentId' | '_organizationId' | '_subscriberId'
>;
