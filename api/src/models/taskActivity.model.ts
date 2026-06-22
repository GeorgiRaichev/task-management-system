import { Schema, model, type Document, type Types } from 'mongoose';

export enum TaskActivityAction {
    CREATED = 'created',
    UPDATED = 'updated',
    STATUS_CHANGED = 'status_changed',
    ASSIGNED = 'assigned',
    DELETED = 'deleted',
    COMMENT_ADDED = 'comment_added',
    ATTACHMENT_UPLOADED = 'attachment_uploaded'
}

export type ITaskActivity = Document & {
    _id: Types.ObjectId;
    task: Types.ObjectId;
    project: Types.ObjectId;
    user: Types.ObjectId;
    action: TaskActivityAction;
    message: string;
    changes: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
};

const taskActivitySchema = new Schema<ITaskActivity>(
    {
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: true
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        action: {
            type: String,
            enum: Object.values(TaskActivityAction),
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        changes: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const TaskActivityModel = model<ITaskActivity>('TaskActivity', taskActivitySchema);