import { Schema, model, type Document, type Types } from 'mongoose';

export type IComment = Document & {
    _id: Types.ObjectId;
    task: Types.ObjectId;
    project: Types.ObjectId;
    author: Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
};

const commentSchema = new Schema<IComment>(
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
        author: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 2000
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const CommentModel = model<IComment>('Comment', commentSchema);