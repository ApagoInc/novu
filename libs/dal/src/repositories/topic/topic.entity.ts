import { Types } from 'mongoose';

import { EnvironmentId, OrganizationId, TopicId, TopicKey, TopicName } from './types';

export class TopicEntity {
  _id: TopicId;
  _environmentId: EnvironmentId;
  _organizationId: OrganizationId;
  _templateId?: string;
  key: TopicKey;
  name: TopicName;
}

export type TopicDBModel = Omit<TopicEntity, '_environmentId' | '_organizationId'> & {
  _environmentId: Types.ObjectId;
  _templateId?: Types.ObjectId;
  _organizationId: Types.ObjectId;
};
