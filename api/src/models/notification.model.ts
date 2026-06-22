import { Schema, model, type Document, type Types } from 'mongoose';

export enum NotificationType {
    TASK_ASSIGNED = 'task_assigned',
    TASK_UPDATED = 'task_updated',
    TASK_STATUS_CHANGED = 'task_status_changed',
    PROJECT_UPDATED = 'project_updated',
    GENERAL = 'general'
}

export type INotification = Document & {
    _id: Types.ObjectId;
    recipient: Types.ObjectId;
    sender?: Types.ObjectId;
    project?: Types.ObjectId;
    task?: Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
};

const notificationSchema = new Schema<INotification>(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            default: null
        },
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            default: null
        },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            default: NotificationType.GENERAL
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150
        },
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 1000
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const NotificationModel = model<INotification>('Notification', notificationSchema);