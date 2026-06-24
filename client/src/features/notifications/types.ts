import type { User } from '../auth/types';

export type NotificationProject = {
    _id: string;
    name: string;
    status?: string;
    deadline?: string;
};

export type NotificationTask = {
    _id: string;
    title: string;
    status?: string;
    priority?: string;
};

export type AppNotification = {
    _id: string;
    recipient: User;
    sender?: User;
    project?: NotificationProject;
    task?: NotificationTask;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
};

export type NotificationsResponse = {
    notifications: AppNotification[];
};

export type NotificationResponse = {
    notification: AppNotification;
};

export type CreateNotificationRequest = {
    recipientId: string;
    senderId?: string;
    projectId?: string;
    taskId?: string;
    type?: string;
    title: string;
    message: string;
};