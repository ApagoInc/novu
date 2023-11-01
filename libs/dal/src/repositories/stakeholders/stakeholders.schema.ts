import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import * as mongooseDelete from 'mongoose-delete';

import { schemaOptions } from '../schema-default.options';
import { StakeholdersDBModel } from './stakeholders.entity';

const stakeholdersSchema = new Schema<StakeholdersDBModel>(
  {
    jobId: { type: Schema.Types.String, index: true, required: true },
    stage: { type: Schema.Types.String, required: true },
    parts: [Schema.Types.String],
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

stakeholdersSchema.virtual('subscriber', {
  ref: 'Subscriber',
  localField: '_subscriberId',
  foreignField: '_id',
  justOne: true,
});

stakeholdersSchema.plugin(mongooseDelete, { deletedAt: true, deletedBy: true, overrideMethods: 'all' });

// eslint-disable-next-line @typescript-eslint/naming-convention
export const stakeholders =
  (mongoose.models.stakeholders as mongoose.Model<StakeholdersDBModel>) ||
  mongoose.model<StakeholdersDBModel>('stakeholders', stakeholdersSchema);
