import { Router } from 'express';
import { upload } from '../config/upload.js';
import { attachmentsController } from '../controllers/attachments.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/:attachmentId', attachmentsController.getAttachment);
router.delete('/:attachmentId', attachmentsController.deleteAttachment);

export default router;