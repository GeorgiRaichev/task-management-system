import { Router } from 'express';
import { upload } from '../config/upload.js';
import { attachmentsController } from '../controllers/attachments.controller.js';
import { commentsController } from '../controllers/comments.controller.js';
import { taskActivitiesController } from '../controllers/taskActivities.controller.js';
import { tasksController } from '../controllers/tasks.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCommentSchema } from '../validators/comment.validator.js';
import { createTaskActivitySchema } from '../validators/taskActivity.validator.js';
import { updateTaskSchema } from '../validators/task.validator.js';

const router = Router();

router.use(authenticate);

router.get('/:taskId/comments', commentsController.getTaskComments);
router.post('/:taskId/comments', validate(createCommentSchema), commentsController.createComment);
router.get('/:taskId/attachments', attachmentsController.getTaskAttachments);
router.post('/:taskId/attachments', upload.single('file'), attachmentsController.uploadAttachment);
router.get('/:taskId/activity', taskActivitiesController.getTaskActivities);
router.post(
    '/:taskId/activity',
    validate(createTaskActivitySchema),
    taskActivitiesController.createActivity
);
router.get('/:taskId', tasksController.getTask);
router.put('/:taskId', validate(updateTaskSchema), tasksController.updateTask);
router.delete('/:taskId', tasksController.deleteTask);

export default router;