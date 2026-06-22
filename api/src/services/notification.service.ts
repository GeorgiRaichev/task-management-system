import { Types } from 'mongoose';
import { NotificationModel, NotificationType } from '../models/notification.model.js';
import { socketService } from './socket.service.js';

type CreateNotificationData = {
    recipientId: string;
    senderId?: string;
    projectId?: string;
    taskId?: string;
    type?: NotificationType;
    title: string;
    message: string;
};

type NotificationCreatePayload = {
    recipient: Types.ObjectId;
    sender?: Types.ObjectId;
    project?: Types.ObjectId;
    task?: Types.ObjectId;
    type: NotificationType;
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
    const notificationPayload: NotificationCreatePayload = {
        recipient: new Types.ObjectId(recipientId),
        type,
        title,
        message
    };

    if (senderId) {
        notificationPayload.sender = new Types.ObjectId(senderId);
    }

    if (projectId) {
        notificationPayload.project = new Types.ObjectId(projectId);
    }

    if (taskId) {
        notificationPayload.task = new Types.ObjectId(taskId);
    }

    const notification = await NotificationModel.create(notificationPayload);

    const populatedNotification = await NotificationModel.findById(notification._id)
        .populate('recipient', 'firstName lastName email role')
        .populate('sender', 'firstName lastName email role')
        .populate('project', 'name status deadline')
        .populate('task', 'title status priority');

    socketService.emitToUser(recipientId, 'notification:new', populatedNotification);

    return populatedNotification;
};