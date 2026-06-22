import { Router } from 'express';
import { commentsController } from '../controllers/comments.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateCommentSchema } from '../validators/comment.validator.js';

const router = Router();

router.use(authenticate);

router.get('/:commentId', commentsController.getComment);
router.put('/:commentId', validate(updateCommentSchema), commentsController.updateComment);
router.delete('/:commentId', commentsController.deleteComment);

export default router;