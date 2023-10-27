import type { EnvironmentId } from '../environment';
import type { OrganizationId } from '../organization';
import type { ChangePropsValueType } from '../../types/helpers';
import { SubscriberId } from '../subscriber';

export class InformativeSubscriptionsEntity {
  _id: string;

  accountId: string;

  parts: string[];

  allTitles?: boolean;

  _environmentId: EnvironmentId;

  _organizationId: OrganizationId;

  _subscriberId: SubscriberId;

  _templateId: string;
}

export type InformativeSubscriptionsDBModel = ChangePropsValueType<
  InformativeSubscriptionsEntity,
  '_environmentId' | '_organizationId' | '_subscriberId' | '_templateId'
>;
