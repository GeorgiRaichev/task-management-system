import { Schema, model, type Document, type Types } from 'mongoose';

export enum ProjectGroupMemberRole {
    MEMBER = 'member',
    MANAGER = 'manager'
}

export type IProjectGroupMember = {
    user: Types.ObjectId;
    role: ProjectGroupMemberRole;
};

export type IProjectGroup = Document & {
    _id: Types.ObjectId;
    name: string;
    project: Types.ObjectId;
    createdBy: Types.ObjectId;
    members: IProjectGroupMember[];
    createdAt: Date;
    updatedAt: Date;
};

const projectGroupMemberSchema = new Schema<IProjectGroupMember>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: Object.values(ProjectGroupMemberRole),
            default: ProjectGroupMemberRole.MEMBER
        }
    },
    {
        _id: false
    }
);

const projectGroupSchema = new Schema<IProjectGroup>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        members: {
            type: [projectGroupMemberSchema],
            default: []
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const ProjectGroupModel = model<IProjectGroup>('ProjectGroup', projectGroupSchema);