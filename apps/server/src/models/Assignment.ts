import mongoose, { Schema, type Document } from 'mongoose';
import { JobStatus, QuestionType, type DifficultyDistribution } from '@vedaai/shared';

export interface IAssignment extends Document {
  title: string;
  subject?: string;
  grade?: string;
  dueDate: Date;
  questionTypes: QuestionType[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  difficultyDistribution: DifficultyDistribution;
  instructions?: string;
  fileUrl?: string;
  fileName?: string;
  status: JobStatus;
  generatedPaperId?: mongoose.Types.ObjectId;
  jobId?: string;
}

const difficultyDistributionSchema = new Schema<DifficultyDistribution>(
  {
    easy: { type: Number, required: true, min: 0, max: 100 },
    medium: { type: Number, required: true, min: 0, max: 100 },
    hard: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

const assignmentSchema = new Schema<IAssignment>(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    grade: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    questionTypes: {
      type: [{ type: String, enum: Object.values(QuestionType) }],
      required: [true, 'At least one question type is required'],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'At least one question type must be selected',
      },
    },
    numberOfQuestions: {
      type: Number,
      required: [true, 'Number of questions is required'],
      min: [1, 'Must have at least 1 question'],
      max: [100, 'Cannot exceed 100 questions'],
    },
    marksPerQuestion: {
      type: Number,
      required: [true, 'Marks per question is required'],
      min: [1, 'Marks must be at least 1'],
      max: [50, 'Marks cannot exceed 50'],
    },
    difficultyDistribution: {
      type: difficultyDistributionSchema,
      required: [true, 'Difficulty distribution is required'],
      validate: {
        validator: (v: DifficultyDistribution) => v.easy + v.medium + v.hard === 100,
        message: 'Difficulty distribution must sum to 100',
      },
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    fileUrl: { type: String },
    fileName: { type: String },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING,
    },
    generatedPaperId: {
      type: Schema.Types.ObjectId,
      ref: 'GeneratedPaper',
    },
    jobId: { type: String },
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

assignmentSchema.index({ status: 1 });
assignmentSchema.index({ createdAt: -1 });

export const AssignmentModel = mongoose.model<IAssignment>('Assignment', assignmentSchema);
