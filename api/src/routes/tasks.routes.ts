import { Router } from 'express';
import { tasksController } from '../controllers/tasks.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateTaskSchema } from '../validators/task.validator.js';

const router = Router();

router.use(authenticate);

router.get('/:taskId', tasksController.getTask);
router.put('/:taskId', validate(updateTaskSchema), tasksController.updateTask);
router.delete('/:taskId', tasksController.deleteTask);

export default router;