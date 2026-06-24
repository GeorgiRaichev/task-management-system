import type { User } from '../auth/types';

export type TaskAttachment = {
    _id: string;
    task: string;
    project: string;
    uploadedBy?: User;
    originalName: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    size: number;
    createdAt: string;
    updatedAt: string;
};

export type TaskAttachmentsResponse = {
    attachments: TaskAttachment[];
};

export type TaskAttachmentResponse = {
    message: string;
    attachment: TaskAttachment;
};

export type UploadTaskAttachmentRequest = {
    taskId: string;
    file: File;
};