import {
  GetSubscriberPreference,
  GetSubscriberTemplatePreference,
  UpdateSubscriber,
  CreateSubscriber,
} from '@novu/application-generic';

import { GetInformativeSubscriptions } from './get-informative-subscriptions';
import { SetInformativeSubscriptions } from './set-informative-subscriptions';
import { GetStakeholders } from './get-stakeholders';
import { SetStakeholders } from './set-stakeholders';
import { StakeholderSubscribers } from './stakeholder-subscribers';
import { InformativeSubscribers } from './informative-subscribers';
import { BatchUpdateStakeholdersForJob } from './batch-update-stakeholders-for-job';
import { GetActiveStakeholdersForJob } from './get-active-stakeholders-for-job';

export const USE_CASES = [
  CreateSubscriber,
  GetInformativeSubscriptions,
  SetInformativeSubscriptions,
  GetStakeholders,
  SetStakeholders,
  StakeholderSubscribers,
  InformativeSubscribers,
  BatchUpdateStakeholdersForJob,
  GetActiveStakeholdersForJob
];
