import { Schema, model, type Document, type Types } from "mongoose";

export enum ProjectStatus {
  PLANNED = "planned",
  ACTIVE = "active",
  COMPLETED = "completed",
  ARCHIVED = "archived",
}

export type IProject = Document & {
  _id: Types.ObjectId;
  name: string;
  description: string;
  deadline: Date;
  status: ProjectStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.PLANNED,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ProjectModel = model<IProject>("Project", projectSchema);