import { Schema, model, type Document, type Types } from 'mongoose';

export type IAttachment = Document & {
    _id: Types.ObjectId;
    task: Types.ObjectId;
    project: Types.ObjectId;
    uploadedBy: Types.ObjectId;
    originalName: string;
    fileName: string;
    mimeType: string;
    size: number;
    path: string;
    createdAt: Date;
    updatedAt: Date;
};

const attachmentSchema = new Schema<IAttachment>(
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
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        originalName: {
            type: String,
            required: true,
            trim: true
        },
        fileName: {
            type: String,
            required: true,
            trim: true
        },
        mimeType: {
            type: String,
            required: true,
            trim: true
        },
        size: {
            type: Number,
            required: true
        },
        path: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const AttachmentModel = model<IAttachment>('Attachment', attachmentSchema);