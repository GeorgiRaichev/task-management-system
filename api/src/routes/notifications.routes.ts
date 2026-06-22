import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createNotificationSchema } from '../validators/notification.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationsController.getNotifications);
router.post('/', validate(createNotificationSchema), notificationsController.createNotification);
router.put('/read-all', notificationsController.markAllAsRead);
router.put('/:notificationId/read', notificationsController.markAsRead);
router.delete('/:notificationId', notificationsController.deleteNotification);

export default router;