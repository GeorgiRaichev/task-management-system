import { NotificationModel, NotificationType } from '../models/notification.model.js';

type CreateNotificationData = {
    recipientId: string;
    senderId?: string;
    projectId?: string;
    taskId?: string;
    type?: NotificationType;
    title: string;
    message: string;
};

export const createNotification = async ({
    recipientId,
    senderId,
    projectId,
    taskId,
    type = NotificationType.GENERAL,
    title,
    message
}: CreateNotificationData) => {
    return NotificationModel.create({
        recipient: recipientId,
        sender: senderId,
        project: projectId,
        task: taskId,
        type,
        title,
        message
    });
};