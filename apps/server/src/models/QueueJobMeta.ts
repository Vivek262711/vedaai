import mongoose, { Schema, type Document } from 'mongoose';
import { JobStatus } from '@vedaai/shared';

export interface IQueueJobMeta extends Document {
  jobId: string;
  assignmentId: mongoose.Types.ObjectId;
  status: JobStatus;
  progress: number;
  attempts: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  paperId?: mongoose.Types.ObjectId;
}

const queueJobMetaSchema = new Schema<IQueueJobMeta>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    paperId: {
      type: Schema.Types.ObjectId,
      ref: 'GeneratedPaper',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        (ret as Record<string, unknown>).__v = undefined;
        return ret;
      },
    },
  },
);

export const QueueJobMetaModel = mongoose.model<IQueueJobMeta>('QueueJobMeta', queueJobMetaSchema);
