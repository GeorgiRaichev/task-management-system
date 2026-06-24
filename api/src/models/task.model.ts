import { Schema, model, type Document, type Types } from 'mongoose';

export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in_progress',
    REVIEW = 'review',
    DONE = 'done'
}

export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

export type ITask = Document & {
    _id: Types.ObjectId;
    title: string;
    description: string;
    project: Types.ObjectId;
    assignedTo?: Types.ObjectId | null;
    createdBy: Types.ObjectId;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
};

const taskSchema = new Schema<ITask>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150
        },
        description: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 1500
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        priority: {
            type: String,
            enum: Object.values(TaskPriority),
            default: TaskPriority.MEDIUM
        },
        status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.TODO
        },
        dueDate: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const TaskModel = model<ITask>('Task', taskSchema);