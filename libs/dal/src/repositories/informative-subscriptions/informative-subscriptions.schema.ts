import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import * as mongooseDelete from 'mongoose-delete';

import { schemaOptions } from '../schema-default.options';
import { InformativeSubscriptionsDBModel } from './informative-subscriptions.entity';

const informativeSubscriptionsSchema = new Schema<InformativeSubscriptionsDBModel>(
  {
    accountId: Schema.Types.String,
    parts: [Schema.Types.String],
    allTitles: Schema.Types.Boolean,
    _templateId: {
      type: Schema.Types.ObjectId,
      ref: 'NotificationTemplate',
      required: true,
    },
    _subscriberId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscriber',
      index: true,
      required: true,
    },
    _organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    _environmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Environment',
      index: true,
    },
  },
  schemaOptions
);

informativeSubscriptionsSchema.virtual('template', {
  ref: 'NotificationTemplate',
  localField: '_templateId',
  foreignField: '_id',
  justOne: true,
});

informativeSubscriptionsSchema.virtual('preferences', {
  ref: 'SubscriberPreference',
  localField: '_templateId',
  foreignField: '_templateId',
  justOne: true,
});

informativeSubscriptionsSchema.virtual('subscriber', {
  ref: 'Subscriber',
  localField: '_subscriberId',
  foreignField: '_id',
  justOne: true,
});

informativeSubscriptionsSchema.plugin(mongooseDelete, { deletedAt: true, deletedBy: true, overrideMethods: 'all' });

// eslint-disable-next-line @typescript-eslint/naming-convention
export const InformativeSubscriptions =
  (mongoose.models.InformativeSubscriptions as mongoose.Model<InformativeSubscriptionsDBModel>) ||
  mongoose.model<InformativeSubscriptionsDBModel>('InformativeSubscriptions', informativeSubscriptionsSchema);
