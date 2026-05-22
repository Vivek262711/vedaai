import mongoose, { Schema, type Document } from 'mongoose';
import { Difficulty, QuestionType } from '@vedaai/shared';

export interface IQuestion {
  id: string;
  question: string;
  marks: number;
  difficulty: Difficulty;
  type: QuestionType;
  options?: string[];
  answer?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IGeneratedPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  title: string;
  instructions: string;
  totalMarks: number;
  duration?: string;
  sections: ISection[];
}

const questionSchema = new Schema<IQuestion>(
  {
    id: { type: String, required: true },
    question: { type: String, required: true },
    marks: { type: Number, required: true, min: 1 },
    difficulty: {
      type: String,
      enum: Object.values(Difficulty),
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
    },
    options: [{ type: String }],
    answer: { type: String },
  },
  { _id: false },
);

const sectionSchema = new Schema<ISection>(
  {
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (v: IQuestion[]) => v.length > 0,
        message: 'Section must have at least one question',
      },
    },
  },
  { _id: false },
);

const generatedPaperSchema = new Schema<IGeneratedPaper>(
  {
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    instructions: { type: String, required: true },
    totalMarks: { type: Number, required: true, min: 0 },
    duration: { type: String },
    sections: {
      type: [sectionSchema],
      required: true,
      validate: {
        validator: (v: ISection[]) => v.length > 0,
        message: 'Paper must have at least one section',
      },
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

export const GeneratedPaperModel = mongoose.model<IGeneratedPaper>('GeneratedPaper', generatedPaperSchema);
